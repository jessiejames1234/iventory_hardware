import { requireRole, logout } from "./auth.js";
import { openReviewModal } from "./modules/stock_adjustment_modal.js";

const user = requireRole(["admin","warehouse_manager","warehouse_clerk","store_clerk"]); // ✅ added store_clerk
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

// ✅ permission flags
const canApprove = (user.role === "admin" || user.role === "warehouse_manager");

// Pick location from login payload for manager/clerk; admin => main store
const locationId =
  (user.role === "warehouse_manager" || user.role === "warehouse_clerk")
    ? Number(user.assigned_location_id || 0)
    : 1; // main_store for admin

// caches per location
let productsCache = [];            // [{product_id, product_name, sku, old_quantity}]
let productMap    = new Map();     // product_id -> row

document.addEventListener("DOMContentLoaded", () => {
  const n = document.getElementById("logged-user");
  if(n) n.textContent = user.name;
  document.getElementById("btn-logout")?.addEventListener("click", logout);

  wireBuilderUI();
  loadProductsForLocation();
  loadAdjustmentList();
});

    /* ========= builder ========= */
function wireBuilderUI(){
  document.getElementById("btn-add-row")?.addEventListener("click", addRowFromHeaderSelect);
  document.getElementById("btn-submit-request")?.addEventListener("click", reviewAndSave);
}

    async function loadProductsForLocation(){
    const res = await axios.get(`${baseApiUrl}/stock_adjustment.php`, {
        params: { operation: "getProductsForLocation", json: JSON.stringify({ staffId: user.staff_id }) }
    });
    productsCache = Array.isArray(res.data) ? res.data : [];
    productMap = new Map(productsCache.map(p => [Number(p.product_id), p]));

    // fill the header select with all products for this location
    const headSel = document.getElementById("supplier-select");
    if (headSel){
        headSel.innerHTML = `<option value="">— List of all prooduct —</option>` +
        productsCache.map(p => `<option value="${p.product_id}">${(p.sku||"").trim()} ${p.product_name} (Qty: ${p.old_quantity})</option>`).join("");
    }
    }

    function showBuilder(show){
    const tbl = document.getElementById("request-table");
    const btn = document.getElementById("btn-submit-request");
    if(tbl) tbl.style.display = show ? "" : "none";
    if(btn) btn.style.display = show ? "" : "none";
    }

    function builderBody(){
    return document.querySelector("#request-table tbody") || (() => {
        const tbl = document.getElementById("request-table");
        if (!tbl) return null;
        const tb = document.createElement("tbody");
        tbl.appendChild(tb);
        return tb;
    })();
    }
