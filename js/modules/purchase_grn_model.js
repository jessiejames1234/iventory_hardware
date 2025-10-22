// modules/purchase_grn_model.js
import { requireRole } from "../auth.js";
const user = requireRole(["warehouse_manager", "warehouse_clerk"]);

export async function openCreateGRNModal(po_id) {
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";

  // 1) Load PO with items
  const res = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getPO", json: JSON.stringify({ po_id }) },
  });
  const po = res.data || {};
  const items = Array.isArray(po.items) ? po.items : [];

  // Build rows only for items with remaining qty
// Build rows: include every PO item that is NOT fully complete,
// even if received_now = 0 (default), and show Remaining live.
let rows = "";
let grandTotal = 0;
items.forEach(it => {
  const ordered   = Number(it.ordered_qty  || 0);
  const prevRx    = Number(it.received_qty || 0);
  const remaining = Math.max(0, ordered - prevRx);

  // hide fully-complete lines only
  if (ordered <= prevRx) return;

  const cost = Number(it.unit_cost || 0);
  const recvNow = 0; // <-- default to zero as requested
  const line = recvNow * cost; // = 0 initially

  rows += `
    <tr data-product="${it.product_id}" data-prev-received="${prevRx}">
      <td>${it.product_name || ""}</td>
      <td class="text-end">${ordered}</td>
      <td style="width:120px;">
        <input type="number" class="form-control form-control-sm rec-input"
               min="0" max="${remaining}" value="${recvNow}">
      </td>
      <td class="text-end remaining">${Math.max(0, ordered - (prevRx + recvNow))}</td>
      <td style="width:220px;">
        <input type="text" class="form-control form-control-sm line-note" placeholder="(optional)">
      </td>
      <td class="text-end unit-cost">${cost.toFixed(2)}</td>
      <td class="text-end line-total">${line.toFixed(2)}</td>
    </tr>`;
});


  const nf = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  // 2) Modal body (includes pager container under table)
  const bodyHTML = `
    <div class="mb-3">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <div class="small text-muted">PO Number</div>
          <div class="fw-semibold">${po.po_number || ""}</div>
        </div>
        <div>
          <div class="small text-muted">Supplier</div>
          <div class="fw-semibold">${po.supplier_name || ""}</div>
        </div>
        <div>
          <div class="small text-muted">Warehouse</div>
          <div class="fw-semibold">${po.location_name || ""}</div>
        </div>
      </div>
    </div>

    <div class="table-responsive border rounded">
      <table class="table table-sm align-middle m-0">
        <thead class="table-light">
          <tr>
            <th>Product</th>
            <th class="text-end" style="width:8%;">Ordered</th>
            <th style="width:12%;">Received</th>
            <th class="text-end" style="width:8%;">Remaining</th>
            <th style="width:18%;">Line notes</th>
            <th class="text-end" style="width:12%;">Unit Cost</th>
            <th class="text-end" style="width:14%;">Line Total</th>
          </tr>
        </thead>
        <tbody id="grn-body">
          ${rows || `<tr><td colspan="7" class="text-center text-muted">All items fully received.</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6" class="text-end fw-semibold">GRN Total</td>
            <td id="grn-grand" class="text-end fw-bold">${nf.format(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- 🔢 pager for GRN (5 per page) -->
    <div class="d-flex justify-content-end gap-2 mt-2" id="grn-pager"></div>

    <div class="row g-2 mt-3">
      <div class="col-md-6">
        <label class="form-label small text-muted">Remarks</label>
        <input id="grn-remarks" class="form-control form-control-sm" placeholder="(optional)">
      </div>
    </div>
  `;

  // 3) Inject into #blank-modal
  document.getElementById("blank-modal-title").textContent = `Create GRN`;
  document.getElementById("blank-main-div").innerHTML = bodyHTML;
  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    <button id="btn-save-grn" type="button" class="btn btn-success">Create GRN</button>
  `;

  // 3.1) Make modal big & scrollable (same as other modals)
  const modalEl = document.getElementById("blank-modal");
  const dlg = modalEl.querySelector(".modal-dialog");
  if (dlg) dlg.classList.add("modal-xl", "modal-dialog-scrollable", "modal-dialog-centered", "modal-fullscreen-lg-down");
  const bodyPanel = document.getElementById("blank-main-div");
  if (bodyPanel) { bodyPanel.style.maxHeight = "75vh"; bodyPanel.style.overflowY = "auto"; }

  // 4) Interactions
  const tbody = document.getElementById("grn-body");
  const pagerGRN = document.getElementById("grn-pager");
  const grandEl = document.getElementById("grn-grand");

  // live totals + dynamic Remaining
const recalc = () => {
  let g = 0;
  tbody.querySelectorAll("tr").forEach(tr => {
    const ordered = Number(tr.querySelector("td:nth-child(2)")?.textContent || 0);
    const prevRec = Number(tr.dataset.prevReceived || 0);
    const recNow  = Number(tr.querySelector(".rec-input")?.value || 0);
    const cost    = Number(tr.querySelector(".unit-cost")?.textContent || 0);

    const remainingNow = Math.max(0, ordered - (prevRec + recNow));
    tr.querySelector(".remaining").textContent = remainingNow;

    const lt = recNow * cost;
    tr.querySelector(".line-total").textContent = lt.toFixed(2);

    g += lt;
  });
  grandEl.textContent = nf.format(g);
};


  // cap input to original remaining (ordered - prevRec) and recalc
  tbody.querySelectorAll(".rec-input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const tr = e.target.closest("tr");
      const ordered = Number(tr.querySelector("td:nth-child(2)")?.textContent || 0);
      const prevRec = Number(tr.dataset.prevReceived || 0);
      const hardMax = Math.max(0, ordered - prevRec); // original remaining
      if (Number(e.target.value) > hardMax) e.target.value = hardMax;
      if (Number(e.target.value) < 0) e.target.value = 0;
      recalc();
    });
  });

  // 🔢 Numbered paging for GRN (5 items per page)
  const PER_PAGE_GRN = 5;
  let currentGRNPage = 1;

  function renderGRNPage(page = 1) {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const realRows = rows.filter(tr => !tr.querySelector("td[colspan]"));
    const totalPages = Math.max(1, Math.ceil(realRows.length / PER_PAGE_GRN));

    currentGRNPage = Math.min(Math.max(1, page), totalPages);

    realRows.forEach((tr, i) => {
      const start = (currentGRNPage - 1) * PER_PAGE_GRN;
      const end = start + PER_PAGE_GRN;
      tr.classList.toggle("d-none", i < start || i >= end);
    });

    pagerGRN.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `btn btn-outline-secondary btn-sm me-1 grn-page-btn${i === currentGRNPage ? " active" : ""}`;
      b.dataset.page = i;
      b.textContent = i;
      pagerGRN.appendChild(b);
    }
  }

  pagerGRN.addEventListener("click", (e) => {
    const b = e.target.closest(".grn-page-btn");
    if (b) renderGRNPage(parseInt(b.dataset.page, 10) || 1);
  });

  // initial render
  renderGRNPage(1);
  recalc();

  // 5) Save GRN (server generates reference_no)
  document.getElementById("btn-save-grn").addEventListener("click", async () => {
    const lines = [];
    tbody.querySelectorAll("tr").forEach(tr => {
      // ignore empty-state row
      if (tr.querySelector("td[colspan]")) return;

      const product_id = Number(tr.dataset.product);
      const rec  = Number(tr.querySelector(".rec-input")?.value || 0);
      const cost = Number(tr.querySelector(".unit-cost")?.textContent || 0);
      const note = String(tr.querySelector(".line-note")?.value || "").trim();
      if (product_id && rec > 0) {
        lines.push({ product_id, received_qty: rec, unit_cost: cost, line_note: note || null });
      }
    });

    if (lines.length === 0) {
      Swal.fire("Nothing to receive", "Set at least one quantity > 0", "info");
      return;
    }

    const payload = {
      po_id,
      supplier_id: po.supplier_id,
      location_id: po.location_id,   // server validates
      received_by: user.staff_id,
      status: "confirmed",
      // Do NOT send reference_no; it's auto-generated server-side
      remarks: document.getElementById("grn-remarks").value || "",
      items: lines
    };

    const formData = new FormData();
    formData.append("operation", "createGRN");
    formData.append("json", JSON.stringify(payload));

    try {
      const save = await axios.post(`${baseApiUrl}/purchase_order.php`, formData);
      if (save.data && (save.data.success === 1 || save.data.success === true)) {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();

        const ref = save.data.reference_no ? ` (Ref: ${save.data.reference_no})` : "";
        await Swal.fire("GRN Created" + ref, "Inventory updated.", "success");

        // Notify page to refresh
        window.dispatchEvent(new CustomEvent("grn:created", {
          detail: { po_id, grn_id: save.data?.grn_id, reference_no: save.data?.reference_no }
        }));
      } else {
        Swal.fire("Error", save.data?.error || "Failed to create GRN", "error");
      }
    } catch (err) {
      console.error("createGRN failed", err);
      Swal.fire("Error", "Request failed", "error");
    }
  });

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}


