// purchase_return.js
import { requireRole, logout } from "./auth.js";
import { openPRViewModal, openPREditModal, openPRReviewModal } from "./modules/purchase_return_modal.js";

const user = requireRole(["warehouse_manager", "warehouse_clerk"]);
const baseApiUrl =
  sessionStorage.getItem("baseApiUrl") ||
  sessionStorage.getItem("baseAPIUrl") ||
  "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

// ---------- helpers ----------
function statusBadge(status) {
  const s = String(status || "").trim().toLowerCase();
  const map = {
    pending: "warning",
    confirmed: "info",   // was success
    returned: "success", // new
    cancelled: "danger"
  };
  const cls = map[s] || "secondary";
  return `<span class="badge text-bg-${cls} text-uppercase">${s.replace(/_/g," ")}</span>`;
}

// Single-fire iframe printer (modal module uses this)
function printHTML(html, onAfterPrint) {
  const htmlNoAuto = String(html).replace(/<script[^>]*>[\s\S]*?print\(\);?[\s\S]*?<\/script>/gi, "");
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);

  const iwin = iframe.contentWindow;
  const idoc = iwin.document;
  idoc.open(); idoc.write(htmlNoAuto); idoc.close();

  let done = false;
  const cleanup = () => { if (done) return; done = true;
    setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 50);
    onAfterPrint?.();
  };

  iwin.addEventListener?.("afterprint", cleanup, { once: true });
  const mq = iwin.matchMedia?.("print");
  if (mq && mq.addListener) {
    const h = (m) => { if (!m.matches) { mq.removeListener(h); cleanup(); } };
    mq.addListener(h);
  }

  const go = () => { try { iwin.focus(); } catch {} iwin.print(); setTimeout(cleanup, 4000); };
  if (idoc.readyState === "complete") setTimeout(go, 50); else iframe.onload = go;
}

// expose to modal module
window.__PR_HELPERS__ = { statusBadge, printHTML };

// ---------- state ----------
let suppliers = [];
let currentProducts = []; // supplier products with available_qty > 0
let rowCounter = 0;

// ---------- init ----------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user")?.append(` (${user.name || ""})`);
  document.getElementById("btn-logout")?.addEventListener("click", logout);

  wireBuilderUI();
  loadSuppliers();
  displayPR();

  // refresh list after actions
  window.addEventListener("pr:created", displayPR);
  window.addEventListener("pr:updated", displayPR);
  window.addEventListener("pr:confirmed", displayPR);
});

// ---------- builder UI ----------
function wireBuilderUI() {
  document.getElementById("supplier-select")?.addEventListener("change", async (e) => {
    clearBuilder();
    const sup = e.target.value;
    if (!sup) return;
    await loadProductsForReturn(sup);
  });

  document.getElementById("btn-add-row")?.addEventListener("click", () => {
    const supplier_id = document.getElementById("supplier-select")?.value;
    if (!supplier_id) return Swal.fire("Please select a supplier first");
    if (!currentProducts.length) return Swal.fire("No in-stock products for this supplier at your warehouse.");
    addRow();
  });

  document.getElementById("btn-submit-request")?.addEventListener("click", () => {
    const items = gatherBuilderRows();
    if (!items.length) return Swal.fire("No items selected");
    openPRReviewModal({ supplier_id: document.getElementById("supplier-select").value, items });
  });
}
function clearBuilder() {
  currentProducts = [];
  document.querySelector("#request-table tbody")?.replaceChildren();
  const t = document.getElementById("request-table");
  if (t) t.style.display = "none";
  const s = document.getElementById("btn-submit-request");
  if (s) s.style.display = "none";
  const g = document.getElementById("grand-total");
  if (g) g.textContent = "0.00";
}

// ---------- data loads ----------
async function loadSuppliers() {
  const sel = document.getElementById("supplier-select");
  if (!sel) return;
  sel.innerHTML = `<option value="">— Filter by Supplier —</option>`;
  const r = await axios.get(`${baseApiUrl}/purchase_return.php`, { params: { operation: "getSuppliers" } });
  suppliers = Array.isArray(r.data) ? r.data : [];
  suppliers.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.supplier_id;
    o.textContent = `${s.name} (${s.company_name})`;
    sel.appendChild(o);
  });
}

