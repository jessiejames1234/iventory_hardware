// modules/payment.js
export function initPaymentModule(cart, userId = 1, refreshDisplay) {
  const orderNowBtn  = document.getElementById('order-now-button');
  const modalTitle   = document.getElementById('blank-modal-title');

  if (!orderNowBtn || !modalTitle) {
    console.error('Payment module initialization failed: missing required elements.');
    return;
  }

  const fmt = (n) => `₱${Number(n).toFixed(2)}`;
  const todayDateStr = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD
async function fetchLiveStock(productIds) {
  const apiBase = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
  const form = new FormData();
  form.append('operation', 'getStockForProducts');
  form.append('json', JSON.stringify({ product_ids: productIds }));
  const res = await fetch(`${apiBase}/Sales_transaction.php`, { method: 'POST', body: form });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch {
    const match = raw.match(/\{[\s\S]*\}$/);
    if (match) { try { data = JSON.parse(match[0]); } catch {} }
  }
  if (!data || typeof data !== 'object') throw new Error('Bad stock response');
  return data; // { [product_id]: qty }
}

  orderNowBtn.addEventListener('click', () => {
    const modalBody   = document.getElementById('blank-main-div');
    const modalFooter = document.getElementById('blank-modal-footer');
    if (!modalBody || !modalFooter) {
      console.error('Modal body or footer elements are missing.');
      return;
    }

    
    if (Object.keys(cart).length === 0) {
      Swal.fire('Cart is empty', 'Please add products to cart before ordering.', 'info');
      return;
    }

    modalTitle.textContent = "Checkout & Payment";
    modalBody.innerHTML = '';
    modalFooter.innerHTML = '';

    // ---------- Calculate total ----------
    const items = Object.values(cart).map(it => ({
      id: it.product_id,
      name: it.product_name || it.name,
      price: parseFloat(it.selling_price ?? it.price ?? 0),
      qty: Number(it.quantity || 0),
      line: (parseFloat(it.selling_price ?? it.price ?? 0)) * Number(it.quantity || 0),
    }));
    const subtotal = items.reduce((s, x) => s + x.line, 0);
    const total    = subtotal; // no discount/VAT

    // ---------- Order summary (clean, POS-style) ----------
    const summary = document.createElement('div');
    summary.className = "border rounded p-3 bg-white";
    summary.innerHTML = `
      <style>
        /* Modal-only polish */
        .pos-summary .table thead th { position: sticky; top: 0; background: #f8f9fa; }
        .pos-summary .table-sm td, .pos-summary .table-sm th { padding-top:.4rem; padding-bottom:.4rem; }
        .pos-summary .table tbody tr:nth-child(odd){ background: #fafbfd; }
        .pos-totals {
          background: #0d6efd10; border: 1px solid #0d6efd33;
          border-radius: .5rem; padding: .6rem .8rem;
        }
        .badge-soft {
          background: #f1f5ff; color: #3451b2; border: 1px solid #dfe7ff; font-weight: 600;
          border-radius: .375rem; padding: .2rem .5rem;
        }
      </style>

      <div class="pos-summary d-flex align-items-center justify-content-between mb-2">
        <div class="d-flex align-items-center gap-2">
          <span class="badge-soft">Date: ${todayDateStr()}</span>
          <span class="badge-soft">Items: ${items.length}</span>
        </div>
        <div class="text-muted small">Point of Sale</div>
      </div>

      <div class="table-responsive" style="max-height:260px; overflow:auto;">
        <table class="table table-sm align-middle mb-2">
          <thead class="table-light">
            <tr>
              <th style="min-width: 220px;">Item</th>
              <th class="text-end" style="width: 90px;">Price</th>
              <th class="text-center" style="width: 70px;">Qty</th>
              <th class="text-end" style="width: 110px;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(x => `
              <tr>
                <td class="fw-500">${x.name}</td>
                <td class="text-end">${fmt(x.price)}</td>
                <td class="text-center">${x.qty}</td>
                <td class="text-end fw-semibold">${fmt(x.line)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="pos-totals d-flex justify-content-between align-items-center">
        <div class="text-muted">Total Due</div>
        <div class="fs-4 fw-bold text-primary">${fmt(total)}</div>
      </div>
    `;
    modalBody.appendChild(summary);

    // ---------- Received amount ----------
    const payWrap = document.createElement('div');
    payWrap.className = "mt-3";
    payWrap.innerHTML = `
      <label for="receivedAmount" class="form-label fw-bold mb-1">Amount Received</label>
      <div class="input-group input-group-lg mb-2">
        <span class="input-group-text">₱</span>
        <input type="number" id="receivedAmount" class="form-control" min="0" step="0.01" placeholder="${total.toFixed(2)}">
      </div>
      <div class="d-flex flex-wrap gap-2 align-items-center">
        ${[100,200,500,1000,2000,5000].map(v=>`<button type="button" class="btn btn-outline-secondary btn-sm quick-cash" data-val="${v}">+${fmt(v)}</button>`).join('')}
        <button type="button" class="btn btn-outline-primary btn-sm exact-cash">Exact (${fmt(total)})</button>
        <span class="ms-auto me-0 fw-semibold" id="changePreview">Change: ${fmt(0)}</span>
      </div>
    `;
    modalBody.appendChild(payWrap);

    const receivedInput = payWrap.querySelector('#receivedAmount');
    const changePreview = payWrap.querySelector('#changePreview');
    const setChange = () => {
      const r = parseFloat(receivedInput.value || 0);
      const c = r - total;
      changePreview.textContent = `Change: ${fmt(c > 0 ? c : 0)}`;
    };
    receivedInput.addEventListener('input', setChange);
    payWrap.querySelectorAll('.quick-cash').forEach(btn => {
      btn.addEventListener('click', () => {
        const add = Number(btn.dataset.val);
        receivedInput.value = (parseFloat(receivedInput.value || 0) + add).toFixed(2);
        setChange();
      });
    });
    payWrap.querySelector('.exact-cash').addEventListener('click', () => {
      receivedInput.value = total.toFixed(2);
      setChange();
    });

    // ---------- Footer buttons ----------
    const btnClose = document.createElement('button');
    btnClose.type  = 'button';
    btnClose.className = 'btn btn-secondary btn-sm';
    btnClose.textContent = 'Close';
    btnClose.setAttribute('data-bs-dismiss', 'modal');

    const btnPay = document.createElement('button');
    btnPay.type  = 'button';
    btnPay.className = 'btn btn-primary btn-sm';
    btnPay.innerHTML = `<span class="me-1">Pay & Print</span><i class="bi bi-printer"></i>`;

    modalFooter.append(btnClose, btnPay);

    // ---------- Submit & print ----------
    btnPay.addEventListener('click', async () => {
      const receivedAmount = parseFloat(receivedInput.value);
      const dateOnly = todayDateStr(); // YYYY-MM-DD only

      if (isNaN(receivedAmount) || receivedAmount < total) {
        Swal.fire('Invalid Amount', `Received must be at least ${fmt(total)}`, 'error');
        return;
      }

      const selectedTerminalId = Number(sessionStorage.getItem('terminal_id') || 0);
      if (!selectedTerminalId) {
        Swal.fire('No Terminal Selected', 'Please select a terminal to proceed.', 'error');
        return;
      }

      const changeAmount = receivedAmount - total;

      // 🔔 Open print window first (user gesture) to avoid popup blockers
      const __printWindow = window.open('', '_blank', 'width=480,height=640');
      if (__printWindow) {
        __printWindow.document.write(`
          <html><head><title>Preparing Receipt…</title>
            <style>body{font:14px/1.4 system-ui;margin:24px;color:#333}</style>
          </head><body>
            <h3>Preparing Receipt…</h3>
            <p>Please wait a moment.</p>
          </body></html>
        `);
        __printWindow.document.close();
        window._posPrintWin = __printWindow; // expose so printHTML can reuse it
      }

      // Prepare payload (no payment_type)
      const saleData = {
        staff_id: userId,
        terminal_id: selectedTerminalId,
        total: total,
        received: receivedAmount,
        change: changeAmount,
        date: dateOnly,
        items: items.map(it => ({
          product_id: it.id,
          quantity: it.qty,
          price: it.price
        }))
      };

      try {
        const apiBase = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
        const saleForm = new FormData();
        saleForm.append('operation', 'insertSalesTransaction');
        saleForm.append('json', JSON.stringify(saleData));

        const resp = await fetch(`${apiBase}/Sales_transaction.php`, { method: 'POST', body: saleForm });

        // Be tolerant of noisy responses
        const raw = await resp.text();
        let result;
        try { result = JSON.parse(raw); }
        catch {
          const match = raw.match(/\{[\s\S]*\}$/);
          if (match) { try { result = JSON.parse(match[0]); } catch {} }
        }
        if (!result) {
          console.error("Failed to parse JSON response:", raw);
          Swal.fire('Error', 'Invalid response from server. See console for details.', 'error');
          try { window._posPrintWin?.close(); } catch {}
          return;
        }

        // Accept either {status:1, transaction_id:N} or legacy 1 (but require id for printing)
        const ok = (typeof result === 'number' && result === 1) || (result?.status === 1);
        const transactionId = result?.transaction_id ?? null;

        if (!ok || !transactionId) {
          Swal.fire('Payment Failed', result?.error || 'Could not record the sale.', 'error');
          try { window._posPrintWin?.close(); } catch {}
          return;
        }

        // Build receipt HTML and print (Date only, no time; no discount/VAT)
        const cashier   = (JSON.parse(sessionStorage.getItem("user") || "{}")?.name) || `Staff #${userId}`;
        const terminalN = sessionStorage.getItem("terminal_name") || `Terminal #${selectedTerminalId}`;
        const store     = "main_store";

        const receiptHTML = buildReceiptHTML({
          store,
          terminal: terminalN,
          cashier,
          transactionId,
          dateOnly, // << only date
          items,
          subtotal,
          total,
          received: receivedAmount,
          change: changeAmount
        });

        printHTML(receiptHTML); // will reuse the pre-opened window and auto-print

        Swal.fire('Payment Successful', 'Sale has been recorded.', 'success');

        // Clear cart & refresh UI
        Object.keys(cart).forEach(k => delete cart[k]);
        if (typeof refreshDisplay === "function") {
          refreshDisplay();
        } else {
          document.getElementById('sum')?.replaceChildren();
          document.getElementById('order')?.replaceChildren();
        }

        // Close modal
        const paymentModalEl = document.getElementById('payment');
        const modalInstance = bootstrap.Modal.getInstance(paymentModalEl);
        modalInstance?.hide();

      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'An error occurred while processing payment.', 'error');
        try { window._posPrintWin?.close(); } catch {}
      }
    });

    // Show modal
    const paymentModal = new bootstrap.Modal(document.getElementById('payment'));
    paymentModal.show();
  });
}