export async function openEditGRNModal(grn_id) {
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";

  // Load GRN header+items
  const gRes = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getGRN", json: JSON.stringify({ grn_id }) },
  });
  const grn = gRes.data || {};
  if (!grn || grn.status !== "draft") {
    Swal.fire("Only draft GRNs can be edited.");
    return;
  }
  const draftLines = new Map(); // product_id -> {received_qty, unit_cost, line_note}
  (Array.isArray(grn.items) ? grn.items : []).forEach(it => {
    draftLines.set(Number(it.product_id), {
      received_qty: Number(it.received_qty || 0),
      unit_cost: Number(it.unit_cost || 0),
      line_note: it.line_note || ""
    });
  });

  // Load PO to compute ordered/prev received and hide complete lines
  const poRes = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getPO", json: JSON.stringify({ po_id: grn.po_id }) },
  });
  const po = poRes.data || {};
  const poItems = Array.isArray(po.items) ? po.items : [];

  const nf = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  // Build rows from PO items (not complete) + prefill from draft (0 allowed)
  let rows = "";
  let grand = 0;
  poItems.forEach(it => {
    const ordered   = Number(it.ordered_qty  || 0);
    const prevRx    = Number(it.received_qty || 0);
    if (ordered <= prevRx) return; // hide complete lines

    const costBase  = Number(it.unit_cost || 0);
    const d = draftLines.get(Number(it.product_id)) || { received_qty: 0, unit_cost: costBase, line_note: "" };
    const recNow = Number(d.received_qty || 0); // may be 0 (show it!)
    const cost   = Number(d.unit_cost || costBase);
    const lt     = recNow * cost;
    grand += lt;

    rows += `
      <tr data-product="${it.product_id}" data-prev-received="${prevRx}">
        <td>${it.product_name || ""}</td>
        <td class="text-end">${ordered}</td>
        <td style="width:120px;">
          <input type="number" class="form-control form-control-sm rec-input"
                 min="0" max="${Math.max(0, ordered - prevRx)}" value="${recNow}">
        </td>
        <td class="text-end remaining">${Math.max(0, ordered - (prevRx + recNow))}</td>
        <td style="width:220px;">
          <input type="text" class="form-control form-control-sm line-note" value="${(d.line_note || "").replace(/"/g,'&quot;')}" placeholder="(optional)">
        </td>
        <td class="text-end unit-cost">${cost.toFixed(2)}</td>
        <td class="text-end line-total">${lt.toFixed(2)}</td>
      </tr>`;
  });

  // Modal content (same headers/footers you used)
  const bodyHTML = `
    <div class="mb-3">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div><div class="small text-muted">GRN</div><div class="fw-semibold">${grn.reference_no || "(DRAFT)"}</div></div>
        <div><div class="small text-muted">PO</div><div class="fw-semibold">${po.po_number || ""}</div></div>
        <div><div class="small text-muted">Supplier</div><div class="fw-semibold">${po.supplier_name || ""}</div></div>
        <div><div class="small text-muted">Warehouse</div><div class="fw-semibold">${po.location_name || ""}</div></div>
      </div>
    </div>
    <div class="table-responsive border rounded">
      <table class="table table-sm align-middle m-0">
        <thead class="table-light">
          <tr>
            <th>Product</th>
            <th class="text-end" style="width:8%;">Ordered</th>
            <th style="width:12%;">Received</th>
            <th class="text-end" style="width:8%;">Remaining</th>
            <th style="width:18%;">Line notes</th>
            <th class="text-end" style="width:12%;">Unit Cost</th>
            <th class="text-end" style="width:14%;">Line Total</th>
          </tr>
        </thead>
        <tbody id="grn-edit-body">
          ${rows || `<tr><td colspan="7" class="text-center text-muted">All items fully received.</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6" class="text-end fw-semibold">GRN Total</td>
            <td id="grn-edit-grand" class="text-end fw-bold">${nf.format(grand)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-2" id="grn-pager"></div>
    <div class="row g-2 mt-3">
      <div class="col-md-12">
        <label class="form-label small text-muted">Remarks</label>
        <input id="grn-edit-remarks" class="form-control form-control-sm" value="${(grn.remarks||"").replace(/"/g,'&quot;')}">
      </div>
    </div>
  `;

  document.getElementById("blank-modal-title").textContent = `Edit GRN (Draft)`;
  document.getElementById("blank-main-div").innerHTML = bodyHTML;
let footerBtns = `
  <button type="button" class="btn btn-primary" id="btn-update-grn">Save</button>
  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