async function loadProductsForReturn(supplier_id) {
  const r = await axios.get(`${baseApiUrl}/purchase_return.php`, {
    params: { operation: "getProductsForReturn", json: JSON.stringify({ supplier_id, staff_id: user.staff_id }) },
  });
  currentProducts = Array.isArray(r.data) ? r.data : [];
}

// ---------- builder rows ----------
function addRow() {
  const table = document.getElementById("request-table");
  table.style.display = "table";
  document.getElementById("btn-submit-request").style.display = "inline-block";

  const tbody = table.querySelector("tbody");
  rowCounter++;

  const productOptions = currentProducts.map(
    (p) => `<option value="${p.product_id}" data-cost="${p.cost_price}" data-avail="${p.available_qty}">
              ${p.product_name} (${p.model}) — Avail: ${p.available_qty}
            </option>`
  ).join("");

  const tr = document.createElement("tr");
  tr.dataset.row = rowCounter;
  tr.innerHTML = `
    <td>
      <select class="form-select form-select-sm product-select">
        <option value="">— Select Product —</option>
        ${productOptions}
      </select>
    </td>
    <td><input type="number" class="form-control form-control-sm qty-input" value="1" min="1"></td>
    <td><input type="text" class="form-control form-control-sm note-input"></td>
    <td><input type="number" class="form-control form-control-sm cost-input" value="0" step="0.01" disabled></td>
    <td class="line-total">0.00</td>
    <td><button class="btn btn-sm btn-danger btn-remove">✕</button></td>
  `;
  tbody.appendChild(tr);

  const sel = tr.querySelector(".product-select");
  const qty = tr.querySelector(".qty-input");
  const cost = tr.querySelector(".cost-input");
  const lt = tr.querySelector(".line-total");

  const recalc = () => {
    const q = parseFloat(qty.value) || 0;
    const c = parseFloat(cost.value) || 0;
    lt.textContent = (q * c).toFixed(2);
    updateGrand();
  };

  sel.addEventListener("change", () => {
    const o = sel.options[sel.selectedIndex];
    if (!o || !o.dataset.avail) return;
    const avail = Number(o.dataset.avail || 0);
    const cst = Number(o.dataset.cost || 0);
    cost.value = cst.toFixed(2);
    qty.max = String(Math.max(1, avail));
    if (Number(qty.value) > avail) qty.value = avail;
    recalc();
  });
  qty.addEventListener("input", () => {
    const o = sel.options[sel.selectedIndex];
    const avail = Number(o?.dataset?.avail || 0);
    if (Number(qty.value) > avail) qty.value = avail;
    if (Number(qty.value) < 1) qty.value = 1;
    recalc();
  });

  tr.querySelector(".btn-remove").addEventListener("click", () => {
    tr.remove();
    if (!tbody.querySelector("tr")) {
      table.style.display = "none";
      document.getElementById("btn-submit-request").style.display = "none";
    }
    updateGrand();
  });

  recalc();
}

function updateGrand() {
  let t = 0;
  document.querySelectorAll(".line-total").forEach((td) => (t += parseFloat(td.textContent) || 0));
  document.getElementById("grand-total").textContent = t.toFixed(2);
}

function gatherBuilderRows() {
  const rows = [];
  document.querySelectorAll("#request-table tbody tr").forEach((tr) => {
    const sel = tr.querySelector(".product-select");
    const pid = Number(sel.value || 0);
    if (!pid) return;
    const note = (tr.querySelector(".note-input")?.value || "").trim();
    const label = sel.options[sel.selectedIndex].text;
    const q = Number(tr.querySelector(".qty-input").value || 0);
    const c = Number(tr.querySelector(".cost-input").value || 0);
    const avail = Number(sel.options[sel.selectedIndex]?.dataset?.avail || 0);
    if (q > 0) {
      rows.push({
        product_id: pid,
        product_label: label,
        available_qty: avail,
        return_qty: q,
        unit_cost: c,
        line_note: note || null,
      });
    }
  });
  return rows;
}