function ensureDetailsPanel() {
  let panel = document.getElementById("adj-details-panel");
  if (panel) return panel;

  const tpl = document.createElement("div");
  tpl.innerHTML = `
    <div class="offcanvas offcanvas-end" tabindex="-1" id="adj-details-panel" aria-labelledby="adj-details-title">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="adj-details-title">Adjustment Details</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        <div id="adj-details-meta" class="small text-muted mb-3"></div>
        <div class="table-responsive">
          <table class="table table-sm table-bordered">
            <thead class="table-light">
              <tr>
                <th style="width:40%;">Product</th>
                <th class="text-end" style="width:12%;">Old</th>
                <th class="text-end" style="width:12%;">Change</th>
                <th class="text-end" style="width:12%;">New</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody id="adj-details-body">
              <tr><td colspan="5" class="text-center small text-muted py-3">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="offcanvas-footer p-3 border-top d-flex gap-2 justify-content-end">
        ${canApprove ? `<button class="btn btn-success btn-approve-panel">Approve</button>` : ``}
        <button class="btn btn-secondary" data-bs-dismiss="offcanvas">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(tpl.firstElementChild);
  return document.getElementById("adj-details-panel");
}

async function openDetailsPanel(adjustmentId) {
  const panel = ensureDetailsPanel();
  const off = new bootstrap.Offcanvas(panel);

  const metaEl = panel.querySelector("#adj-details-meta");
  const bodyEl = panel.querySelector("#adj-details-body");
  metaEl.innerHTML = `Loading…`;
  bodyEl.innerHTML = `<tr><td colspan="5" class="text-center small text-muted py-3">Loading…</td></tr>`;

  try {
    const res = await axios.get(`${baseApiUrl}/stock_adjustment.php`, {
      params: { operation:"getAdjustment", json: JSON.stringify({ adjustmentId }) }
    });
    const t = res.data || {};
    const h = t.header || {};
    const items = Array.isArray(t.items) ? t.items : [];

    document.getElementById("adj-details-title").textContent =
      `Adjustment #${h.adjustment_id ?? adjustmentId} — ${h.reference_no ?? ""}`;
    metaEl.innerHTML = `
      <div><b>Location:</b> ${h.location_name ?? "-"}</div>
      <div><b>Status:</b> ${h.status ?? "-"}</div>
      <div><b>Created:</b> ${h.created_at ? new Date(h.created_at).toLocaleString() : "-"}</div>
    `;

    bodyEl.innerHTML = items.length
      ? items.map(i => `
          <tr>
            <td>${(i.sku||"")} ${i.product_name}</td>
            <td class="text-end">${i.old_quantity}</td>
            <td class="text-end">${i.change_quantity}</td>
            <td class="text-end">${i.new_quantity}</td>
            <td>${i.reason ? i.reason : ""}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="5" class="text-center small text-muted py-3">(no items)</td></tr>`;

    const btnApprove = panel.querySelector(".btn-approve-panel");
    if (btnApprove) {
      btnApprove.disabled = (h.status === "approve");
      btnApprove.onclick = async () => {
        if (!canApprove) {
          return Swal.fire("Not allowed","Only Admin or Warehouse Manager can approve.","info");
        }
        const ok = await Swal.fire({title:"Approve this adjustment?", icon:"question", showCancelButton:true});
        if(!ok.isConfirmed) return;

        const fd = new FormData();
        fd.append("operation","approve");
        fd.append("json", JSON.stringify({ adjustmentId, approveBy: user.staff_id }));
        const res = await axios({ url:`${baseApiUrl}/stock_adjustment.php`, method:"POST", data: fd });

        if(res.data === 1){
          Swal.fire("OK","Adjustment approved & applied.","success");
          off.hide();
          await loadAdjustmentList();
          await loadProductsForLocation();
        }else{
          Swal.fire("Error", res.data?.message || "Failed", "error");
        }
      };
    }

    off.show();
  } catch (err) {
    console.error(err);
    Swal.fire("Error","Failed to load details.","error");
  }
}


    function addRowFromHeaderSelect(){
    // ensure we have products
    if (!productsCache.length){
        return Swal.fire("No products","No inventory at this location.","info");
    }
    const selectedPid = Number(document.getElementById("supplier-select")?.value || 0);
    addRow(selectedPid || "");
    }

    function addRow(defaultPid = ""){
    const tbody = builderBody();
    if(!tbody) return;
    showBuilder(true);

    const options = ['<option value="">— Select product —</option>']
        .concat(productsCache.map(p => `<option value="${p.product_id}">${(p.sku||"").trim()} ${p.product_name}</option>`))
        .join("");

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>
        <select class="form-select form-select-sm sel-product">${options}</select>
        </td>
        <td class="text-end td-old">-</td>
        <td style="max-width:160px;">
    <input
    type="text"
    class="form-control form-control-sm inp-chg"
    value="0"
    inputmode="tel"       
    autocomplete="off"
    >

        </td>
        <td class="text-end td-new">-</td>
        <td style="max-width:220px;">
        <input type="text" class="form-control form-control-sm inp-reason" placeholder="Reason (optional)">
        </td>
    `;
    tbody.appendChild(tr);

    const sel = tr.querySelector(".sel-product");
    const oldEl = tr.querySelector(".td-old");
    const newEl = tr.querySelector(".td-new");
    const chgEl = tr.querySelector(".inp-chg");

    function recalc(){
        const pid = Number(sel.value || 0);
        if(!pid){ oldEl.textContent="-"; newEl.textContent="-"; return; }
        const old = Number(productMap.get(pid)?.old_quantity || 0);
        const chg = Number(chgEl.value || 0);
        oldEl.textContent = String(old);
        newEl.textContent = String(old + chg);
    }

    sel.addEventListener("change", recalc);
chgEl.addEventListener("input", () => {
  // sanitize: optional leading "-" + digits only
  let v = chgEl.value.trim().replace(/[^\d-]/g, "");
  v = v.replace(/(?!^)-/g, "");
  if (v !== "" && v !== "-" && !/^-?\d+$/.test(v)) v = "0";
  chgEl.value = v;

  const pid  = Number(sel.value);
  const old  = Number(productMap.get(pid)?.old_quantity || 0);

  // treat lone "-" as 0 during preview
  let chg = (v === "-") ? 0 : Number(v || 0);

  // ---------- LOWER BOUND: do not let new drop below 0 ----------
  const unclampedNew = old + chg;
  const warnBelowZero = (unclampedNew < 0);
  if (warnBelowZero) {
    chg = -old;                // clamp
    chgEl.value = String(chg);
  }

  // ---------- OPTIONAL UPPER CAP (if you want one) ----------
  // If you want to cap to a max *new quantity*, set data-max-new on the input:
  //   <input ... data-max-new="100">
  // Then we'll clamp: new <= maxNew  =>  chg <= maxNew - old
  const maxNew = Number(chgEl.dataset.maxNew || "");
  let hitUpper = false;
  if (!Number.isNaN(maxNew) && maxNew > 0) {
    const maxIncrease = maxNew - old;
    if (chg > maxIncrease) {
      chg = maxIncrease;
      chgEl.value = String(chg);
      hitUpper = true;
    }
  }

  const newQty = old + chg;

  // UI feedback
  oldEl.textContent = String(old);
  newEl.textContent = String(newQty);

  // warning styling
  newEl.classList.toggle("text-danger", warnBelowZero);
  chgEl.classList.toggle("is-invalid", warnBelowZero || hitUpper);
  chgEl.title = warnBelowZero
    ? "New quantity can't go below 0. Value was clamped."
    : (hitUpper ? "Reached maximum allowed new quantity." : "");
});



    if (defaultPid) { sel.value = String(defaultPid); recalc(); }
    }

    /* ========= modal & save ========= */
    async function reviewAndSave(){
    const rows = [];
    document.querySelectorAll("#request-table tbody tr").forEach(tr => {
        const pid = Number(tr.querySelector(".sel-product")?.value || 0);
        const chg = Number(tr.querySelector(".inp-chg")?.value || 0);
        const reason = String(tr.querySelector(".inp-reason")?.value || "").trim();
        if(!pid) return;
        const prod = productMap.get(pid);
        const oldQty = Number(prod?.old_quantity || 0);
        rows.push({
        productId: pid,
        name: `${(prod?.sku||"")} ${prod?.product_name||""}`,
        oldQty, changeQty: chg, newQty: oldQty + chg,
        reason
        });
    });
    if(!rows.length){ return Swal.fire("No items","Add at least one product.","warning"); }

    const finalLines = await openReviewModal({ locationId, lines: rows });
    if(!finalLines) return; // user closed

    // 1) create header (pending)
    const fd1 = new FormData();
    fd1.append("operation","createDraft");
    fd1.append("json", JSON.stringify({ locationId, createdBy: user.staff_id }));
    const r1 = await axios({ url: `${baseApiUrl}/stock_adjustment.php`, method:"POST", data: fd1 });
    const adjId = Number(r1.data || 0);
    if(!adjId){ return Swal.fire("Error","Failed to create adjustment header.","error"); }

    // 2) add lines
    const fd2 = new FormData();
    fd2.append("operation","addDraftItems");
    fd2.append("json", JSON.stringify({ adjustmentId: adjId, items: finalLines.map(l => ({
        productId: l.productId,
        oldQty: l.oldQty,
        changeQty: l.changeQty,
        reason: l.reason || ""
    }))}));
    const r2 = await axios({ url: `${baseApiUrl}/stock_adjustment.php`, method:"POST", data: fd2 });
    if(r2.data !== 1){ return Swal.fire("Error", r2.data?.message || "Failed to add items.", "error"); }

    Swal.fire("Saved", `Adjustment #${adjId} created as Pending.`, "success");

    // reset builder
    const tb = document.querySelector("#request-table tbody"); if (tb) tb.innerHTML = "";
    showBuilder(false);

    // refresh cache & list so quantities reflect current inventory next time
    await loadProductsForLocation();
    await loadAdjustmentList();
    }

    /* ========= list (2nd card) ========= */
    async function loadAdjustmentList(){
    const res = await axios.get(`${baseApiUrl}/stock_adjustment.php`, {
        params: { operation: "getAllAdjustments", json: JSON.stringify({ staffId: user.staff_id }) }
    });
    const rows = Array.isArray(res.data) ? res.data : [];
    renderList(rows);     
    }


