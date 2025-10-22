// purchase_order_model.js
import { requireRole } from "../auth.js";

// allow both managers & clerks to access this module
const user = requireRole(["warehouse_manager", "warehouse_clerk"]);


export async function openPOModal(po_id) {
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";

  try {
    const res = await axios.get(`${baseApiUrl}/purchase_order.php`, {
      params: { operation: "getPO", json: JSON.stringify({ po_id }) },
    });
    const po = res.data || {};

    const nf = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
    const statusBadge = (status) => {
      const map = {
        pending: "info",
        approved: "primary",
        partially_received: "warning",
        received: "success",
        cancelled: "danger",
      };
      return `<span class="badge text-bg-${map[status] || "secondary"} text-uppercase">${status || ""}</span>`;
    };

    // Build rows (no show-more/less; paging will hide/show)
    const itemsArr = Array.isArray(po.items) ? po.items : [];
    let rows = "";
    let grandTotal = 0;

    itemsArr.forEach((it) => {
      const ordered  = Number(it.ordered_qty  || 0);
      const received = Number(it.received_qty || 0);
      const cost     = Number(it.unit_cost    || 0);
      const line     = ordered * cost;
      grandTotal += line;

      rows += `
        <tr>
          <td>${it.product_name || ""}</td>
          <td class="text-end">${ordered}</td>
          <td class="text-end">${received}</td>
          <td class="text-end">${nf.format(cost)}</td>
          <td class="text-end fw-semibold">${nf.format(line)}</td>
        </tr>`;
    });

    const bodyHTML = `
      <div class="mb-3">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <div class="small text-muted">PO Number</div>
            <div class="fw-semibold">${po.po_number || ""}</div>
          </div>
          <div>
            <div class="small text-muted">Status</div>
            ${statusBadge(String(po.status || "").toLowerCase())}
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="small text-muted">Supplier</div>
          <div class="fw-semibold">${po.supplier_name || ""}</div>
        </div>
        <div class="col-md-6">
          <div class="small text-muted">Warehouse</div>
          <div class="fw-semibold">${po.location_name || ""}</div>
        </div>
        <div class="col-md-6">
          <div class="small text-muted">Created By</div>
          <div class="fw-semibold">${po.created_by_name || po.created_by || ""}</div>
        </div>
        <div class="col-md-6">
          <div class="small text-muted">Created Date</div>
          <div>${po.date_created || ""}</div>
        </div>
      </div>

      <div class="table-responsive border rounded">
        <table class="table table-sm align-middle m-0">
          <thead class="table-light">
            <tr>
              <th>Product</th>
              <th class="text-end" style="width:10%;">ordered_qty</th>
              <th class="text-end" style="width:10%;">received_qty</th>
              <th class="text-end" style="width:18%;">Cost</th>
              <th class="text-end" style="width:18%;">Line Total</th>
            </tr>
          </thead>
          <tbody id="po-view-body">
            ${rows || `<tr><td colspan="5" class="text-center text-muted">No items</td></tr>`}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-end fw-semibold">Grand Total</td>
              <td class="text-end fw-bold">${nf.format(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-2" id="po-view-pager"></div>
    `;

    const canPrint = ["approved", "partially_received", "received"].includes(
      String(po.status || "").toLowerCase()
    );

    document.getElementById("blank-modal-title").textContent = `Purchase Order Details`;
    document.getElementById("blank-main-div").innerHTML = bodyHTML;
    document.getElementById("blank-modal-footer").innerHTML = `
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      ${canPrint ? `<button id="btn-po-print" type="button" class="btn btn-primary">Print</button>` : ""}
    `;

    const modalEl = document.getElementById("blank-modal");
    // make it big & scrollable
    const dlg = modalEl.querySelector(".modal-dialog");
    if (dlg) dlg.classList.add("modal-xl", "modal-dialog-scrollable", "modal-dialog-centered", "modal-fullscreen-lg-down");
    const bodyPanel = document.getElementById("blank-main-div");
    if (bodyPanel) {
      bodyPanel.style.maxHeight = "75vh";
      bodyPanel.style.overflowY = "auto";
    }

    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();

    // Print
    document.getElementById("btn-po-print")?.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("po:print", { detail: { po_id } }));
    });

    // Numbered paging for view
    const PER_PAGE = 5;
    const viewTbody = document.getElementById("po-view-body");
    const pagerView = document.getElementById("po-view-pager");

    function renderViewPage(page = 1) {
      const rows = Array.from(viewTbody.querySelectorAll("tr"));
      const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
      const p = Math.min(Math.max(1, page), totalPages);

      rows.forEach((tr, i) => {
        const start = (p - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        tr.classList.toggle("d-none", i < start || i >= end);
      });

      pagerView.innerHTML = "";
      for (let i = 1; i <= totalPages; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `btn btn-outline-secondary btn-sm me-1 po-page-btn${i === p ? " active" : ""}`;
        b.dataset.page = i;
        b.textContent = i;
        pagerView.appendChild(b);
      }
    }

    pagerView.addEventListener("click", (e) => {
      const b = e.target.closest(".po-page-btn");
      if (b) renderViewPage(parseInt(b.dataset.page, 10) || 1);
    });

    renderViewPage(1);
  } catch (err) {
    console.error("Failed to load PO:", err);
  }
}

