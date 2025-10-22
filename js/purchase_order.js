const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseApiUrl", baseApiUrl);

import { requireRole, logout } from "./auth.js";
import { openPOModal, openPOEditModal } from "./modules/purchase_order_model.js";
import { openCreateGRNModal, openEditGRNModal } from "./modules/purchase_grn_model.js";

// 🔐 manager only
const user = requireRole(["warehouse_manager", "warehouse_clerk"]);
let suppliers = [];
let currentProducts = [];
let rowCounter = 0;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user")?.append(user.name ? ` (${user.name})` : "");
  document.getElementById("btn-logout")?.addEventListener("click", logout);


  if (!user) return; // safety check
  // 👤 Show logged-in user
  document.getElementById("logged-user").textContent = user.name;
  // 🚪 Logout
  document.getElementById("btn-logout")?.addEventListener("click", logout);



  
  // Save last page
  sessionStorage.setItem("lastPage", window.location.href);
  filterSidebarLinks(user.role, document.getElementById("sidebarContent"));
  const sidebarHTML = document.getElementById("sidebarContent").innerHTML;
  document.getElementById("offcanvasContent").innerHTML = sidebarHTML;
  filterSidebarLinks(user.role, document.getElementById("offcanvasContent"));
  //





document.getElementById("supplier-select")?.addEventListener("change", () => {
  currentProducts = [];
  document.querySelector("#request-table tbody").innerHTML = "";
  document.getElementById("request-table").style.display = "none";
  document.getElementById("btn-submit-request").style.display = "none";
  document.getElementById("grand-total").textContent = "0.00";

  // reset pager UI
  const pager = document.getElementById("create-pager");
  if (pager) pager.innerHTML = "";
  currentCreatePage = 1;
});


  loadSuppliers();
  displayPO();
displayGRN();

  document.getElementById("btn-add-row").addEventListener("click", async () => {
    const supplier_id = document.getElementById("supplier-select").value;
    if (!supplier_id) return Swal.fire("Please select a supplier first");
    await loadProductsForSupplier(supplier_id);
    addRow();
  });

  document.getElementById("btn-submit-request").addEventListener("click", openPOReviewModal);
});

//
// 🔎 Hide restricted sidebar links
//
function filterSidebarLinks(role, container = document) {
  container.querySelectorAll("[data-roles]").forEach(link => {
    const roles = link.getAttribute("data-roles").split(",").map(r => r.trim());
    if (!roles.includes(role)) {
      link.style.display = "none"; // hide restricted link
    }
  });
}
// 🔁 refresh PO list after GRN
window.addEventListener("grn:created", () => {
  displayPO();
});

// 🔁 refresh after PO edited/approved (from purchase_order_model.js)
document.addEventListener("po:updated", () => {
  displayPO();
});

// 🔁 print after approve (triggered by purchase_order_model.js)
document.addEventListener("po:print", (e) => {
  const id = e.detail?.po_id;
  if (id) printPO(id);
});
document.addEventListener("grn:print", (e) => {
  const id = e.detail?.grn_id;
  if (id) printGRN(id);
}); 



const PAGE_SIZE = 5;
let poPage = 1;
let grnPage = 1;

function paginate(list, page, size = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil((list?.length || 0) / size));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * size;
  return {
    page: safePage,
    totalPages,
    items: (list || []).slice(start, start + size),
  };
}

function renderPager({ container, page, totalPages, onChange }) {
  // clear existing
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "d-flex align-items-center gap-2 justify-content-end p-2";

  const prev = document.createElement("button");
  prev.className = "btn btn-sm btn-outline-secondary";
  prev.textContent = "Previous";
  prev.disabled = page <= 1;
  prev.addEventListener("click", () => onChange(page - 1));

  const label = document.createElement("span");
  label.className = "fw-semibold";
  label.textContent = String(page); // static page number in the middle

  const next = document.createElement("button");
  next.className = "btn btn-sm btn-outline-secondary";
  next.textContent = "Next";
  next.disabled = page >= totalPages;
  next.addEventListener("click", () => onChange(page + 1));

  wrap.appendChild(prev);
  wrap.appendChild(label);
  wrap.appendChild(next);
  container.appendChild(wrap);
}