`;

// only managers can confirm
if (user.role === "warehouse_manager") {
  footerBtns = `
    <button type="button" class="btn btn-outline-success" id="btn-confirm-grn">Confirm</button>
    ${footerBtns}
  `;
}

document.getElementById("blank-modal-footer").innerHTML = footerBtns;



  // Make it big & scrollable like your other modal
  const modalEl = document.getElementById("blank-modal");
  const dlg = modalEl.querySelector(".modal-dialog");
  if (dlg) dlg.classList.add("modal-xl","modal-dialog-scrollable","modal-dialog-centered","modal-fullscreen-lg-down");
  const bodyPanel = document.getElementById("blank-main-div");
  if (bodyPanel) { bodyPanel.style.maxHeight = "75vh"; bodyPanel.style.overflowY = "auto"; }
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();

  const tbody = document.getElementById("grn-edit-body");
  const grandEl = document.getElementById("grn-edit-grand");
  const recalc = () => {
    let g = 0;
    tbody.querySelectorAll("tr").forEach(tr => {
      const ordered = Number(tr.querySelector("td:nth-child(2)")?.textContent || 0);
      const prevRx  = Number(tr.dataset.prevReceived || 0);
      const recNow  = Number(tr.querySelector(".rec-input")?.value || 0);
      const cost    = Number(tr.querySelector(".unit-cost")?.textContent || 0);
      tr.querySelector(".remaining").textContent = Math.max(0, ordered - (prevRx + recNow));
      const lt = recNow * cost;
      tr.querySelector(".line-total").textContent = lt.toFixed(2);
      g += lt;
    });
    grandEl.textContent = nf.format(g);
  };
  tbody.querySelectorAll(".rec-input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const tr = e.target.closest("tr");
      const ordered = Number(tr.querySelector("td:nth-child(2)")?.textContent || 0);
      const prevRx  = Number(tr.dataset.prevReceived || 0);
      const max     = Math.max(0, ordered - prevRx);
      if (Number(e.target.value) > max) e.target.value = max;
      if (Number(e.target.value) < 0) e.target.value = 0;
      recalc();
    });
  });

  // Save (replace items on the draft)
  document.getElementById("btn-update-grn").addEventListener("click", async () => {
    const lines = [];
    tbody.querySelectorAll("tr").forEach(tr => {
      const product_id = Number(tr.dataset.product);
      const rec = Number(tr.querySelector(".rec-input")?.value || 0);
      const cost = Number(tr.querySelector(".unit-cost")?.textContent || 0);
      const note = String(tr.querySelector(".line-note")?.value || "").trim();
      if (product_id && rec > 0) {
        lines.push({ product_id, received_qty: rec, unit_cost: cost, line_note: note || null });
      }
    });
    const payload = { grn_id, remarks: document.getElementById("grn-edit-remarks").value || "", items: lines };
    const fd = new FormData();
    fd.append("operation", "updateGRNItems");
    fd.append("json", JSON.stringify(payload));
    try {
      const r = await axios.post(`${baseApiUrl}/purchase_order.php`, fd);
      if (r?.data?.success) {
        Swal.fire("Saved", "Draft GRN updated.", "success");
        window.dispatchEvent(new CustomEvent("grn:updated", { detail: { grn_id } }));
      } else {
        Swal.fire("Error", r?.data?.error || "Failed to save draft", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Request failed", "error");
    }
  });

  // Confirm (apply to inventory + PO totals)
document.getElementById("btn-confirm-grn").addEventListener("click", async () => {
  const lines = [];
  tbody.querySelectorAll("tr").forEach(tr => {
    if (tr.querySelector("td[colspan]")) return;
    const product_id = Number(tr.dataset.product);
    const received_qty = Number(tr.querySelector(".rec-input")?.value || 0);
    const unit_cost = Number(tr.querySelector(".unit-cost")?.textContent || 0);
    const line_note = String(tr.querySelector(".line-note")?.value || "").trim() || null;
    if (product_id && received_qty >= 0) {
      lines.push({ product_id, received_qty, unit_cost, line_note });
    }
  });

  // 1) Save draft items with current edits
  const fdSave = new FormData();
  fdSave.append("operation", "updateGRNItems");
  fdSave.append("json", JSON.stringify({
    grn_id,
    remarks: document.getElementById("grn-edit-remarks").value || "",
    items: lines.filter(l => l.received_qty > 0) // store only >0 lines
  }));

  try {
    const save = await axios.post(`${baseApiUrl}/purchase_order.php`, fdSave);
    if (!save?.data?.success) {
      Swal.fire("Error", save?.data?.error || "Failed to save edits before confirm", "error");
      return;
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "Request failed", "error");
    return;
  }

  // 2) Confirm
  const fdConfirm = new FormData();
  fdConfirm.append("operation", "confirmGRN");
  fdConfirm.append("json", JSON.stringify({ grn_id }));

  try {
    const r = await axios.post(`${baseApiUrl}/purchase_order.php`, fdConfirm);
    if (r?.data?.success) {
      bsModal.hide();
      const ref = r?.data?.reference_no ? ` (Ref: ${r.data.reference_no})` : "";
      await Swal.fire("GRN Confirmed" + ref, "Inventory updated.", "success");
      window.dispatchEvent(new CustomEvent("grn:confirmed", { detail: { grn_id } }));
    } else {
      Swal.fire("Error", r?.data?.error || "Failed to confirm GRN", "error");
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "Request failed", "error");
  }
});

}
