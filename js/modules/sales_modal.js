const user = JSON.parse(sessionStorage.getItem("user") || "{}");

// modules/sales_modal.js
export const viewSaleModal = async (transactionId) => {
  document.getElementById("blank-modal-title").innerText = "View Sale Details";

  const response = await axios.get(`${sessionStorage.baseAPIUrl}/sales.php`, {
    params: { operation: "getSale", json: JSON.stringify({ salesId: transactionId }) },
  });

  const { sale, items } = response.data || { sale: null, items: [] };
  if (!sale) {
    document.getElementById("blank-main-div").innerHTML =
      "<div class='text-danger'>Transaction not found.</div>";
  } else {
    const hdr = `
      <table class="table table-sm">
        <tr><td>Transaction ID</td><td>${String(sale.transaction_id).padStart(4, "0")}</td></tr>
        <tr><td>Date/Time</td><td>${sale.datetime}</td></tr>
        <tr><td>Cashier</td><td>${sale.staff_name ?? "Unknown"}</td></tr>
        <tr><td>Terminal</td><td>${sale.terminal ?? ""}</td></tr>
        <tr><td>Total</td><td>${Number(sale.total_amount).toFixed(2)}</td></tr>
      </table>
    `;

    const body = `
      <h6 class="mt-3">Items</h6>
      <table class="table table-bordered table-sm">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Line Total</th></tr></thead>
        <tbody>
          ${items
            .map((i) => {
              const lineTotal = Number(i.quantity) * Number(i.price);
              return `<tr>
                <td>${i.product_name ?? ("#" + i.product_id)}</td>
                <td>${i.quantity}</td>
                <td>${Number(i.price).toFixed(2)}</td>
                <td>${lineTotal.toFixed(2)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `;

    document.getElementById("blank-main-div").innerHTML = hdr + body;
  }

  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  }).show();
};


// Return flow:
// 1) fetch sale + items
// 2) render a form showing all items with qty to return and a global reason
// 3) submit to API -> creates a sales return + items
export const returnSaleModal = async (transactionId, refresh) => {
  // Fetch sale & items first (reuse getSale)
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/sales.php`, {
    params: { operation: "getSale", json: JSON.stringify({ salesId: transactionId }) },
  });
  const { sale, items } = response.data || { sale: null, items: [] };

  document.getElementById("blank-modal-title").innerText = "Sales Return";
  if (!sale) {
    document.getElementById("blank-main-div").innerHTML =
      "<div class='text-danger'>Transaction not found.</div>";
    document.getElementById("blank-modal-footer").innerHTML = `
      <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
    `;
    new bootstrap.Modal(document.getElementById("blank-modal"), { keyboard: true, backdrop: "static" }).show();
    return;
  }

  // Build the return form
  const headerHtml = `
    <div class="mb-2 small text-muted">
      <div><strong>Transaction:</strong> ${String(sale.transaction_id).padStart(4, "0")}</div>
      <div><strong>Date:</strong> ${sale.datetime}</div>
      <div><strong>Cashier:</strong> ${sale.staff_name ?? "Unknown"}</div>
      <div><strong>Terminal:</strong> ${sale.terminal ?? ""}</div>
      <div><strong>Total:</strong> ${Number(sale.total_amount).toFixed(2)}</div>
    </div>
  `;

const returnable = items.filter(i => (Number(i.remaining_qty) || 0) > 0);

if (returnable.length === 0) {
  document.getElementById("blank-main-div").innerHTML =
    headerHtml + `<div class="alert alert-success">All items in this transaction have already been fully returned.</div>`;
  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;
  new bootstrap.Modal(document.getElementById("blank-modal"), { keyboard:true, backdrop:"static" }).show();
  return;
}

const rows = returnable.map(i => `
  <tr>
    <td>${i.product_name ?? ("#" + i.product_id)}</td>
    <td class="text-end">${i.quantity}</td>
    <td class="text-end">${Number(i.price).toFixed(2)}</td>
    <td class="text-end">${i.returned_qty ?? 0}</td>
    <td class="text-end fw-bold">${i.remaining_qty}</td>
    <td style="max-width:160px">
      <div class="input-group input-group-sm">
        <input type="number" min="0" max="${i.remaining_qty}" step="1"
               class="form-control form-control-sm return-qty"
               data-product="${i.product_id}"
               data-price="${i.price}"
               aria-label="Return quantity"
               value="0">
        <span class="input-group-text invalid-icon d-none" title="Exceeds remaining quantity">
          <i class="bi bi-exclamation-triangle-fill text-danger"></i>
        </span>
      </div>
    </td>
  </tr>
`).join("");


  const formHtml = `
    ${headerHtml}
    <div class="alert alert-info py-2 mb-2">
      Select the quantity to return for each item (0 to skip). Max is the quantity sold.
    </div>
<table class="table table-bordered table-sm">
  <thead>
    <tr>
      <th>Product</th>
      <th class="text-end">Sold Qty</th>
      <th class="text-end">Unit Price</th>
      <th class="text-end">Returned</th>
      <th class="text-end">Remaining</th>
      <th style="width:160px">Return Qty</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>


    <div class="mb-2">
      <label class="form-label small">Reason</label>
      <textarea id="return-reason" class="form-control form-control-sm" rows="2" placeholder="Enter return reason..."></textarea>
    </div>

    <div class="text-end fw-bold">
      Refund Total: <span id="refund-total">0.00</span>
    </div>
  `;

  document.getElementById("blank-main-div").innerHTML = formHtml;

  // Footer buttons
  document.getElementById("blank-modal-footer").innerHTML = `
    <div class="d-grid gap-2">
      <button id="btn-submit-return" class="btn btn-danger btn-sm">Submit Return</button>
      <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
    </div>
  `;

  const modal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });
  modal.show();

