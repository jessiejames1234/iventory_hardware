// modules/purchase_return_modal.js
import { requireRole } from "../auth.js";
const user = requireRole(["warehouse_manager", "warehouse_clerk"]);
const baseApiUrl =
  sessionStorage.getItem("baseApiUrl") ||
  sessionStorage.getItem("baseAPIUrl") ||
  "http://localhost/hardware/api";

// helpers from page
// make helpers available to other modules at runtime
// resolve helpers at call-time (works even if set later)
function H(){ return window.__PR_HELPERS__ || {}; }

// ensure the modal shell exists (create if missing)
function ensureBlankModal(){
  let el = document.getElementById("blank-modal");
  if(!el){
    el = document.createElement("div");
    el.id = "blank-modal";
    el.className = "modal fade";
    el.tabIndex = -1;
    el.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="blank-modal-title" class="modal-title"></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div id="blank-main-div" class="modal-body"></div>
          <div id="blank-modal-footer" class="modal-footer"></div>
        </div>
      </div>`;
    document.body.appendChild(el);
  }
  return el;
}
const nf = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/* ============================
   Review -> create (PENDING)
   ============================ */
export function openPRReviewModal(payload) {
  const suppliers = (window.__PR_PAGE__?.suppliersRef?.() || []);
  const supplierName = suppliers.find((s) => String(s.supplier_id) === String(payload.supplier_id))?.name || "Selected Supplier";

  let rows = "", grand = 0;
  payload.items.forEach((it, idx) => {
    const line = it.return_qty * it.unit_cost; grand += line;
    rows += `
      <tr data-index="${idx}">
        <td>${it.product_label}</td>
        <td class="text-end">${it.available_qty}</td>
        <td style="width:120px;">
          <input type="number" class="form-control form-control-sm rev-qty"
                 min="1" max="${it.available_qty}"
                 value="${Math.min(it.return_qty, it.available_qty)}">
        </td>
        <td style="width:220px;">
          <input type="text" class="form-control form-control-sm rev-note"
                 value="${(it.line_note || "").replace(/"/g, "&quot;")}" placeholder="(optional)">
        </td>
        <td class="text-end">${nf.format(it.unit_cost)}</td>
        <td class="text-end rev-line">${nf.format(line)}</td>
      </tr>
    `;
  });

  const body = `
    <div class="mb-2">
      <div class="small text-muted">Review Purchase Return</div>
      <div><b>Supplier:</b> ${supplierName}</div>
      <div><b>Warehouse:</b> ${user.warehouse_name || "Your Warehouse"}</div>
    </div>
    <div class="table-responsive border rounded">
      <table class="table table-sm align-middle m-0">
        <thead class="table-light">
          <tr>
            <th>Product</th>
            <th class="text-end" style="width:10%;">Available</th>
            <th style="width:12%;">Return Qty</th>
            <th style="width:18%;">Line notes</th>
            <th class="text-end" style="width:16%;">Unit Cost</th>
            <th class="text-end" style="width:16%;">Line Total</th>
          </tr>
        </thead>
        <tbody id="pr-review-body">${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-end fw-semibold">Grand Total</td>
            <td id="pr-review-grand" class="text-end fw-bold">${nf.format(grand)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="mt-2">
      <label class="form-label small text-muted">Remarks</label>
      <input id="pr-review-remarks" class="form-control form-control-sm" placeholder="(optional)">
    </div>
  `;

  document.getElementById("blank-modal-title").textContent = "Review Purchase Return";
  document.getElementById("blank-main-div").innerHTML = body;
  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Back</button>
    <button id="btn-pr-create" type="button" class="btn btn-success">Create (Pending)</button>
  `;

const modalEl = ensureBlankModal();
  modalEl.querySelector(".modal-dialog")?.classList.add("modal-xl", "modal-dialog-scrollable", "modal-dialog-centered", "modal-fullscreen-lg-down");
  document.getElementById("blank-main-div").style.maxHeight = "75vh";
  document.getElementById("blank-main-div").style.overflowY = "auto";
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();

  const tbody = document.getElementById("pr-review-body");
  const grandEl = document.getElementById("pr-review-grand");

  const recalc = () => {
    let g = 0;
    tbody.querySelectorAll("tr").forEach((tr) => {
      const idx = Number(tr.dataset.index);
      const max = payload.items[idx].available_qty;
      let q = Number(tr.querySelector(".rev-qty").value || 0);
      if (q < 1) q = 1;
      if (q > max) q = max;
      payload.items[idx].return_qty = q;
      const line = q * payload.items[idx].unit_cost;
      tr.querySelector(".rev-line").textContent = nf.format(line);
      g += line;
    });
    grandEl.textContent = nf.format(g);
  };

  tbody.addEventListener("input", (e) => {
    if (e.target.classList.contains("rev-qty")) recalc();
  });

  document.getElementById("btn-pr-create").addEventListener("click", async () => {
    tbody.querySelectorAll("tr").forEach((tr) => {
      const idx = Number(tr.dataset.index);
      const note = (tr.querySelector(".rev-note")?.value || "").trim();
      payload.items[idx].line_note = note || null;
      const max = payload.items[idx].available_qty;
      let q = Number(tr.querySelector(".rev-qty").value || 0);
      if (q < 1) q = 1;
      if (q > max) q = max;
      payload.items[idx].return_qty = q;
    });

    const lines = payload.items
      .filter((x) => x.product_id && x.return_qty > 0)
      .map((x) => ({ product_id: x.product_id, return_qty: x.return_qty, unit_cost: x.unit_cost, line_note: x.line_note || null }));

    const fd = new FormData();
    fd.append("operation", "createPR");
    fd.append("json", JSON.stringify({
      supplier_id: payload.supplier_id,
      created_by: user.staff_id,
      remarks: document.getElementById("pr-review-remarks").value || "",
      items: lines,
    }));

    try {
      const r = await axios.post(`${baseApiUrl}/purchase_return.php`, fd);
      if (r?.data?.success) {
        bsModal.hide();
        window.__PR_PAGE__?.clearBuilder?.();
        await Swal.fire("Saved", "Purchase Return saved as pending.", "success");
        window.dispatchEvent(new CustomEvent("pr:created", { detail: { pr_id: r.data.pr_id ?? r.data.purchase_return_id } }));
      } else {
        Swal.fire("Error", r?.data?.error || "Failed to create", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Request failed", "error");
    }
  });
}

/* ============================
   View modal (includes Print)
   ============================ */
export async function openPRViewModal(pr_id) {
  const res = await axios.get(`${baseApiUrl}/purchase_return.php`, {
    params: { operation: "getPR", json: JSON.stringify({ pr_id, purchase_return_id: pr_id }) },
  });
  const pr = res.data || {};

  let rows = "", grand = 0;
  (Array.isArray(pr.items) ? pr.items : []).forEach((it) => {
    const q = Number(it.return_qty || 0);
    const c = Number(it.unit_cost || 0);
    const line = q * c; grand += line;
    rows += `
      <tr>
        <td>${it.product_name || ""}</td>
        <td class="text-end">${q}</td>
        <td class="text-end">${nf.format(c)}</td>
        <td>${it.line_note ? it.line_note : ""}</td>
        <td class="text-end">${nf.format(line)}</td>
      </tr>
    `;
  });

  const body = `
    <div class="mb-2">
      <div class="d-flex justify-content-between">
        <div>
          <div class="small text-muted">PR Ref</div>
          <div class="fw-semibold">${pr.reference_no || "(pending)"}</div>
        </div>
        <div>
          <div class="small text-muted">Status</div>
${ H().statusBadge ? H().statusBadge(pr.status) : `<span class="badge text-bg-secondary">${String(pr.status||'').replace(/_/g,' ')}</span>` }
        </div>
      </div>
    </div>
    <div class="row g-3 mb-2">
      <div class="col-md-6"><div class="small text-muted">Supplier</div><div class="fw-semibold">${pr.supplier_name || ""}</div></div>
      <div class="col-md-6"><div class="small text-muted">Warehouse</div><div class="fw-semibold">${pr.location_name || ""}</div></div>
    </div>
    <div class="table-responsive border rounded">
      <table class="table table-sm align-middle m-0">
        <thead class="table-light">
          <tr>
            <th>Product</th>
            <th class="text-end" style="width:12%;">Return Qty</th>
            <th class="text-end" style="width:16%;">Unit Cost</th>
            <th style="width:20%;">Line notes</th>
            <th class="text-end" style="width:16%;">Line Total</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="5" class="text-center text-muted">No items</td></tr>`}</tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="text-end fw-semibold">Grand Total</td>
            <td class="text-end fw-bold">${nf.format(grand)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  document.getElementById("blank-modal-title").textContent = "Purchase Return Details";
  document.getElementById("blank-main-div").innerHTML = body;
  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    <button id="btn-pr-print" type="button" class="btn btn-primary">Print</button>
  `;

const modalEl = ensureBlankModal();
  modalEl.querySelector(".modal-dialog")?.classList.add("modal-xl", "modal-dialog-scrollable", "modal-dialog-centered", "modal-fullscreen-lg-down");
  document.getElementById("blank-main-div").style.maxHeight = "75vh";
  document.getElementById("blank-main-div").style.overflowY = "auto";
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();
// after setting innerHTML for footer
const footer = document.getElementById("blank-modal-footer");
if (String(pr.status).toLowerCase() === "confirmed") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-success";
  btn.textContent = "Returned";
  btn.addEventListener("click", async () => {
    const ok = await Swal.fire({ title: "Mark as returned and deduct stock?", icon: "warning", showCancelButton: true });
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    fd.append("operation", "markReturned");
    fd.append("json", JSON.stringify({ pr_id }));
    const res = await axios.post(`${baseApiUrl}/purchase_return.php`, fd);
    if (res?.data?.success) {
      bootstrap.Modal.getOrCreateInstance(ensureBlankModal()).hide();
      await Swal.fire("Done", "Items deducted and status set to Returned.", "success");
      window.dispatchEvent(new CustomEvent("pr:confirmed", { detail: { pr_id } }));
    } else {
      Swal.fire("Error", res?.data?.error || "Failed to mark returned", "error");
    }
  });
  footer.insertBefore(btn, footer.firstChild);
}

  document.getElementById("btn-pr-print")?.addEventListener("click", () => printPR(pr_id));
}

/* ============================
   Edit modal (pending only)
   ============================ */
export async function openPREditModal(pr_id) {
  const res = await axios.get(`${baseApiUrl}/purchase_return.php`, {
    params: { operation: "getPR", json: JSON.stringify({ pr_id, purchase_return_id: pr_id }) },
  });
  const pr = res.data || {};
  if (!pr || String(pr.status).toLowerCase() !== "pending") {
    return Swal.fire("Only pending Purchase Returns can be edited.");
  }

  let rows = "", grand = 0;
  (Array.isArray(pr.items) ? pr.items : []).forEach((it) => {
    const q = Number(it.return_qty || 0);
    const c = Number(it.unit_cost || 0);
    const line = q * c; grand += line;
    rows += `
      <tr data-product="${it.product_id}">
        <td>${it.product_name || ""}</td>
        <td style="width:120px;"><input type="number" class="form-control form-control-sm edit-qty" value="${q}" min="1"></td>
        <td class="text-end"><input type="number" class="form-control form-control-sm edit-cost" value="${c.toFixed(2)}" step="0.01"></td>
        <td style="width:220px;"><input type="text" class="form-control form-control-sm edit-note" value="${(it.line_note || "").replace(/"/g, '&quot;')}"></td>
        <td class="text-end edit-line">${(line).toFixed(2)}</td>
        <td style="width:6%;"><button class="btn btn-sm btn-danger edit-remove">✕</button></td>
      </tr>
    `;
  });

  const body = `
    <div class="mb-2">
      <div class="small text-muted">Edit Purchase Return</div>
      <div><b>Supplier:</b> ${pr.supplier_name || ""}</div>
      <div><b>Warehouse:</b> ${pr.location_name || ""}</div>
    </div>
    <div class="table-responsive border rounded">
      <table class="table table-sm align-middle m-0">
        <thead class="table-light">
          <tr>
            <th>Product</th>
            <th style="width:12%;">Return Qty</th>
            <th class="text-end" style="width:16%;">Unit Cost</th>
            <th style="width:18%;">Line notes</th>
            <th class="text-end" style="width:16%;">Line Total</th>
            <th style="width:6%;"></th>
          </tr>
        </thead>
        <tbody id="pr-edit-body">${rows || `<tr><td colspan="6" class="text-center text-muted">No items.</td></tr>`}</tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="text-end fw-semibold">Grand Total</td>
            <td id="pr-edit-grand" class="text-end fw-bold">${nf.format(grand)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="mt-2">
      <label class="form-label small text-muted">Remarks</label>
      <input id="pr-edit-remarks" class="form-control form-control-sm" value="${(pr.remarks || "").replace(/"/g, '&quot;')}">
    </div>
  `;

  document.getElementById("blank-modal-title").textContent = "Edit Purchase Return";
  document.getElementById("blank-main-div").innerHTML = body;
  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    <button id="btn-pr-save" type="button" class="btn btn-primary">Save</button>
    <button id="btn-pr-confirm" type="button" class="btn btn-success">Confirm</button>
  `;

const modalEl = ensureBlankModal();
  modalEl.querySelector(".modal-dialog")?.classList.add("modal-xl", "modal-dialog-scrollable", "modal-dialog-centered", "modal-fullscreen-lg-down");
  document.getElementById("blank-main-div").style.maxHeight = "75vh";
  document.getElementById("blank-main-div").style.overflowY = "auto";
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();

  const tbody = document.getElementById("pr-edit-body");
  const grandEl = document.getElementById("pr-edit-grand");

  const recalc = () => {
    let g = 0;
    tbody.querySelectorAll("tr").forEach((tr) => {
      const q = Number(tr.querySelector(".edit-qty")?.value || 0);
      const c = Number(tr.querySelector(".edit-cost")?.value || 0);
      const lt = q * c;
      tr.querySelector(".edit-line").textContent = lt.toFixed(2);
      g += lt;
    });
    grandEl.textContent = nf.format(g);
  };

  tbody.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-remove")) {
      e.target.closest("tr")?.remove();
      if (!tbody.querySelector("tr")) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No items.</td></tr>`;
      }
      recalc();
    }
  });
  tbody.addEventListener("input", (e) => {
    if (e.target.classList.contains("edit-qty") || e.target.classList.contains("edit-cost")) recalc();
  });

  document.getElementById("btn-pr-save").addEventListener("click", async () => {
    const items = [];
    tbody.querySelectorAll("tr").forEach((tr) => {
      const pid = Number(tr.dataset.product || 0);
      const q = Number(tr.querySelector(".edit-qty")?.value || 0);
      const c = Number(tr.querySelector(".edit-cost")?.value || 0);
      const note = (tr.querySelector(".edit-note")?.value || "").trim();
      if (pid && q > 0) items.push({ product_id: pid, return_qty: q, unit_cost: c, line_note: note || null });
    });
    const fd = new FormData();
    fd.append("operation", "updatePRItems");
    fd.append("json", JSON.stringify({ pr_id, remarks: document.getElementById("pr-edit-remarks").value || "", items }));
    try {
      const r = await axios.post(`${baseApiUrl}/purchase_return.php`, fd);
      if (r?.data?.success) {
        bsModal.hide();
        await Swal.fire("Saved", "Pending return updated.", "success");
        window.dispatchEvent(new CustomEvent("pr:updated", { detail: { pr_id } }));
      } else {
        Swal.fire("Error", r?.data?.error || "Failed to save", "error");
      }
    } catch (err) {
      console.error(err); Swal.fire("Error", "Request failed", "error");
    }
  });

  document.getElementById("btn-pr-confirm").addEventListener("click", async () => {
    const ok = await Swal.fire({ title: "Confirm this return?", icon: "question", showCancelButton: true });
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    fd.append("operation", "confirmPR");
    fd.append("json", JSON.stringify({ pr_id }));
    try {
      const r = await axios.post(`${baseApiUrl}/purchase_return.php`, fd);
      if (r?.data?.success) {
        bsModal.hide();
        await Swal.fire("Confirmed", "Inventory deducted.", "success");
        window.dispatchEvent(new CustomEvent("pr:confirmed", { detail: { pr_id } }));
      } else {
        Swal.fire("Error", r?.data?.error || "Failed to confirm", "error");
      }
    } catch (err) {
      console.error(err); Swal.fire("Error", "Request failed", "error");
    }
  });
}

/* ============================
   Print (invoked from View)
   ============================ */
async function printPR(pr_id) {
  const res = await axios.get(`${baseApiUrl}/purchase_return.php`, {
    params: { operation: "getPR", json: JSON.stringify({ pr_id, purchase_return_id: pr_id }) },
  });
  const pr = res.data || {};
  const items = Array.isArray(pr.items) ? pr.items : [];
  const rows = items.map((i) => {
    const q = Number(i.return_qty || 0), c = Number(i.unit_cost || 0);
    return `<tr>
      <td>${i.product_name || ""}</td>
      <td class="text-end">${q}</td>
      <td class="text-end">${nf.format(c)}</td>
      <td>${i.line_note ? String(i.line_note) : ""}</td>
      <td class="text-end">${nf.format(q * c)}</td>
    </tr>`;
  }).join("");
  const grand = items.reduce((s, i) => s + (Number(i.return_qty || 0) * Number(i.unit_cost || 0)), 0);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${pr.reference_no || "(PENDING PR)"}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#0f172a; }
    table { width:100%; border-collapse:collapse; margin-top:16px; }
    th, td { border:1px solid #e2e8f0; padding:8px; font-size:13px; }
    th { background:#f1f5f9; text-align:left; }
    .text-end { text-align:right; }
    .muted { color:#64748b; font-size:12px; }
  </style>
</head>
<body>
  <h2>Purchase Return ${pr.reference_no ? `(${pr.reference_no})` : "(PENDING)"}</h2>
  <div>Supplier: <b>${pr.supplier_name || ""}</b></div>
  <div>Warehouse: <b>${pr.location_name || ""}</b></div>
  <div class="muted">Generated: ${new Date().toLocaleString()}</div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th class="text-end" style="width:12%;">Return</th>
        <th class="text-end" style="width:16%;">Unit Cost</th>
        <th style="width:22%;">Line notes</th>
        <th class="text-end" style="width:16%;">Line Total</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="5">No items.</td></tr>`}</tbody>
    <tfoot>
      <tr>
        <td colspan="4" class="text-end"><b>Total</b></td>
        <td class="text-end"><b>${nf.format(grand)}</b></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

  // print once, close modal after
H().printHTML?.(html, () => {
    const modalEl = ensureBlankModal();
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
  });
}