// === Builder (Create PO) pagination ===
const PER_PAGE_CREATE = 5;
let currentCreatePage = 1;

function ensureCreatePager() {
  // create a pager container if none exists
  let pager = document.getElementById("create-pager");
  if (!pager) {
    pager = document.createElement("div");
    pager.id = "create-pager";
    pager.className = "d-flex justify-content-end gap-2 mt-2";
    const table = document.getElementById("request-table");
    table.parentNode.insertBefore(pager, table.nextSibling);
  }
  return pager;
}

function visibleBuilderRows() {
  return Array.from(document.querySelectorAll("#request-table tbody tr"))
    // ignore nothing; every TR here is a real row in the builder
    ;
}

function renderCreatePage(page = 1) {
  const rows = visibleBuilderRows();
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE_CREATE));
  currentCreatePage = Math.min(Math.max(1, page), totalPages);

  rows.forEach((tr, idx) => {
    const start = (currentCreatePage - 1) * PER_PAGE_CREATE;
    const end   = start + PER_PAGE_CREATE;
    tr.classList.toggle("d-none", idx < start || idx >= end);
  });

  const pager = ensureCreatePager();
  renderPager({
    container: pager,
    page: currentCreatePage,
    totalPages,
    onChange: (newPage) => renderCreatePage(newPage),
  });
}


const loadSuppliers = async () => {
  const select = document.getElementById("supplier-select");
  select.innerHTML = `<option value="">— Filter by Supplier —</option>`;

  const response = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getSuppliers" },
  });

  if (response.status === 200) {
    suppliers = response.data;
    suppliers.forEach((s) => {
      const option = document.createElement("option");
      option.innerText = `${s.name} (${s.company_name})`;
      option.value = s.supplier_id;
      select.appendChild(option);
    });
  } else {
    Swal.fire("Error", "Failed to load suppliers", "error");
  }
};

//
// 🔹 Load products for supplier
//
const loadProductsForSupplier = async (supplier_id) => {
  const response = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getProductsBySupplier", json: JSON.stringify({ supplier_id }) },
  });

  if (response.status === 200) {
    currentProducts = response.data;
  } else {
    Swal.fire("Error", "Failed to load products for supplier", "error");
  }
};

//
// 🔹 Add a new row in request table
//
const addRow = () => {
  const table = document.getElementById("request-table");
  table.style.display = "table";
  document.getElementById("btn-submit-request").style.display = "inline-block";

  const tbody = table.querySelector("tbody");
  rowCounter++;

  const row = document.createElement("tr");
  row.dataset.row = rowCounter;

  const productOptions = currentProducts.map(
    p => `<option value="${p.product_id}" data-cost="${p.cost_price}">${p.product_name} (${p.model})</option>`
  ).join("");

  row.innerHTML = `
    <td>
      <select class="form-select form-select-sm product-select">
        <option value="">— Select Product —</option>
        ${productOptions}
      </select>
    </td>
    <td><input type="number" class="form-control form-control-sm qty-input" value="1" min="1"></td>
    <!-- cost input is DISABLED so user cannot type; JS still sets .value -->
    <td><input type="number" class="form-control form-control-sm cost-input" value="0" step="0.01" disabled></td>
    <td class="line-total">0.00</td>
    <td><button class="btn btn-sm btn-danger btn-remove">✕</button></td>
  `;
ensureCreatePager(); // create the pager container if missing

  tbody.appendChild(row);

  const qtyInput = row.querySelector(".qty-input");
  const costInput = row.querySelector(".cost-input");
  const productSelect = row.querySelector(".product-select");
  const lineTotal = row.querySelector(".line-total");

  const recalc = () => {
    const qty = parseFloat(qtyInput.value) || 0;
    const cost = parseFloat(costInput.value) || 0;
    lineTotal.textContent = (qty * cost).toFixed(2);
    updateGrandTotal();
  };

  qtyInput.addEventListener("input", recalc);
  costInput.addEventListener("input", recalc); // harmless to keep
  productSelect.addEventListener("change", () => {
    const selected = productSelect.options[productSelect.selectedIndex];
    if (selected && selected.dataset.cost) costInput.value = selected.dataset.cost;
    recalc();
  });

row.querySelector(".btn-remove").addEventListener("click", () => {
  row.remove();

  const body = document.querySelector("#request-table tbody");
  if (!body.querySelector("tr")) {
    document.getElementById("request-table").style.display = "none";
    document.getElementById("btn-submit-request").style.display = "none";
    const pager = document.getElementById("create-pager");
    if (pager) pager.innerHTML = "";
    currentCreatePage = 1;
  } else {
    // if current page overflowed (e.g., deleted the last row on the last page), pull back one page
    const rowsCount = body.querySelectorAll("tr").length;
    const totalPages = Math.max(1, Math.ceil(rowsCount / PER_PAGE_CREATE));
    if (currentCreatePage > totalPages) currentCreatePage = totalPages;
    renderCreatePage(currentCreatePage);
  }

  updateGrandTotal();
});


  recalc();
  // after recalc();
const rowsCount = document.querySelectorAll("#request-table tbody tr").length;
const lastPage = Math.max(1, Math.ceil(rowsCount / PER_PAGE_CREATE));
renderCreatePage(lastPage);

};