function renderList(rows){
  const host = document.getElementById("stockin-table-div");
  if(!host) return;
  host.innerHTML = "";

  const table = document.createElement("table");
  table.className = "table table-hover table-striped table-sm align-middle m-0";
  table.innerHTML = `
    <thead class="table-light">
      <tr>
        <th>#</th><th>Reference</th><th>Location</th><th>Status</th><th>Items</th><th>Created</th>
        <th class="text-end">Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tb = table.querySelector("tbody");

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.adjustment_id}</td>
      <td>${r.reference_no}</td>
      <td>${r.location_name}</td>
      <td><span class="badge ${r.status==='approve'?'text-bg-success':'text-bg-secondary'}">${r.status}</span></td>
      <td>${r.item_count}</td>
      <td>${new Date(r.created_at).toLocaleString()}</td>
      <td class="text-end d-flex gap-2 justify-content-end">
        <button class="btn btn-outline-secondary btn-sm btn-details">Details</button>
        ${canApprove ? `<button class="btn btn-success btn-sm btn-approve"${r.status==='approve'?' disabled':''}>Approve</button>` : ``}
      </td>
    `;

// inside renderList loop
tr.querySelector(".btn-details")?.addEventListener("click", async () => {
  const { openAdjustmentDetailsModal } = await import("./modules/stock_adjustment_modal.js");
  const result = await openAdjustmentDetailsModal({
    adjustmentId: r.adjustment_id,
    canApprove,
    baseApiUrl,
    approverStaffId: user.staff_id,
  });
  // Optional: refresh after modal closes (safe even if not approved)
  if (result?.approved) {
    await loadAdjustmentList();
    await loadProductsForLocation();
  }
});

    tr.querySelector(".btn-approve")?.addEventListener("click", async () => {
      if (!canApprove) {
        return Swal.fire("Not allowed","Only Admin or Warehouse Manager can approve.","info");
      }
      const ok = await Swal.fire({title:"Approve this adjustment?", icon:"question", showCancelButton:true});
      if(!ok.isConfirmed) return;

      const fd = new FormData();
      fd.append("operation","approve");
      fd.append("json", JSON.stringify({ adjustmentId: r.adjustment_id, approveBy: user.staff_id }));
      const res = await axios({ url:`${baseApiUrl}/stock_adjustment.php`, method:"POST", data: fd });

      if(res.data === 1){
        Swal.fire("OK","Adjustment approved & applied.","success");
        loadAdjustmentList();
        loadProductsForLocation();
      }else{
        Swal.fire("Error", res.data?.message || "Failed", "error");
      }
    });

    tb.appendChild(tr);
  });

  host.appendChild(table);
}



    async function viewAdjustment(id){
    const res = await axios.get(`${baseApiUrl}/stock_adjustment.php`, {
        params: { operation:"getAdjustment", json: JSON.stringify({ adjustmentId: id }) }
    });
    const t = res.data || {};
    const lines = (t.items||[]).map(i => `${(i.sku||"")} ${i.product_name} — old ${i.old_quantity}, change ${i.change_quantity}, new ${i.new_quantity} (${i.reason||''})`).join("<br>") || "(no items)";
    Swal.fire({
        title: `Adjustment #${t.header?.adjustment_id} — ${t.header?.reference_no}`,
        html: `<div class="text-start">
        <div><b>Location:</b> ${t.header?.location_name}</div>
        <div><b>Status:</b> ${t.header?.status}</div>
        <hr/>${lines}
        </div>`
    });
    }

    async function approveAdjustment(id){
    const ok = await Swal.fire({title:"Approve this adjustment?", icon:"question", showCancelButton:true});
    if(!ok.isConfirmed) return;

    const fd = new FormData();
    fd.append("operation","approve");
    fd.append("json", JSON.stringify({ adjustmentId: id, approveBy: user.staff_id }));
    const res = await axios({ url:`${baseApiUrl}/stock_adjustment.php`, method:"POST", data: fd });

    if(res.data === 1){
        Swal.fire("OK","Adjustment approved & applied.","success");
        loadAdjustmentList();
        // refresh products (quantities changed)
        loadProductsForLocation();
    }else{
        Swal.fire("Error", res.data?.message || "Failed", "error");
    }
    }
