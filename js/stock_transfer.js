import { requireRole, logout } from "./auth.js";
import { viewTransferModal } from "./modules/stock_transfer_modal.js";

const user = requireRole(["admin","store_clerk","warehouse_manager","warehouse_clerk"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

// --- constants
// --- Role & location detection ---
const MAIN_STORE_ID = 1; // adjust if needed

// warehouse roles
const isWarehouseRole = ["warehouse_manager", "warehouse_clerk"].includes(user.role);

// try multiple fields to find assigned warehouse/location
const assignedLoc = Number(
  user.assigned_location_id ??
  user.warehouse_id ??
  user.location_id ??
  0
);
const BUILDER_PAGE_SIZE = 10;
const TRANSFERS_PAGE_SIZE = 10;

// caches (change when From changes)
let productsCache = [];                  // [{product_id, product_name, sku, available_qty}]
let productMap    = new Map();           // product_id -> product row

// builder rows stored as data objects so we can paginate easily
let builderRows = []; // {productId, qty}

document.addEventListener("DOMContentLoaded", () => {
  const loggedUserEl = document.getElementById("logged-user");
  if (loggedUserEl) loggedUserEl.textContent = user.name;

  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  wireBuilderUI();
  loadLocations();       // fill From/To selects
  loadTransfersList();   // fill “Recent Transfer” table
});

/* =============== Builder Card =============== */

function wireBuilderUI() {
  $("from-location-select")?.addEventListener("change", onFromChanged);
  $("btn-add-row")?.addEventListener("click", addBuilderRow);
  $("btn-submit-request")?.addEventListener("click", openQuantityModal);
  $("builder-prev")?.addEventListener("click", () => changeBuilderPage(-1));
  $("builder-next")?.addEventListener("click", () => changeBuilderPage(1));
}

async function loadLocations() {
  const res = await axios.get(`${baseApiUrl}/stock_transfer.php`, {
    params: { operation: "getLocations" },
  });
  const list = Array.isArray(res.data) ? res.data : [];
  const fromSel = $("from-location-select");
  const toSel = $("to-location-select");
  if (!fromSel || !toSel) return;
  fromSel.length = 1;
  toSel.length = 1;
  list.forEach((loc) => {
    fromSel.appendChild(new Option(loc.location_name, loc.location_id));
    toSel.appendChild(new Option(loc.location_name, loc.location_id));
  });
}

async function onFromChanged() {
  builderRows = [];
  renderBuilderTable();
  productsCache = [];
  productMap.clear();

  const fromId = num($("from-location-select")?.value);
  if (!fromId) {
    await loadLocations();
    return;
  }
  await adjustToSelectForFrom(fromId);
  const res = await axios.get(`${baseApiUrl}/stock_transfer.php`, {
    params: { operation: "getAvailableProducts", json: JSON.stringify({ fromLocationId: fromId }) },
  });
  productsCache = Array.isArray(res.data) ? res.data : [];
  productMap = new Map(productsCache.map((p) => [Number(p.product_id), p]));
}

async function adjustToSelectForFrom(fromId) {
  const res = await axios.get(`${baseApiUrl}/stock_transfer.php`, { params: { operation: "getLocations" } });
  const list = Array.isArray(res.data) ? res.data : [];
  const toSel = $("to-location-select");
  if (!toSel) return;
  toSel.length = 1;
  if (Number(fromId) === MAIN_STORE_ID) {
    list.forEach((loc) => {
      if (Number(loc.location_id) !== MAIN_STORE_ID)
        toSel.appendChild(new Option(loc.location_name, loc.location_id));
    });
  } else {
    const main = list.find((l) => Number(l.location_id) === MAIN_STORE_ID);
    if (main) toSel.appendChild(new Option(main.location_name, main.location_id));
  }
  toSel.selectedIndex = toSel.options.length === 2 ? 1 : 0;
}


/* ---------- Builder row management (with pagination & remove) ---------- */

function addBuilderRow() {
  const fromId = num($("from-location-select")?.value);
  const toId = num($("to-location-select")?.value);
  if (!fromId || !toId)
    return Swal.fire("Select locations", "Choose both From and To.", "warning");
  if (fromId === toId)
    return Swal.fire("Invalid", "From and To must be different.", "error");
  if (!productsCache.length)
    return Swal.fire("No stock", "No products available at selected From location.", "info");

  builderRows.push({ productId: null, quantity: 0 });
  const lastPage = Math.ceil(builderRows.length / BUILDER_PAGE_SIZE);
  setBuilderPage(lastPage);
  renderBuilderTable();
}

let builderCurrentPage = 1;
function setBuilderPage(page) {
  builderCurrentPage = Math.max(1, Math.min(page, Math.ceil(builderRows.length / BUILDER_PAGE_SIZE) || 1));
}
function changeBuilderPage(delta) {
  setBuilderPage(builderCurrentPage + delta);
  renderBuilderTable();
}

function renderBuilderTable() {
  const table = $("request-table");
  const tbody = builderBody();
  if (!table || !tbody) return;

  table.classList.add("table", "table-sm", "table-hover", "w-100", "align-middle");
  table.style.width = "100%";

  toggleBuilderVisibility(builderRows.length > 0);

  const total = builderRows.length;
  const pages = Math.max(1, Math.ceil(total / BUILDER_PAGE_SIZE));
  const page = Math.max(1, Math.min(builderCurrentPage, pages));
  const start = (page - 1) * BUILDER_PAGE_SIZE;
  const end = Math.min(start + BUILDER_PAGE_SIZE, total);
  const pageRows = builderRows.slice(start, end);
  tbody.innerHTML = "";

  pageRows.forEach((r, idx) => {
    const globalIndex = start + idx;
    const selectedProductId = r.productId;

    const tr = document.createElement("tr");
    tr.dataset.globalIndex = String(globalIndex);

    const prodOptions = ['<option value="">— Select product —</option>']
      .concat(productsCache.map(p =>
        `<option value="${p.product_id}" ${p.product_id==selectedProductId ? "selected": ""}>${(p.sku||"").trim()} ${p.product_name}</option>`
      )).join("");

    tr.innerHTML = `
      <td style="min-width:320px; width:55%;">
        <select class="form-select form-select-sm sel-product w-100">${prodOptions}</select>
      </td>
      <td class="text-center cell-avail" style="width:110px; vertical-align:middle;">-</td>
      <td style="width:150px;">
        <div class="d-flex justify-content-end">
          <input type="number" 
                 class="form-control form-control-sm inp-qty text-end" 
                 min="0" placeholder="0" ${selectedProductId ? "" : "disabled"} value="${r.quantity || ""}" 
                 style="max-width:110px;">
        </div>
      </td>
      <td class="text-center" style="width:60px; vertical-align:middle;">
        <button type="button" 
                class="btn btn-sm btn-outline-danger btn-remove-row d-inline-flex align-items-center justify-content-center"
                style="width:32px; height:32px; padding:0; border-radius:999px;" aria-label="Remove row">
          <i class="bi bi-x-lg" style="font-size:14px; line-height:1;"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);

    const sel = tr.querySelector(".sel-product");
    const qty = tr.querySelector(".inp-qty");
    const availCell = tr.querySelector(".cell-avail");
    const removeBtn = tr.querySelector(".btn-remove-row");

    if (selectedProductId) {
      const rec = productMap.get(Number(selectedProductId));
      const avail = Number(rec?.available_qty || 0);
      availCell.textContent = String(avail);
      qty.disabled = false;
      qty.max = String(avail);
    } else {
      availCell.textContent = "-";
      qty.disabled = true;
    }

    sel.addEventListener("change", () => {
      const val = num(sel.value);
      builderRows[globalIndex].productId = val || null;
      builderRows[globalIndex].quantity = 0;
      qty.value = "";
      if (!val) {
        availCell.textContent = "-";
        qty.disabled = true;
        return;
      }
      const rec = productMap.get(Number(val));
      const avail = Number(rec?.available_qty || 0);
      availCell.textContent = String(avail);
      qty.disabled = false;
      qty.max = String(avail);
    });

    qty.addEventListener("input", () => {
      const q = clamp(num(qty.value), 0, num(qty.max));
      qty.value = String(q);
      builderRows[globalIndex].quantity = q;
    });

    removeBtn.addEventListener("click", () => {
      builderRows.splice(globalIndex, 1);
      const maxPage = Math.max(1, Math.ceil(builderRows.length / BUILDER_PAGE_SIZE));
      if (builderCurrentPage > maxPage) builderCurrentPage = maxPage;
      renderBuilderTable();
    });
  });

  // Pager with Next/Prev buttons
// Pager with Next/Prev buttons
const builderPager = $("builder-pager");
if (builderPager) {
  builderPager.style.display = builderRows.length > 0 ? "flex" : "none"; // make visible if rows exist
  builderPager.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mt-2 w-100">
      <button class="btn btn-sm btn-outline-primary" ${page === 1 ? "disabled" : ""} id="builder-prev">Prev</button>
      <div class="small text-muted text-center">Page ${page} of ${pages} (${total} rows)</div>
      <button class="btn btn-sm btn-outline-primary" ${page === pages ? "disabled" : ""} id="builder-next">Next</button>
    </div>
  `;

  $("#builder-prev").addEventListener("click", () => {
    if (builderCurrentPage > 1) {
      builderCurrentPage--;
      renderBuilderTable();
    }
  });
  $("#builder-next").addEventListener("click", () => {
    if (builderCurrentPage < pages) {
      builderCurrentPage++;
      renderBuilderTable();
    }
  });
}

}




/* ---------- Toggle builder visibility ---------- */

function toggleBuilderVisibility(visible) {
  $("request-table").style.display = visible ? "" : "none";
  $("btn-submit-request").style.display = visible ? "" : "none";
}
function builderBody() { return $("request-table")?.querySelector("tbody"); }

/* =============== Quantity-only Modal + Save (PENDING) =============== */

async function openQuantityModal(){
  const fromId = num($("from-location-select")?.value);
  const toId   = num($("to-location-select")?.value);
  if (!fromId || !toId){
    return Swal.fire("Select locations", "Choose both From and To.", "warning");
  }
  if (fromId === toId){
    return Swal.fire("Invalid", "From and To must be different.", "error");
  }

  // collect non-empty lines from builderRows
  const lines = builderRows
    .filter(r => r.productId && r.quantity && r.quantity > 0)
    .map(r => ({ productId: r.productId, quantity: r.quantity }));

  if (!lines.length){
    return Swal.fire("No items", "Add at least one product with quantity.", "warning");
  }

  // build modal rows (use productMap)
  const rowsHtml = lines.map(l => {
    const p = productMap.get(l.productId);
    const avail = num(p?.available_qty);
    return `
      <tr data-pid="${l.productId}">
        <td>${(p?.sku||"")} ${p?.product_name||""}</td>
        <td class="text-end">${avail}</td>
        <td style="width:140px;"><input type="number" class="form-control form-control-sm inp-qty-modal" min="0" max="${avail}" value="${l.quantity}"></td>
      </tr>
    `;
  }).join("");

  const modal = new bootstrap.Modal($("blank-modal"), { keyboard: true, backdrop: "static" });
  setElText("blank-modal-title", "Review Quantities");
  setElHtml("blank-main-div", `
    <div class="mb-2 small text-muted">From <b>${fromId}</b> → To <b>${toId}</b></div>
    <div class="table-responsive" style="max-height:55vh;overflow:auto;">
      <table class="table table-sm align-middle">
        <thead><tr><th>Product</th><th class="text-end">Available</th><th>Qty</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `);
  setElHtml("blank-modal-footer", `
    <button type="button" class="btn btn-primary btn-sm w-100" id="btn-modal-confirm">Confirm</button>
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `);

  $("btn-modal-confirm")?.addEventListener("click", async () => {
    // recollect (respect max)
    const finalLines = [];
    document.querySelectorAll("#blank-main-div tbody tr").forEach(tr => {
      const pid = num(tr.getAttribute("data-pid"));
      const qEl = tr.querySelector(".inp-qty-modal");
      const q   = clamp(num(qEl?.value), 0, num(qEl?.getAttribute("max")));
      if (pid && q > 0) finalLines.push({ productId: pid, quantity: q });
    });
    if (!finalLines.length) return Swal.fire("No items", "All quantities are zero.", "info");

    // 1) header: pending
    const fd1 = new FormData();
    fd1.append("operation", "createDraftTransfer");
    fd1.append("json", JSON.stringify({
      fromLocationId: fromId,
      toLocationId: toId,
      requestedBy: user.staff_id
    }));
    const r1 = await axios({ url: `${baseApiUrl}/stock_transfer.php`, method: "POST", data: fd1 });
    const transferId = num(r1.data);
    if (!transferId) return Swal.fire("Error", "Failed to create transfer header.", "error");

    // 2) add lines
    const fd2 = new FormData();
    fd2.append("operation", "addDraftItems");
    fd2.append("json", JSON.stringify({ stockTransferId: transferId, items: finalLines }));
    const r2 = await axios({ url: `${baseApiUrl}/stock_transfer.php`, method: "POST", data: fd2 });
    if (r2.data !== 1) return Swal.fire("Error", r2.data?.message || "Failed adding items.", "error");

    Swal.fire("Saved", `Transfer #${transferId} created as Pending.`, "success");
    modal.hide();

    // reset builder
    builderRows = [];
    renderBuilderTable();
    toggleBuilderVisibility(false);

    // refresh transfers list
    loadTransfersList();
  });

  modal.show();
}

/* =============== Recent Transfer (2nd table) =============== */

let transfersCache = [];
let transfersPage = 1;

async function loadTransfersList() {
  const host = $("stockin-table-div");
  if (isWarehouseRole && !assignedLoc) {
    host.innerHTML = `<div class="alert alert-warning my-2">No warehouse assigned. Contact admin.</div>`;
    return;
  }
  try {
    const filters = {};
    if (isWarehouseRole && assignedLoc) filters.onlyLocationId = assignedLoc;
    const res = await axios.get(`${baseApiUrl}/stock_transfer.php`, { params: { operation: "getAllTransfers", json: JSON.stringify(filters) } });
    let rows = Array.isArray(res.data) ? res.data : [];
    if (isWarehouseRole && assignedLoc)
      rows = rows.filter(r => Number(r.from_location_id) === assignedLoc || Number(r.to_location_id) === assignedLoc);
    transfersCache = rows;
    transfersPage = 1;
    renderTransfers();
  } catch (err) {
    host.innerHTML = `<div class="alert alert-danger my-2">Failed to load transfers.</div>`;
  }
}

function renderTransfers() {
  const host = $("stockin-table-div");
  if (!host) return;
  host.innerHTML = "";

  const rows = transfersCache;
  if (!rows.length) {
    host.innerHTML = `<div class="text-center text-muted border rounded p-4">No transfers found.</div>`;
    return;
  }

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / TRANSFERS_PAGE_SIZE));
  if (transfersPage > totalPages) transfersPage = totalPages;
  const start = (transfersPage - 1) * TRANSFERS_PAGE_SIZE;
  const pageRows = rows.slice(start, start + TRANSFERS_PAGE_SIZE);

  const table = document.createElement("table");
  table.className = "table table-hover table-striped table-sm align-middle";
  table.innerHTML = `
    <thead class="table-light sticky-top">
      <tr>
        <th>#</th>
        <th>From</th>
        <th>To</th>
        <th>Status</th>
        <th>Items</th>
        <th>Date</th>
        <th class="text-end">Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

pageRows.forEach((r, idx) => {
  const status = String(r.status || "").toLowerCase();
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${start + idx + 1}</td>
    <td>${r.from_location}</td>
    <td>${r.to_location}</td>
    <td>${statusBadge(status)}</td>
    <td>${r.item_count}</td>
    <td>${formatDate(r.transfer_created)}</td>
    <td class="text-end"></td>
  `;

    const actions = tr.querySelector("td.text-end");
    actions.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-sm btn-light border-0" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-three-dots-vertical"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item view-transfer" href="#" data-id="${r.stock_transfer_id}"><i class="bi bi-eye me-2"></i> View</a></li>
        </ul>
      </div>
    `;

    const menu = actions.querySelector(".dropdown-menu");

    const isStoreToThisWh = Number(r.from_location_id) === MAIN_STORE_ID &&
                            Number(r.to_location_id) === assignedLoc;
    const isThisWhToStore = Number(r.from_location_id) === assignedLoc &&
                            Number(r.to_location_id) === MAIN_STORE_ID;
    const isStoreToAnyWh = Number(r.from_location_id) === MAIN_STORE_ID &&
                           Number(r.to_location_id) !== MAIN_STORE_ID;
    const isAnyWhToStore = Number(r.to_location_id) === MAIN_STORE_ID &&
                           Number(r.from_location_id) !== MAIN_STORE_ID;

    if (isWarehouseRole) {
      if (isStoreToThisWh && status === "in_transit") {
        menu.insertAdjacentHTML('beforeend', `<li><a class="dropdown-item accept-transfer" href="#" data-id="${r.stock_transfer_id}"><i class="bi bi-check2 me-2"></i> Accept</a></li>`);
      }
      if (isThisWhToStore && status === "pending") {
        menu.insertAdjacentHTML('beforeend', `<li><a class="dropdown-item transit-transfer" href="#" data-id="${r.stock_transfer_id}"><i class="bi bi-truck me-2"></i> Transit</a></li>`);
      }
    } else {
      if (isStoreToAnyWh && status === "pending") {
        menu.insertAdjacentHTML('beforeend', `<li><a class="dropdown-item transit-transfer" href="#" data-id="${r.stock_transfer_id}"><i class="bi bi-truck me-2"></i> Transit</a></li>`);
      }
      if (isAnyWhToStore && status === "in_transit") {
        menu.insertAdjacentHTML('beforeend', `<li><a class="dropdown-item accept-transfer" href="#" data-id="${r.stock_transfer_id}"><i class="bi bi-check2 me-2"></i> Accept</a></li>`);
      }
    }

    tbody.appendChild(tr);
  });

  host.appendChild(table);

  // wire menu actions
  host.querySelectorAll(".view-transfer").forEach(a => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      openViewTransfer(num(a.dataset.id));
    });
  });
  host.querySelectorAll(".transit-transfer").forEach(a => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      setStatus(num(a.dataset.id), "in_transit");
    });
  });
  host.querySelectorAll(".accept-transfer").forEach(a => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      setStatus(num(a.dataset.id), "completed");
    });
  });

  // pagination
  const pager = document.createElement("div");
  pager.className = "d-flex justify-content-between align-items-center mt-2";
  pager.innerHTML = `
    <div id="transfers-info" class="small text-muted">Showing ${Math.min(start+1,total)} to ${Math.min(start+pageRows.length,total)} of ${total} entries</div>
    <ul class="pagination pagination-sm mb-0" id="transfers-pagination"></ul>
  `;
  host.appendChild(pager);

  const pagEl = $("transfers-pagination");
  pagEl.innerHTML = "";

  const makeLi = (label, disabled, onClick) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link">${label}</button>`;
    if (!disabled) li.querySelector("button").addEventListener("click", onClick);
    pagEl.appendChild(li);
  };

  makeLi("««", transfersPage === 1, () => { transfersPage = 1; renderTransfers(); });
  makeLi("‹", transfersPage === 1, () => { if (transfersPage>1) transfersPage--; renderTransfers(); });

  const curLi = document.createElement("li");
  curLi.className = "page-item active";
  curLi.innerHTML = `<button class="page-link">${transfersPage}</button>`;
  pagEl.appendChild(curLi);

  makeLi("›", transfersPage === totalPages, () => { if (transfersPage<totalPages) transfersPage++; renderTransfers(); });
  makeLi("»»", transfersPage === totalPages, () => { transfersPage = totalPages; renderTransfers(); });
}