//
// 🔹 Update grand total
//
const updateGrandTotal = () => {
  let total = 0;
  document.querySelectorAll(".line-total").forEach(td => {
    total += parseFloat(td.textContent) || 0;
  });
  document.getElementById("grand-total").textContent = total.toFixed(2);
};

//
// 🔹 Gather builder rows (for review modal)
//
const gatherBuilderRows = () => {
  const rows = [];
  document.querySelectorAll("#request-table tbody tr").forEach(tr => {
    const sel = tr.querySelector(".product-select");
    const product_id = Number(sel.value);
    const product_label = sel.value ? sel.options[sel.selectedIndex].text : "";
    const qty = Number(tr.querySelector(".qty-input").value || 0);
    const cost = Number(tr.querySelector(".cost-input").value || 0);
    if (product_id && qty > 0) {
      rows.push({ product_id, product_label, ordered_qty: qty, unit_cost: cost });
    }
  });
  return rows;
};

//
// 🔹 Review Modal (editable quantities) — NOT saving yet
//
const openPOReviewModal = () => {
  const supplier_id = document.getElementById("supplier-select").value;
  if (!supplier_id) {
    Swal.fire("Please select a supplier first");
    return;
  }

  const items = gatherBuilderRows();
  if (items.length === 0) {
    Swal.fire("No items selected");
    return;
  }

  const nf = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  let rowsHtml = "";
  let g = 0;
  items.forEach((it, idx) => {
    const line = it.ordered_qty * it.unit_cost;
    g += line;
    rowsHtml += `
      <tr data-index="${idx}">
        <td>${it.product_label}</td>
        <td style="width:110px;">
          <input type="number" class="form-control form-control-sm rev-qty" value="${it.ordered_qty}" min="1">
        </td>
        <td class="text-end rev-cost">${it.unit_cost.toFixed(2)}</td>
        <td class="text-end rev-line">${line.toFixed(2)}</td>
      </tr>`;
  });

  const bodyHTML = `
    <div class="mb-2">
      <div class="small text-muted">Review your Purchase Order</div>
      <div class="fw-semibold">Supplier: ${
        suppliers.find(s => String(s.supplier_id) === String(supplier_id))?.name || "Selected Supplier"
      }</div>
      <div class="small">Warehouse: <b>${user.warehouse_name || "Your Warehouse"}</b></div>
    </div>

    <div class="table-responsive border rounded">
      <table class="table table-sm align-middle m-0">
        <thead class="table-light">
          <tr>
            <th>Product</th>
            <th style="width:120px;">Qty</th>
            <th class="text-end" style="width:18%;">Unit Cost</th>
            <th class="text-end" style="width:18%;">Line Total</th>
          </tr>
        </thead>
        <tbody id="po-review-body">
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-end fw-semibold">Grand Total</td>
            <td id="po-review-grand" class="text-end fw-bold">${nf.format(g)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  document.getElementById("blank-modal-title").textContent = "Review Purchase Order";
  document.getElementById("blank-main-div").innerHTML = bodyHTML;
  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Back</button>
    <button id="btn-final-send" type="button" class="btn btn-primary">Send</button>
  `;

  const modalEl = document.getElementById("blank-modal");
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();

  const tbody = document.getElementById("po-review-body");
  const grandEl = document.getElementById("po-review-grand");
  const recalc = () => {
    let grand = 0;
    tbody.querySelectorAll("tr").forEach(tr => {
      const idx = Number(tr.dataset.index);
      const qty = Number(tr.querySelector(".rev-qty").value || 0);
      items[idx].ordered_qty = qty > 0 ? qty : 1;
      const cost = Number(tr.querySelector(".rev-cost").textContent || 0);
      const line = items[idx].ordered_qty * cost;
      tr.querySelector(".rev-line").textContent = line.toFixed(2);
      grand += line;
    });
    grandEl.textContent = nf.format(grand);
  };
  tbody.querySelectorAll(".rev-qty").forEach(inp => inp.addEventListener("input", recalc));

  document.getElementById("btn-final-send").addEventListener("click", async () => {
    await finalizeAndSendPO(supplier_id, items, bsModal);
  });
};

