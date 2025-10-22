// js/stock_transfer_modal.js
export const addTransferModal = async ({ fromLocationId, toLocationId, userId }, refreshDisplay) => {
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl");
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  document.getElementById("blank-modal-title").innerText = "Create Stock Transfer";

  // pull products with stock at FROM location
  const params = {
    operation: "getAvailableProducts",
    json: JSON.stringify({ fromLocationId }),
  };
  const res = await axios.get(`${baseApiUrl}/stock_transfer.php`, { params });
  const products = Array.isArray(res.data) ? res.data : [];
  // products: [{product_id, product_name, sku, available_qty}]

  // quick lookups
  const byId = new Map(products.map(p => [Number(p.product_id), p]));
  const optionHtml = ['<option value="">-- Select product --</option>']
    .concat(products.map(p => `<option value="${p.product_id}">${(p.sku||'').trim()} ${p.product_name} (Avail: ${p.available_qty})</option>`))
    .join("");

  // modal body (builder table)
  const body = `
    <div class="mb-2 small text-muted">
      From: <b>${fromLocationId}</b> → To: <b>${toLocationId}</b>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-2">
      <button type="button" class="btn btn-outline-primary btn-sm" id="btn-add-row">
        <i class="bi bi-plus-circle"></i> Add row
      </button>
      <small class="text-muted">Tip: you can add multiple rows and quantities before confirming.</small>
    </div>

    <div class="table-responsive" style="max-height:55vh; overflow:auto;">
      <table class="table table-sm align-middle" id="builder-table">
        <thead>
          <tr>
            <th style="width:55%">Product</th>
            <th class="text-end" style="width:15%">Avail</th>
            <th style="width:15%">Qty</th>
            <th style="width:15%"></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  document.getElementById("blank-main-div").innerHTML = body;

  // footer
  const footer = `
    <button type="button" class="btn btn-primary btn-sm w-100" id="btn-confirm-transfer">
      <i class="bi bi-check2-circle"></i> Add Transfer
    </button>
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;
  document.getElementById("blank-modal-footer").innerHTML = footer;

  const tbody = document.querySelector("#builder-table tbody");

  // Keep track of chosen quantities per product to not exceed available across rows
  const chosen = new Map(); // product_id -> total qty across rows

  function currentAvailable(pid) {
    const base = Number(byId.get(pid)?.available_qty || 0);
    const taken = Number(chosen.get(pid) || 0);
    return Math.max(0, base - taken);
  }

  function recalcRowAvail(tr) {
    const pid = Number(tr.querySelector(".sel-product").value || 0);
    const availCell = tr.querySelector(".cell-avail");
    const qtyInput = tr.querySelector(".inp-qty");
    if (!pid) {
      availCell.textContent = "-";
      qtyInput.value = "";
      qtyInput.disabled = true;
      return;
    }
    const avail = currentAvailable(pid);
    availCell.textContent = String(avail);
    qtyInput.disabled = false;
    if (qtyInput.value) {
      qtyInput.value = Math.min(Number(qtyInput.value), avail);
    }
    qtyInput.setAttribute("max", String(avail));
  }

  function updateChosen() {
    chosen.clear();
    tbody.querySelectorAll("tr").forEach(tr => {
      const pid = Number(tr.querySelector(".sel-product").value || 0);
      const q = Number(tr.querySelector(".inp-qty").value || 0);
      if (pid && q > 0) {
        chosen.set(pid, Number(chosen.get(pid) || 0) + q);
      }
    });
    // after updating chosen, refresh each row's avail/max
    tbody.querySelectorAll("tr").forEach(recalcRowAvail);
  }

  function addRow(defaultPid = "", defaultQty = "") {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <select class="form-select form-select-sm sel-product">
          ${optionHtml}
        </select>
      </td>
      <td class="text-end cell-avail">-</td>
      <td>
        <input type="number" class="form-control form-control-sm inp-qty" min="0" placeholder="0" disabled>
      </td>
      <td class="text-end">
        <button type="button" class="btn btn-outline-danger btn-sm btn-remove">
          <i class="bi bi-x-circle"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    const sel = tr.querySelector(".sel-product");
    const qty = tr.querySelector(".inp-qty");

    // set defaults if provided
    if (defaultPid) sel.value = String(defaultPid);
    recalcRowAvail(tr);
    if (defaultQty) { qty.value = defaultQty; }

    sel.addEventListener("change", () => {
      // when product changes, force qty to 0 first, then recalc
      qty.value = "";
      updateChosen();
    });

    qty.addEventListener("input", () => {
      const pid = Number(sel.value || 0);
      if (!pid) return;
      // clamp
      const max = Number(qty.getAttribute("max") || 0);
      qty.value = String(Math.max(0, Math.min(Number(qty.value || 0), max)));
      updateChosen();
    });

    tr.querySelector(".btn-remove").addEventListener("click", () => {
      tr.remove();
      updateChosen();
    });
  }

  // first row
  addRow();

  // handlers
  document.getElementById("btn-add-row").addEventListener("click", () => addRow());

  document.getElementById("btn-confirm-transfer").addEventListener("click", async () => {
    // collect non-empty lines
    const lines = [];
    tbody.querySelectorAll("tr").forEach(tr => {
      const pid = Number(tr.querySelector(".sel-product").value || 0);
      const qty = Number(tr.querySelector(".inp-qty").value || 0);
      if (pid && qty > 0) lines.push({ productId: pid, quantity: qty });
    });

    if (lines.length === 0) {
      Swal.fire("No items", "Add at least one product with quantity.", "warning");
      return;
    }

    // build payload
    const payload = {
      fromLocationId,
      toLocationId,
      requestedBy: userId,
      items: lines
    };

    // POST createTransfer (header + items + inventory move)
    const fd = new FormData();
    fd.append("operation", "createTransfer");
    fd.append("json", JSON.stringify(payload));

    const resp = await axios({
      url: `${baseApiUrl}/stock_transfer.php`,
      method: "POST",
      data: fd
    });

    if (resp.data?.ok === 1) {
      Swal.fire("Success", `Transfer #${resp.data.stockTransferId} created.`, "success");
      myModal.hide();
      refreshDisplay && refreshDisplay();
    } else {
      Swal.fire("Error", resp.data?.error || "Server error", "error");
    }
  });

  myModal.show();
};



