// Builds the "Review Quantities" modal where user can tweak change qty,
// then returns the final array of items OR null if cancelled.
export async function openReviewModal({ locationId, lines }) {
  const modal = new bootstrap.Modal(document.getElementById("blank-modal"), { keyboard:true, backdrop:"static" });

  document.getElementById("blank-modal-title").innerText = "Review Quantities";

  const body = `
    <div class="mb-2 small text-muted">Location ID: <b>${locationId}</b></div>
    <div class="table-responsive" style="max-height:55vh;overflow:auto;">
      <table class="table table-sm align-middle" id="adj-review-table">
        <thead>
          <tr><th>Product</th><th class="text-end">Old</th><th style="width:160px;">Change</th><th class="text-end">New</th><th>Reason</th></tr>
        </thead>
        <tbody>
          ${lines.map((l,idx)=>`
            <tr data-idx="${idx}">
              <td>${l.name}</td>
              <td class="text-end td-old">${l.oldQty}</td>
              <td><input type="number" class="form-control form-control-sm inp-chg" value="${l.changeQty}"></td>
              <td class="text-end td-new">${l.newQty}</td>
              <td><input type="text" class="form-control form-control-sm inp-reason" value="${(l.reason||"").replace(/"/g,'&quot;')}"></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById("blank-main-div").innerHTML = body;

  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-primary btn-sm w-100" id="btn-confirm-modal">Confirm & Save</button>
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  // wire recalculation
  document.querySelectorAll("#adj-review-table tbody tr").forEach(tr => {
    const oldEl = tr.querySelector(".td-old");
    const newEl = tr.querySelector(".td-new");
    const chgEl = tr.querySelector(".inp-chg");
    const idx = Number(tr.getAttribute("data-idx"));
    function recalc(){
      const old = Number(oldEl.textContent || 0);
      const chg = Number(chgEl.value || 0);
      newEl.textContent = String(old + chg);
      lines[idx].changeQty = chg;
      lines[idx].newQty = old + chg;
    }
    chgEl.addEventListener("input", recalc);
  });

  return new Promise(resolve => {
    document.getElementById("btn-confirm-modal")?.addEventListener("click", () => {
      // collect
      const out = [];
      document.querySelectorAll("#adj-review-table tbody tr").forEach(tr => {
        const idx = Number(tr.getAttribute("data-idx"));
        const row = lines[idx];
        const reason = tr.querySelector(".inp-reason")?.value || "";
        const chg = Number(tr.querySelector(".inp-chg")?.value || 0);
        if (!isNaN(chg) && row && row.productId){
          out.push({ productId: row.productId, oldQty: row.oldQty, changeQty: chg, reason });
        }
      });
      if(!out.length){ Swal.fire("No items","All quantities are zero.","info"); return; }
      modal.hide();
      resolve(out);
    });

    // closing without confirm
    document.getElementById("blank-modal").addEventListener("hidden.bs.modal", (ev) => {
      // resolve(null) only if user closed without confirm (we already resolved on confirm)
    }, { once:true });

    modal.show();
  });
}