/* ---------- helpers ---------- */
function buildReceiptHTML(data) {
  const fmt = (n) => `₱${Number(n).toFixed(2)}`;
  const lines = data.items.map((x,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${x.name}</td>
      <td class="text-end">${fmt(x.price)}</td>
      <td class="text-center">${x.qty}</td>
      <td class="text-end fw-semibold">${fmt(x.line)}</td>
    </tr>`).join('');

  const txn = `#${data.transactionId}`;

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${txn}</title>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 8mm; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
    }
    body { color:#222; }
    .receipt { width: 300px; max-width: 100%; margin: 0 auto; }
    .brand { text-align:center; margin-bottom:8px; }
    .brand h2 { margin:0; font-size:18px; letter-spacing:.5px; }
    .muted { color:#666; font-size:12px; }
    .row { display:flex; justify-content:space-between; margin:2px 0; font-size:12px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th, td { padding:4px 0; border-bottom:1px dashed #ddd; }
    th { text-align:left; }
    tfoot td { border-bottom: none; }
    .total { font-weight:700; font-size:14px; }
    .thanks { margin-top:8px; text-align:center; font-size:12px; }
    .hdr { text-align:center; margin-bottom:6px; }
  </style>
</head>
<body onload="window.focus(); window.print(); setTimeout(()=>window.close(), 300);">
  <div class="receipt" role="document" aria-label="Sales Receipt">
    <div class="brand">
      <h2>${data.store}</h2>
      <div class="muted">Official Sales Receipt</div>
    </div>

    <div class="hdr muted">${data.dateOnly}</div>

    <div class="row"><span>Transaction</span><span>${txn}</span></div>
    <div class="row"><span>Terminal</span><span>${data.terminal}</span></div>
    <div class="row"><span>Cashier</span><span>${data.cashier}</span></div>

    <hr style="border:none;border-top:1px dashed #ccc; margin:6px 0;">

    <table aria-label="Items">
      <thead>
        <tr>
          <th>#</th><th>Item</th>
          <th class="text-end">Price</th>
          <th class="text-center">Qty</th>
          <th class="text-end">Total</th>
        </tr>
      </thead>
      <tbody>${lines}</tbody>
      <tfoot>
        <tr><td colspan="4" class="text-end total">TOTAL</td><td class="text-end total">${fmt(data.total)}</td></tr>
        <tr><td colspan="4" class="text-end">Received</td><td class="text-end">${fmt(data.received)}</td></tr>
        <tr><td colspan="4" class="text-end">Change</td><td class="text-end">${fmt(data.change)}</td></tr>
      </tfoot>
    </table>

    <div class="thanks">Thank you for your purchase!</div>
  </div>
</body>
</html>`;
}

function printHTML(html) {
  // Reuse the pre-opened window (user gesture) to avoid popup blockers
  const w = (window._posPrintWin && !window._posPrintWin.closed)
    ? window._posPrintWin
    : window.open('', '_blank', 'width=480,height=640');

  if (!w) return; // popup blocked and no pre-opened window

  w.document.open('text/html');
  w.document.write(html);
  w.document.close();
}