//
// 🔹 Finalize (insert PO), set status to 'pending', print, reset UI
//
const finalizeAndSendPO = async (supplier_id, items, bsModalInstance) => {
  const jsonData = {
    supplier_id,
    // backend derives location from staff.warehouse_id
    created_by: user.staff_id,
    items
  };

  const btn = document.getElementById("btn-final-send");
  if (btn) {
    btn.disabled = true;
    btn.dataset.orig = btn.textContent;
    btn.textContent = "Creating…";
  }

  try {
    // 1) Insert PO (server sets status = 'pending' and formats PO-####)
    const fd = new FormData();
    fd.append("operation", "insertPO");
    fd.append("json", JSON.stringify(jsonData));
    const res = await axios.post(`${baseApiUrl}/purchase_order.php`, fd);

    if (!res.data?.success || !res.data?.po_id) {
      throw new Error(res.data?.error || "Failed to create PO");
    }
    const po_id = res.data.po_id;
    const po_no = res.data.po_number || "";

    // 2) Print right away (status is already 'pending')
    await printPO(po_id);

    // 3) Reset builder
    document.querySelector("#request-table tbody").innerHTML = "";
    document.getElementById("request-table").style.display = "none";
    document.getElementById("btn-submit-request").style.display = "none";
    document.getElementById("grand-total").textContent = "0.00";

    // 4) Close modal & refresh
    bsModalInstance.hide();
    displayPO();

    Swal.fire("Created", `Purchase Order ${po_no ? `<b>${po_no}</b> ` : ""}created (status: pending).`, "success");
  } catch (err) {
    console.error("finalizeAndSendPO error:", err);
    Swal.fire("Error", err.message || "Something went wrong", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = btn.dataset.orig || "Send";
    }
  }
};

//
// 🔹 Display all Purchase Orders
//
const displayPO = async () => {
  const response = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getAllPO", _: Date.now() }, // cache-buster
  });

  if (response.status === 200) {
    displayPOTable(response.data);
  } else {
    Swal.fire("Error", "Failed to load purchase orders", "error");
  }
};