const qtyInputs     = Array.from(document.querySelectorAll(".return-qty"));
const refundTotalEl = document.getElementById("refund-total");
const submitBtn     = document.getElementById("btn-submit-return");

function validateQty(inp) {
  const val = Number.parseInt(inp.value || "0", 10);
  const min = Number(inp.getAttribute("min") || "0");
  const max = Number(inp.getAttribute("max") || "0");

  const wrapper  = inp.closest(".input-group");
  const icon     = wrapper?.querySelector(".invalid-icon");

  const isInvalid = Number.isNaN(val) || val < min || val > max;

  // Toggle Bootstrap invalid state + warning icon
  inp.classList.toggle("is-invalid", isInvalid);
  if (icon) icon.classList.toggle("d-none", !isInvalid);

  return !isInvalid;
}

function recomputeAndValidate() {
  let total = 0;
  let anyInvalid = false;
  let anyPositive = false;

  qtyInputs.forEach(inp => {
    const ok = validateQty(inp);
    if (!ok) anyInvalid = true;

    const qty   = Number.parseInt(inp.value || "0", 10) || 0;
    const price = Number.parseFloat(inp.dataset.price || "0") || 0;

    if (qty > 0) {
      anyPositive = true;
      total += qty * price;
    }
  });

  refundTotalEl.textContent = total.toFixed(2);

  // Disable Submit if invalid or nothing selected
  submitBtn.disabled = anyInvalid || !anyPositive;
}

qtyInputs.forEach(inp => inp.addEventListener("input", recomputeAndValidate));
recomputeAndValidate();


  const recompute = () => {
    let sum = 0;
    qtyInputs.forEach((inp) => {
      const qty = parseInt(inp.value || "0", 10);
      const price = parseFloat(inp.dataset.price || "0");
      if (qty > 0) sum += qty * price;
    });
    refundTotalEl.textContent = sum.toFixed(2);
  };
  qtyInputs.forEach((inp) => inp.addEventListener("input", recompute));
  recompute();

  // Submit
document.getElementById("btn-submit-return").addEventListener("click", async () => {
  // Re-validate before submit
  recomputeAndValidate();
  if (submitBtn.disabled) {
    Swal.fire("Fix quantities", "Please correct invalid quantities and select at least one item to return.", "warning");
    return;
  }

  const reason = (document.getElementById("return-reason").value || "").trim();
  const lines = qtyInputs
    .map((inp) => ({
      product_id: Number.parseInt(inp.dataset.product, 10),
      qty: Number.parseInt(inp.value || "0", 10) || 0,
      price: Number.parseFloat(inp.dataset.price || "0") || 0,
    }))
    .filter((l) => l.qty > 0);

    if (lines.length === 0) {
      Swal.fire("Nothing selected", "Please set return quantity for at least one item.", "info");
      return;
    }

    // Basic max validation (don’t exceed sold qty)
    for (let k = 0; k < qtyInputs.length; k++) {
      const inp = qtyInputs[k];
      const max = parseInt(inp.getAttribute("max"), 10);
      const val = parseInt(inp.value || "0", 10);
      if (val > max) {
        Swal.fire("Invalid quantity", "A return quantity exceeds the sold quantity.", "error");
        return;
      }
    }

    try {
// modules/sales_modal.js  inside #btn-submit-return click handler
const form = new FormData();
form.append("operation", "submitReturn");
form.append(
  "json",
  JSON.stringify({
    transaction_id: transactionId,
    reason,
    items: lines,          // [{product_id, qty, price}]
    staff_id: user?.staff_id || user?.id || null  // ← helps FK on sales_return.staff_id
  })
);



      const res = await axios.post(`${sessionStorage.baseAPIUrl}/sales.php`, form);
      if (res.data && res.data.status === "ok") {
        Swal.fire("Return created", `Return #${String(res.data.return_id).padStart(4, "0")} saved.`, "success");
        modal.hide();
        if (typeof refresh === "function") refresh();
      } else {
        Swal.fire("Error", res.data?.message || "Failed to create return.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to create return.", "error");
    }
  });
};