/* ---------- view / status helpers ---------- */


async function viewTransfer(id){
  const res = await axios.get(`${baseApiUrl}/stock_transfer.php`, {
    params: { operation: "getTransfer", json: JSON.stringify({ stockTransferId: id }) }
  });
  const t = res.data || {};
  const lines = (t.items||[]).map(i => `${(i.sku||"")} ${i.product_name} × ${i.quantity}`).join("<br>") || "(no items)";
  Swal.fire({
    title: `Transfer #${t.header?.stock_transfer_id}`,
    html: `<div class="text-start">
      <div><b>From:</b> ${t.header?.from_location}</div>
      <div><b>To:</b> ${t.header?.to_location}</div>
      <div><b>Status:</b> ${t.header?.status}</div>
      <hr/>${lines}
    </div>`
  });
}

async function setStatus(id, status){
  try{
    const fd = new FormData();
    fd.append("operation", "updateTransferStatus");
    fd.append("json", JSON.stringify({ stockTransferId: id, status }));

    const res = await axios({
      url: `${baseApiUrl}/stock_transfer.php`,
      method: "POST",
      data: fd
    });

    if (res.data === 1) {
      Swal.fire("OK", `Status set to ${status}.`, "success");
      loadTransfersList();
    } else {
      const msg = (res.data && (res.data.message || res.data.error)) || "Failed.";
      Swal.fire("Error", msg, "error");
    }
  }catch(err){
    Swal.fire("Error", err?.message || "Network error", "error");
  }
}

/* =============== helpers =============== */

async function openViewTransfer(id) {
  if (typeof viewTransferModal === "function") viewTransferModal({ stockTransferId: id });
}

function $(id) {
  return document.getElementById(id);
}
function num(v) {
  return Number(v || 0);
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(v, max));
}
function formatDate(s) {
  const d = new Date(s);
  return isNaN(d) ? "" : d.toLocaleString();
}
function statusBadge(s) {
  const map = { completed: "success", in_transit: "warning", pending: "info" };
  const cls = map[s] || "secondary";
  const label = s.replace(/_/g, " ");
  return `<span class="badge text-bg-${cls} text-uppercase">${label}</span>`;
}
function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setElHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