const displayPOTable = (pos) => {
  const tableDiv = document.getElementById("stockin-table-div");
  tableDiv.innerHTML = "";

  // paginate
  const { page, totalPages, items } = paginate(pos, poPage);
  poPage = page; // keep synced

  // table
  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>PO Number</th>
      <th>Supplier</th>
      <th>Warehouse</th>
      <th>Status</th>
      <th>Date</th>
      <th>Action</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  items.forEach((po) => {
    const row = document.createElement("tr");

    // normalize then render
    let status = String(po.status ?? "").trim().toLowerCase();
    if (status === "sent" || status === "draft" || status === "open") status = "pending";

function poActionDropdown(po, status){
  const canEdit = (status === "pending") && (user.role === "warehouse_manager" || user.role === "warehouse_clerk");
  const canCancel = (status === "pending") && (user.role === "warehouse_manager");
  const canCreateGRN = (status === "approved" || status === "partially_received");
  const canView = true;
  const canPrint = (status !== "pending" && status !== "cancelled");

  // build menu items conditionally
  const items = [];
  if (canView)
    items.push(`<li><a class="dropdown-item d-flex align-items-center gap-2 act-view" href="#"><i class="bi bi-eye text-primary"></i> View</a></li>`);
  if (canEdit)
    items.push(`<li><a class="dropdown-item d-flex align-items-center gap-2 act-edit" href="#"><i class="bi bi-pencil-square text-warning"></i> Edit</a></li>`);
  if (canCancel)
    items.push(`<li><a class="dropdown-item d-flex align-items-center gap-2 act-cancel" href="#"><i class="bi bi-x-circle text-danger"></i> Cancel</a></li>`);
  if (canCreateGRN)
    items.push(`<li><a class="dropdown-item d-flex align-items-center gap-2 act-create-grn" href="#"><i class="bi bi-box-arrow-in-down text-success"></i> Create GRN</a></li>`);
  if (canPrint)
    items.push(`<li><a class="dropdown-item d-flex align-items-center gap-2 act-print" href="#"><i class="bi bi-printer text-secondary"></i> Print</a></li>`);

  return `
    <td class="text-center">
      <div class="dropdown">
        <button class="btn btn-sm border-0 bg-transparent" data-bs-toggle="dropdown" style="padding:4px 8px;">
          <i class="bi bi-three-dots-vertical fs-5 text-secondary"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
          ${items.join("")}
        </ul>
      </div>
    </td>`;
}


row.innerHTML = `
  <td>${po.po_number}</td>
  <td>${po.supplier_name}</td>
  <td>${po.location_name}</td>
  <td>${statusBadge(status)}</td>
  <td>${po.date_created}</td>
  ${poActionDropdown(po, status)}
`;

    tbody.appendChild(row);

// PO dropdown actions
row.querySelector(".act-view")?.addEventListener("click", (e) => {
  e.preventDefault(); openPOModal(po.po_id);
});
row.querySelector(".act-edit")?.addEventListener("click", (e) => {
  e.preventDefault(); openPOEditModal(po.po_id);
});
row.querySelector(".act-cancel")?.addEventListener("click", async (e) => {
  e.preventDefault(); await updatePOStatus(po.po_id, "cancelled", "Cancel this PO?");
});
row.querySelector(".act-create-grn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    const chk = await axios.get(`${baseApiUrl}/purchase_order.php`, {
      params: { operation: "hasDraftGRN", json: JSON.stringify({ po_id: po.po_id }) },
    });
    if (chk?.data?.hasDraft) return Swal.fire("Draft GRN exists", "Please edit or confirm the draft GRN for this PO first.", "info");
  } catch(_){}
  await openCreateGRNModal(po.po_id);
});
row.querySelector(".act-print")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.dispatchEvent(new CustomEvent("po:print", { detail: { po_id: po.po_id } }));
});
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);

  // pager
  const pagerDiv = document.createElement("div");
  tableDiv.appendChild(pagerDiv);
  renderPager({
    container: pagerDiv,
    page,
    totalPages,
    onChange: (newPage) => {
      poPage = newPage;
      displayPOTable(pos); // re-render same dataset on page change
    },
  });
};