export async function openPOEditModal(po_id) {
  // 1) Load PO & supplier products
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api"; // ✅ add thi
  const poRes = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getPO", json: JSON.stringify({ po_id }) },
  });
  const po = poRes.data || {};
  if (!po || (po.status && String(po.status).toLowerCase() !== "pending")) {
    Swal.fire("Only pending POs can be edited.");
    return;
  }

  const prodRes = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getProductsBySupplier", json: JSON.stringify({ supplier_id: po.supplier_id }) },
  });
  const supplierProducts = prodRes.data || [];

  // Helper: build <option> list
  const makeOptions = (selectedId) => supplierProducts.map(p => `
    <option value="${p.product_id}" data-cost="${p.cost_price}" ${Number(selectedId)===Number(p.product_id)?'selected':''}>
      ${p.product_name} (${p.model})
    </option>
  `).join("");

  // 2) Build rows from existing items
  const nf = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  let rowsHtml = "";
  let total = 0;
  (po.items || []).forEach((it, idx) => {
    const qty = Number(it.ordered_qty || 0);
    const cost = Number(it.unit_cost || 0);
    const line = qty * cost; total += line;

    rowsHtml += `
      <tr data-index="${idx}">
        <td style="width:40%;">
          <select class="form-select form-select-sm edit-product">
            <option value="">— Select Product —</option>
            ${makeOptions(it.product_id)}
          </select>
        </td>
        <td style="width:12%;">
          <input type="number" class="form-control form-control-sm edit-qty" value="${qty}" min="1">
        </td>
        <td style="width:16%;" class="text-end">
          <input type="number" class="form-control form-control-sm edit-cost" value="${cost.toFixed(2)}" step="0.01">
        </td>
        <td class="text-end edit-line" style="width:16%;">${(line).toFixed(2)}</td>
        <td style="width:6%;">
          <button class="btn btn-sm btn-danger edit-remove">✕</button>
        </td>
      </tr>`;
  });

  // 3) Modal content
  const bodyHTML = `
    <div class="mb-2">
      <div class="small text-muted">Edit Purchase Order</div>
      <div class="fw-semibold">PO: ${po.po_number || ""}</div>
      <div class="small">Supplier: <b>${po.supplier_name || ""}</b></div>
      <div class="small">Warehouse: <b>${po.location_name || ""}</b></div>
    </div>

    <div class="d-flex justify-content-end mb-2">
      <button id="btn-edit-add" class="btn btn-outline-primary btn-sm">Add Product</button>
    </div>

    <div class="table-responsive border rounded">
      <table class="table table-sm align-middle m-0">
        <thead class="table-light">
          <tr>
            <th style="width:40%;">Product</th>
            <th style="width:12%;">Qty</th>
            <th class="text-end" style="width:16%;">Unit Cost</th>
            <th class="text-end" style="width:16%;">Line Total</th>
            <th style="width:6%;"></th>
          </tr>
        </thead>
        <tbody id="po-edit-body">
          ${rowsHtml || `<tr><td colspan="5" class="text-center text-muted">No items. Click "Add Product".</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-end fw-semibold">Grand Total</td>
            <td id="po-edit-grand" class="text-end fw-bold">${nf.format(total)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- 🔢 pager for edit modal (5 per page) -->
    <div class="d-flex justify-content-end gap-2 mt-2" id="po-edit-pager"></div>
  `;

  document.getElementById("blank-modal-title").textContent = "Edit Purchase Order";
  document.getElementById("blank-main-div").innerHTML = bodyHTML;
let poFooterBtns = `
  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
`;

if (user.role === "warehouse_manager") {
  // Managers can approve (confirm)
  poFooterBtns += `<button id="btn-edit-approve" type="button" class="btn btn-success">Confirm</button>`;
} else if (user.role === "warehouse_clerk") {
  // Clerks can only save
  poFooterBtns += `<button id="btn-edit-save" type="button" class="btn btn-primary">Save</button>`;
}

document.getElementById("blank-modal-footer").innerHTML = poFooterBtns;



  // 🔧 make the edit modal big & scrollable (same as view)
  const modalEl = document.getElementById("blank-modal");
  const dlg = modalEl.querySelector(".modal-dialog");
  if (dlg) dlg.classList.add("modal-xl", "modal-dialog-scrollable", "modal-dialog-centered", "modal-fullscreen-lg-down");
  const bodyPanel = document.getElementById("blank-main-div");
  if (bodyPanel) { bodyPanel.style.maxHeight = "75vh"; bodyPanel.style.overflowY = "auto"; }


  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();

  // 4) Row logic
  const tbody = document.getElementById("po-edit-body");
  const grandEl = document.getElementById("po-edit-grand");

  // 🔢 Numbered paging for EDIT modal (5 items per page)
  const PER_PAGE_EDIT = 5;
  const pagerEdit = document.getElementById("po-edit-pager");
  let currentEditPage = 1;

  function renderEditPage(page = 1) {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    // ignore the empty-state row when counting pages
    const realRows = rows.filter(tr => !tr.querySelector("td[colspan='5']"));
    const totalPages = Math.max(1, Math.ceil(realRows.length / PER_PAGE_EDIT));

    currentEditPage = Math.min(Math.max(1, page), totalPages);

    realRows.forEach((tr, i) => {
      const start = (currentEditPage - 1) * PER_PAGE_EDIT;
      const end = start + PER_PAGE_EDIT;
      tr.classList.toggle("d-none", i < start || i >= end);
    });

    // if there is an empty-state row, always show it (only when there are no real rows)
    rows
      .filter(tr => tr.querySelector("td[colspan='5']"))
      .forEach(tr => tr.classList.remove("d-none"));

    // build pager buttons
    pagerEdit.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `btn btn-outline-secondary btn-sm me-1 po-edit-page-btn${i === currentEditPage ? " active" : ""}`;
      b.dataset.page = i;
      b.textContent = i;
      pagerEdit.appendChild(b);
    }
  }

  pagerEdit.addEventListener("click", (e) => {
    const b = e.target.closest(".po-edit-page-btn");
    if (b) renderEditPage(parseInt(b.dataset.page, 10) || 1);
  });

const recalc = () => {
  let g = 0;
  tbody.querySelectorAll("tr").forEach(tr => {
    const qtyInput  = tr.querySelector(".edit-qty");
    const costInput = tr.querySelector(".edit-cost");
    if (!qtyInput || !costInput) return;

    // robust numeric reads for type=number
    const qty  = Number.isFinite(qtyInput.valueAsNumber) ? qtyInput.valueAsNumber : parseFloat(qtyInput.value) || 0;
    const cost = Number.isFinite(costInput.valueAsNumber) ? costInput.valueAsNumber : parseFloat(costInput.value) || 0;

    const lt = qty * cost;

    const lineCell = tr.querySelector(".edit-line");
    if (lineCell) lineCell.textContent = nf.format(lt);

    g += lt;
  });
  grandEl.textContent = nf.format(g);
};
  const bindRow = (tr) => {
  const productSel = tr.querySelector(".edit-product");
  const qtyInput   = tr.querySelector(".edit-qty");
  const costInput  = tr.querySelector(".edit-cost");

  if (productSel) {
    productSel.addEventListener("change", () => {
      const opt = productSel.options[productSel.selectedIndex];
      if (opt && opt.dataset && opt.dataset.cost) {
        costInput.value = Number(opt.dataset.cost).toFixed(2);
      }
      recalc();
    });
  }

  // fire recalc reliably across browsers
  const wire = (el) => {
    if (!el) return;
    el.addEventListener("input",  recalc);
    el.addEventListener("change", recalc);
    el.addEventListener("keyup",  recalc);
  };
  wire(qtyInput);
  wire(costInput);

  tr.querySelector(".edit-remove")?.addEventListener("click", () => {
    tr.remove();
    if (!tbody.querySelector("tr")) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No items. Click "Add Product".</td></tr>`;
    }
    recalc();
  });
};

  // bind existing rows
  tbody.querySelectorAll("tr").forEach(bindRow);

  // add row
  document.getElementById("btn-edit-add").addEventListener("click", () => {
    // remove empty-state row if present
    const empty = tbody.querySelector("td[colspan='5']");
    if (empty) empty.closest("tr").remove();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="width:40%;">
        <select class="form-select form-select-sm edit-product">
          <option value="">— Select Product —</option>
          ${makeOptions(0)}
        </select>
      </td>
      <td style="width:12%;">
        <input type="number" class="form-control form-control-sm edit-qty" value="1" min="1">
      </td>
      <td style="width:16%;" class="text-end">
        <input type="number" class="form-control form-control-sm edit-cost" value="0.00" step="0.01">
      </td>
      <td class="text-end edit-line" style="width:16%;">0.00</td>
      <td style="width:6%;"><button class="btn btn-sm btn-danger edit-remove">✕</button></td>
    `;
    tbody.appendChild(tr);
    bindRow(tr);
    recalc();

    // go to the last page so the new row shows up
    const realRowsCount = Array.from(tbody.querySelectorAll("tr")).filter(r => !r.querySelector("td[colspan='5']")).length;
    const lastPage = Math.max(1, Math.ceil(realRowsCount / PER_PAGE_EDIT));
    renderEditPage(lastPage);
  });

  // 5) Approve (save items -> approve)
// 6) Clerk Save (just save items, keep status = pending)
document.getElementById("btn-edit-save")?.addEventListener("click", async () => {
  const items = [];
tbody.querySelectorAll("tr").forEach(tr => {
  const sel = tr.querySelector(".edit-product");
  const pid = parseInt(sel?.value, 10);
  const qty = Number(tr.querySelector(".edit-qty")?.value) || 0;
  const cost = Number(tr.querySelector(".edit-cost")?.value) || 0;

  if (pid && qty > 0) {
    items.push({ product_id: pid, ordered_qty: qty, unit_cost: cost });
  }
});
const updated = await axios.get(`${baseApiUrl}/purchase_order.php`, {
  params: { operation: "getPO", json: JSON.stringify({ po_id }) },
});
console.log("Updated PO:", updated.data);

  if (items.length === 0) {
    Swal.fire("No items", "Please add at least one product.", "info");
    return;
  }

const fd = new FormData();
fd.append("operation", "savePOItems");   // ✅ correct for clerk save
fd.append("json", JSON.stringify({ po_id, items }));


  try {
    const r = await axios.post(`${baseApiUrl}/purchase_order.php`, fd);
    if (!r.data || !(r.data.success === 1 || r.data.success === true)) {
      Swal.fire("Error", r.data?.error || "Failed to save items", "error");
      return;
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById("blank-modal")).hide();
    Swal.fire("Saved", "PO items saved (still pending).", "success");
    document.dispatchEvent(new CustomEvent("po:updated", { detail: { po_id } }));
  } catch (e) {
    console.error("savePOItems", e);
    Swal.fire("Error", "Failed to save items", "error");
  }
});
document.getElementById("btn-edit-approve")?.addEventListener("click", async () => {
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";

  // Collect current rows
  const tbody = document.getElementById("po-edit-body");
  const items = [];
  tbody.querySelectorAll("tr").forEach(tr => {
    const sel  = tr.querySelector(".edit-product");
    const pid  = parseInt(sel?.value, 10);
    const qty  = Number(tr.querySelector(".edit-qty")?.value)  || 0;
    const cost = Number(tr.querySelector(".edit-cost")?.value) || 0;
    if (pid && qty > 0) items.push({ product_id: pid, ordered_qty: qty, unit_cost: cost });
  });

  if (items.length === 0) {
    Swal.fire("No items", "Please add at least one product.", "info");
    return;
  }

  // Approve on server (saves items & flips status)
  const fd = new FormData();
  fd.append("operation", "approvePO");
  fd.append("json", JSON.stringify({ po_id, items }));

  try {
    const r = await axios.post(`${baseApiUrl}/purchase_order.php`, fd);
    if (r?.data?.success) {
      bootstrap.Modal.getOrCreateInstance(document.getElementById("blank-modal")).hide();
      Swal.fire("Approved", "PO approved successfully.", "success");
      document.dispatchEvent(new CustomEvent("po:updated", { detail: { po_id } }));
      document.dispatchEvent(new CustomEvent("po:print",   { detail: { po_id } })); // optional auto-print
    } else {
      Swal.fire("Error", r?.data?.error || "Failed to approve PO", "error");
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "Request failed", "error");
  }
});


  // finally, show page 1 on initial open
  renderEditPage(1);
}