// ---------- list / table ----------
async function displayPR() {
  const r = await axios.get(`${baseApiUrl}/purchase_return.php`, { params: { operation: "getAllPR", _: Date.now() } });
  renderPRTable(Array.isArray(r.data) ? r.data : []);
}

function renderPRTable(list) {
  const div = document.getElementById("pr-table-div");
  if (!div) return;
  div.innerHTML = "";

  const table = document.createElement("table");
  table.className = "table table-hover table-striped table-sm";
  table.innerHTML = `
    <thead>
      <tr>
        <th>PR Ref</th>
        <th>Supplier</th>
        <th>Warehouse</th>
        <th>Status</th>
        <th>Date</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tb = table.querySelector("tbody");

  if (!list.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="text-center text-muted">No Purchase Returns found.</td>`;
    tb.appendChild(tr);
  } else {
list.forEach((r) => {
  const id = r.pr_id ?? r.purchase_return_id;
  const status = String(r.status || "").toLowerCase();

  let actions = `<button type="button" class="btn btn-primary btn-sm btn-view">View</button>`;
  if (status === "pending") {
    actions = `
      <button type="button" class="btn btn-warning btn-sm btn-edit">Edit</button>
      <button type="button" class="btn btn-outline-success btn-sm ms-1 btn-confirm">Confirm</button>
      <button type="button" class="btn btn-primary btn-sm ms-1 btn-view">View</button>
    `;
  } else if (status === "confirmed") {
    actions = `
      <button type="button" class="btn btn-success btn-sm btn-mark-returned">Returned</button>
      <button type="button" class="btn btn-primary btn-sm ms-1 btn-view">View</button>
    `;
  }

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${r.reference_no || "(pending)"}</td>
    <td>${r.supplier_name || ""}</td>
    <td>${r.location_name || ""}</td>
    <td>${statusBadge(status)}</td>
    <td>${r.return_date || r.created_at || ""}</td>
    <td>${actions}</td>
  `;
  tb.appendChild(tr);

  tr.querySelector(".btn-view")?.addEventListener("click", () => openPRViewModal(id));
  tr.querySelector(".btn-edit")?.addEventListener("click", () => openPREditModal(id));

  tr.querySelector(".btn-confirm")?.addEventListener("click", async () => {
    const ok = await Swal.fire({ title: "Confirm this return?", icon: "question", showCancelButton: true });
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    fd.append("operation", "confirmPR");
    fd.append("json", JSON.stringify({ pr_id: id }));
    const res = await axios.post(`${baseApiUrl}/purchase_return.php`, fd);
    if (res?.data?.success) {
      await Swal.fire("Confirmed", "Now ready to mark as returned.", "success");
      window.dispatchEvent(new CustomEvent("pr:confirmed", { detail: { pr_id: id } }));
    } else {
      Swal.fire("Error", res?.data?.error || "Failed to confirm", "error");
    }
  });

  tr.querySelector(".btn-mark-returned")?.addEventListener("click", async () => {
    const ok = await Swal.fire({ title: "Mark as returned and deduct stock?", icon: "warning", showCancelButton: true });
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    fd.append("operation", "markReturned");
    fd.append("json", JSON.stringify({ pr_id: id }));
    const res = await axios.post(`${baseApiUrl}/purchase_return.php`, fd);
    if (res?.data?.success) {
      await Swal.fire("Done", "Items deducted and status set to Returned.", "success");
      window.dispatchEvent(new CustomEvent("pr:confirmed", { detail: { pr_id: id } }));
    } else {
      Swal.fire("Error", res?.data?.error || "Failed to mark returned", "error");
    }
  });
});

  }

  div.appendChild(table);
}

// expose builder hooks for modal
window.__PR_PAGE__ = {
  suppliersRef: () => suppliers,
  gatherBuilderRows,
  clearBuilder,
  displayPR,
  loadProductsForReturn,
  currentProductsRef: () => currentProducts,
};