//
// 🔹 Update PO status helper
//
const updatePOStatus = async (po_id, newStatus, confirmText) => {
  const result = await Swal.fire({
    title: confirmText || "Are you sure?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  });
  if (!result.isConfirmed) return;

  const formData = new FormData();
  formData.append("operation", "updatePOStatus");
  formData.append("json", JSON.stringify({ po_id, status: newStatus }));

  try {
    const res = await axios.post(`${baseApiUrl}/purchase_order.php`, formData);
    if (res.data && (res.data.success === 1 || res.data.success === true)) {
      Swal.fire("Updated", `Status changed to "${newStatus}"`, "success");
      displayPO();
    } else {
      Swal.fire("Error", "Failed to update status", "error");
    }
  } catch (e) {
    console.error("updatePOStatus error:", e);
    Swal.fire("Error", "Request failed", "error");
  }
};


//
// 🔹 Display all GRNs
//
const displayGRN = async () => {
  try {
    const response = await axios.get(`${baseApiUrl}/purchase_order.php`, {
      params: { operation: "getAllGRN", _: Date.now() },
    });

    const data = response?.data;

    // Handle common non-array responses (error object, null, string, etc.)
    if (Array.isArray(data)) {
      renderGRNTable(data);
      return;
    }

    if (data && typeof data === "object" && data.success === 0) {
      console.error("getAllGRN error:", data.error);
      Swal.fire("Error", data.error || "Failed to load GRNs", "error");
      renderGRNTable([]); // render empty table
      return;
    }

    // Fallback: unknown shape
    console.warn("Unexpected getAllGRN payload:", data);
    renderGRNTable([]);
  } catch (err) {
    console.error("getAllGRN failed:", err);
    Swal.fire("Error", "Failed to load GRNs", "error");
    renderGRNTable([]);
  }
};

const renderGRNTable = (grns) => {
  const list = Array.isArray(grns) ? grns : [];
  const tableDiv = document.getElementById("grn-table-div");
  tableDiv.innerHTML = "";

  // paginate
  const { page, totalPages, items } = paginate(list, grnPage);
  grnPage = page;

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>GRN Ref</th>
      <th>PO Number</th>
      <th>Supplier</th>
      <th>Warehouse</th>
      <th>Status</th>
      <th>Date</th>
      <th>Action</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  if (items.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7" class="text-center text-muted">No GRNs found.</td>`;
    tbody.appendChild(tr);
  } else {
    items.forEach(g => {
      const row = document.createElement("tr");
      const status = String(g.status ?? "").toLowerCase();

function grnActionDropdown(g, status){
  const isDraft = (status === "draft");
  const canEdit = isDraft && (user.role === "warehouse_manager" || user.role === "warehouse_clerk");
  const canView = true;              // optional: view handler if you have one
  const canPrint = true;

  const items = [];
  if (canView)
    items.push(`<li><a class="dropdown-item d-flex align-items-center gap-2 act-grn-view" href="#"><i class="bi bi-eye text-primary"></i> View</a></li>`);
  if (canEdit)
    items.push(`<li><a class="dropdown-item d-flex align-items-center gap-2 act-grn-edit" href="#"><i class="bi bi-pencil-square text-warning"></i> Edit</a></li>`);
  if (canPrint)
    items.push(`<li><a class="dropdown-item d-flex align-items-center gap-2 act-grn-print" href="#"><i class="bi bi-printer text-secondary"></i> Print</a></li>`);

  return `
    <td class="text-center">
      <div class="dropdown">
        <button class="btn btn-sm border-0 bg-transparent" data-bs-toggle="dropdown" style="padding:4px 8px;">
          <i class="bi bi-three-dots-vertical fs-5 text-secondary"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
          ${items.join("")}
        </ul>
      </div>
    </td>`;
}


row.innerHTML = `
  <td>${g.reference_no || "(draft)"} </td>
  <td>${g.po_number || ""}</td>
  <td>${g.supplier_name || ""}</td>
  <td>${g.location_name || ""}</td>
  <td>${statusBadge(status)}</td>
  <td>${g.received_date || g.date_created || ""}</td>
  ${grnActionDropdown(g, status)}
`;

      tbody.appendChild(row);

row.querySelector(".act-grn-view")?.addEventListener("click", (e) => {
  e.preventDefault();
  // if you have a dedicated GRN view modal, call it here. Otherwise, reuse print or edit as "view".
  printGRN(g.grn_id); // or openEditGRNModal(g.grn_id) for draft
});

row.querySelector(".act-grn-edit")?.addEventListener("click", (e) => {
  e.preventDefault(); openEditGRNModal(g.grn_id);
});

row.querySelector(".act-grn-print")?.addEventListener("click", (e) => {
  e.preventDefault(); printGRN(g.grn_id);
});

    });
  }

  table.appendChild(tbody);
  tableDiv.appendChild(table);

  // pager
  const pagerDiv = document.createElement("div");
  tableDiv.appendChild(pagerDiv);
  renderPager({
    container: pagerDiv,
    page,
    totalPages,
    onChange: (newPage) => {
      grnPage = newPage;
      renderGRNTable(grns); // re-render same dataset on page change
    },
  });
};



// 🔁 refresh GRN list after create/confirm/update
window.addEventListener("grn:created", () => { displayGRN(); displayPO(); });
window.addEventListener("grn:updated", () => { displayGRN(); displayPO(); });
window.addEventListener("grn:confirmed", () => { displayGRN(); displayPO(); });
// 🔧 Print HTML silently via a hidden iframe (no new tab)
// 🔧 Print via hidden iframe. Cleans up and runs an optional callback after printing.
// Single-fire print via hidden iframe (no new tab)
function printHTML(html, onAfterPrint) {
  // strip any inline window.print() scripts to avoid double print
  const htmlNoAuto = String(html).replace(/<script[^>]*>[\s\S]*?print\(\);?[\s\S]*?<\/script>/gi, "");

  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, { position:"fixed", right:"0", bottom:"0", width:"0", height:"0", border:"0" });
  document.body.appendChild(iframe);

  const iwin = iframe.contentWindow;
  const idoc = iwin.document;
  idoc.open(); idoc.write(htmlNoAuto); idoc.close();

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    setTimeout(() => { try { document.body.removeChild(iframe); } catch(_) {} }, 50);
    if (typeof onAfterPrint === "function") onAfterPrint();
  };

  // fire cleanup once when dialog closes
  iwin.addEventListener?.("afterprint", cleanup, { once: true });

  // fallback for older engines
  const mq = iwin.matchMedia?.("print");
  if (mq && mq.addListener) {
    const handler = (m) => { if (!m.matches) { mq.removeListener(handler); cleanup(); } };
    mq.addListener(handler);
  }

  const go = () => {
    try { iwin.focus(); } catch(_) {}
    // trigger print exactly once from parent
    iwin.print();
    // safety net if afterprint never fires
    setTimeout(cleanup, 4000);
  };

  if (idoc.readyState === "complete") setTimeout(go, 50);
  else iframe.onload = go;
}