// js/stock_transfer_modal.js

export async function viewTransferModal({ stockTransferId }) {
  try {
    const baseApiUrl =
      sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";

    const res = await axios.get(`${baseApiUrl}/stock_transfer.php`, {
      params: {
        operation: "getTransfer",
        json: JSON.stringify({ stockTransferId }),
      },
    });

    const t = res.data || {};
    const h = t.header || {};
    const items = Array.isArray(t.items) ? t.items : [];

    const modalEl = ensureModalShell();
    modalEl.querySelector(".stm-title").textContent =
      `Transfer #${h.stock_transfer_id ?? ""}`;
    modalEl.querySelector(".stm-meta").innerHTML = `
      <div><b>From:</b> ${h.from_location ?? ""}</div>
      <div><b>To:</b> ${h.to_location ?? ""}</div>
      <div><b>Status:</b> <span class="badge ${badge(h.status)}">${h.status ?? ""}</span></div>
    `;

    const tbody = modalEl.querySelector("tbody");
    tbody.innerHTML = items.length
      ? items
          .map(
            (i) => `
          <tr>
            <td>${(i.sku || "").toString().trim()}</td>
            <td>${i.product_name || ""}</td>
            <td class="text-end">${i.quantity ?? 0}</td>
          </tr>`
          )
          .join("")
      : `<tr><td colspan="3" class="text-center text-muted">(no items)</td></tr>`;

    const bs = new bootstrap.Modal(modalEl, { backdrop: "static", keyboard: true });
    bs.show();
  } catch (err) {
    // Fallback so you still see *something* if the modal fails.
    Swal.fire("Error", err?.message || "Failed to load transfer.", "error");
  }
}

function ensureModalShell() {
  let el = document.getElementById("view-transfer-modal");
  if (el) return el;

  el = document.createElement("div");
  el.id = "view-transfer-modal";
  el.className = "modal fade";
  el.tabIndex = -1;
  el.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title stm-title">Transfer</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="stm-meta small text-muted mb-3"></div>
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead class="table-light">
                <tr><th>SKU</th><th>Product</th><th class="text-end">Qty</th></tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
  return el;
}

function badge(s) {
  s = String(s || "").toLowerCase();
  if (s === "completed") return "text-bg-success";
  if (s === "in_transit") return "text-bg-warning";
  return "text-bg-secondary";
}