function statusBadge(status) {
  const s = String(status || "").trim().toLowerCase();
  const map = {
    // PO statuses
    pending: "info",
    approved: "primary",
    partially_received: "warning",
    received: "success",
    cancelled: "danger",
    // GRN statuses
    draft: "secondary",
    confirmed: "success",
  };
  const cls = map[s] || "secondary";
  // prettier label (replace underscores with spaces)
  const label = s.replace(/_/g, " ");
  return `<span class="badge text-bg-${cls} text-uppercase">${label}</span>`;
}


// Simple print (like your PO printer)
async function printGRN(grn_id) {
  const nf = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
  const res = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getGRN", json: JSON.stringify({ grn_id }) },
  });
  const g = res.data || {};
  const items = Array.isArray(g.items) ? g.items : [];
  const rows = items.map(i => {
    const qty = Number(i.received_qty || 0);
    const cost = Number(i.unit_cost || 0);
    return `
      <tr>
        <td>${i.product_name || ""}</td>
        <td class="text-end">${qty}</td>
        <td class="text-end">${nf.format(cost)}</td>
        <td class="text-end">${nf.format(qty * cost)}</td>
      </tr>`;
  }).join("");
  const grand = items.reduce((s,i)=> s + (Number(i.received_qty||0)*Number(i.unit_cost||0)), 0);

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${g.reference_no || "(DRAFT GRN)"}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#0f172a; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  th, td { border:1px solid #e2e8f0; padding:8px; font-size:13px; }
  th { background:#f1f5f9; text-align:left; }
  .text-end { text-align:right; }
</style>
</head><body>
  <h2>Goods Received Note ${g.reference_no ? `(${g.reference_no})` : "(DRAFT)"}</h2>
  <div>PO: <b>${g.po_number || ""}</b></div>
  <div>Supplier: <b>${g.supplier_name || ""}</b></div>
  <div>Warehouse: <b>${g.location_name || ""}</b></div>
  <div>Status: <b>${g.status}</b></div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th class="text-end" style="width:12%;">Received</th>
        <th class="text-end" style="width:16%;">Unit Cost</th>
        <th class="text-end" style="width:16%;">Line Total</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="4">No items.</td></tr>`}</tbody>
    <tfoot>
      <tr>
        <td colspan="3" class="text-end"><b>GRN Total</b></td>
        <td class="text-end"><b>${nf.format(grand)}</b></td>
      </tr>
    </tfoot>
  </table>
  <script>window.onload = () => { window.focus(); window.print(); };</script>
</body></html>`;

 printHTML(html, () => {
    const modalEl = document.getElementById("blank-modal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
  });
}

// Opens a print-friendly window for the given PO and triggers the browser Print dialog
async function printPO(po_id) {
  const nf = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
  const res = await axios.get(`${baseApiUrl}/purchase_order.php`, {
    params: { operation: "getPO", json: JSON.stringify({ po_id }) },
  });
  const po = res.data || {};
  const items = Array.isArray(po.items) ? po.items : [];

  const rows = items.map(i => {
    const ordered = Number(i.ordered_qty || 0);
    const received = Number(i.received_qty || 0);
    const cost = Number(i.unit_cost || 0);
    const line = ordered * cost;
    return `
      <tr>
        <td>${i.product_name || ""}</td>
        <td class="text-end">${ordered}</td>
        <td class="text-end">${received}</td>
        <td class="text-end">${nf.format(cost)}</td>
        <td class="text-end">${nf.format(line)}</td>
      </tr>`;
  }).join("");

  const grand = items.reduce((s,i)=> s + (Number(i.ordered_qty||0)*Number(i.unit_cost||0)), 0);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>PO ${po.po_number || ""}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif; color:#0f172a; }
    h1,h2,h3 { margin:0; }
    .muted { color:#64748b; font-size:12px; }
    .row { display:flex; gap:16px; margin: 6px 0; }
    .col { flex:1; }
    table { width:100%; border-collapse:collapse; margin-top:16px; }
    th, td { border:1px solid #e2e8f0; padding:8px; font-size:13px; }
    th { background:#f1f5f9; text-align:left; }
    .text-end { text-align:right; }
    .totals td { font-weight:700; }
    .footer { margin-top:28px; font-size:12px; display:flex; gap:24px; }
    .sig { margin-top:40px; }
    .sig .line { border-top:1px solid #94a3b8; width:240px; margin-top:32px; }
    .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; background:#e2e8f0; }
    .badge.pending { background:#dbeafe; color:#1e40af; }
  </style>
</head>
<body>
  <h2>Purchase Order</h2>
  <div class="muted">Generated: ${new Date().toLocaleString()}</div>

  <div class="row" style="margin-top:12px;">
    <div class="col">
      <div class="muted">reference_no</div>
      <div><strong>${po.po_number || ""}</strong></div>
    </div>
    <div class="col">
      <div class="muted">Status</div>
      <div><span class="badge pending">${po.status || "pending"}</span></div>
    </div>
  </div>

  <div class="row">
    <div class="col">
      <div class="muted">Supplier</div>
      <div><strong>${po.supplier_name || ""}</strong></div>
    </div>
    <div class="col">
      <div class="muted">Warehouse</div>
      <div><strong>${po.location_name || ""}</strong></div>
    </div>
  </div>

  <div class="row">
    <div class="col">
      <div class="muted">Created By</div>
      <div><strong>${po.created_by_name || po.created_by || ""}</strong></div>
    </div>
    <div class="col">
      <div class="muted">Date</div>
      <div>${po.date_created || ""}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th class="text-end" style="width:12%;">ordered_qty</th>
        <th class="text-end" style="width:12%;">received_qty</th>
        <th class="text-end" style="width:16%;">Unit Cost</th>
        <th class="text-end" style="width:16%;">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="5" class="muted">No items.</td></tr>`}
    </tbody>
    <tfoot>
      <tr class="totals">
        <td colspan="4" class="text-end">Grand Total</td>
        <td class="text-end">${nf.format(grand)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <div class="sig">
      <div class="muted">Prepared By</div>
      <div class="line"></div>
    </div>
    <div class="sig">
      <div class="muted">Approved By</div>
      <div class="line"></div>
    </div>
  </div>
   <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;
  // trigger print once & close the modal afterward
  printHTML(html, () => {
    const modalEl = document.getElementById("blank-modal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
  });
}