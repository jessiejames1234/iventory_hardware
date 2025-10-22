// ===== Review Quantities MODAL (self-contained) =====

// Ensures the Bootstrap modal skeleton exists once per page
function ensureReviewModalShell() {
  let modal = document.getElementById("blank-modal");
  if (modal) return modal;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
  <div class="modal fade" id="blank-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header py-2">
          <h5 class="modal-title" id="blank-modal-title">Review Quantities</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" title="Close"></button>
        </div>
        <div class="modal-body" id="blank-main-div"></div>
        <div class="modal-footer gap-2" id="blank-modal-footer"></div>
      </div>
    </div>
  </div>`;
  document.body.appendChild(wrapper.firstElementChild);
  return document.getElementById("blank-modal");
}

// Builds the "Review Quantities" modal where user can tweak change qty,
// then returns the final array of items OR null if cancelled.
export async function openReviewModal({ locationId, lines }) {
  const modalEl = ensureReviewModalShell();
  const modal = new bootstrap.Modal(modalEl, { keyboard: true, backdrop: "static" });

  const titleEl = document.getElementById("blank-modal-title");
  const bodyEl  = document.getElementById("blank-main-div");
  const footEl  = document.getElementById("blank-modal-footer");
  titleEl.textContent = "Review Quantities";

  const sanitizeSignedInt = (s) => {
    let v = String(s ?? "").trim().replace(/[^\d-]/g, "");
    v = v.replace(/(?!^)-/g, "");              // only one leading '-'
    if (v !== "" && v !== "-" && !/^-?\d+$/.test(v)) v = "0";
    return v;
  };

  // Modal body (with sticky thead for long lists)
  bodyEl.innerHTML = `
    <div class="mb-2 small text-muted">Location ID: <b>${locationId}</b></div>
    <div class="table-responsive" style="max-height:55vh;overflow:auto;">
      <table class="table table-sm align-middle" id="adj-review-table">
        <thead style="position:sticky;top:0;z-index:1;" class="table-light">
          <tr>
            <th>Product</th>
            <th class="text-end">Old</th>
            <th style="width:160px;">Change</th>
            <th class="text-end">New</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map((l,idx)=>`
            <tr data-idx="${idx}">
              <td>${l.name}</td>
              <td class="text-end td-old">${l.oldQty}</td>
              <td>
                <input
                  type="text"
                  aria-label="Change quantity"
                  class="form-control form-control-sm inp-chg"
                  value="${sanitizeSignedInt(l.changeQty)}"
                  inputmode="numeric"
                  autocomplete="off">
              </td> 
              <td class="text-end td-new">${l.newQty}</td>
              <td>
                <input
                  type="text"
                  aria-label="Reason (optional)"
                  class="form-control form-control-sm inp-reason"
                  value="${(l.reason||"").replace(/"/g,'&quot;')}">
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  // Modal footer
  footEl.innerHTML = `
    <button type="button" class="btn btn-primary btn-sm" id="btn-confirm-modal">Confirm & Save</button>
    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
  `;

  // Wire recalculation (same rules as builder)
  document.querySelectorAll("#adj-review-table tbody tr").forEach(tr => {
    const oldEl = tr.querySelector(".td-old");
    const newEl = tr.querySelector(".td-new");
    const chgEl = tr.querySelector(".inp-chg");
    const idx   = Number(tr.getAttribute("data-idx"));

    // prevent Enter from submitting/closing unexpectedly
    chgEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });

    function recalc() {
      const old = Number(oldEl.textContent || 0);

      // live sanitize
      let v = sanitizeSignedInt(chgEl.value);
      chgEl.value = v;

      // allow bare '-' while typing
      let chg = (v === "-") ? 0 : Number(v || 0);

      // LOWER BOUND: new >= 0
      const unclampedNew = old + chg;
      const warnBelowZero = (unclampedNew < 0);
      if (warnBelowZero) {
        chg = -old;
        chgEl.value = String(chg);
      }

      // OPTIONAL UPPER CAP (new <= data-max-new)
      const maxNew = Number(chgEl.dataset.maxNew || "");
      let hitUpper = false;
      if (!Number.isNaN(maxNew) && maxNew > 0) {
        const maxIncrease = maxNew - old;
        if (chg > maxIncrease) {
          chg = maxIncrease;
          chgEl.value = String(chg);
          hitUpper = true;
        }
      }

      const newQty = old + chg;

      // UI feedback
      newEl.textContent = String(newQty);
      newEl.classList.toggle("text-danger", warnBelowZero);
      chgEl.classList.toggle("is-invalid", warnBelowZero || hitUpper);
      chgEl.title = warnBelowZero
        ? "New quantity can't go below 0. Value was clamped."
        : (hitUpper ? "Reached maximum allowed new quantity." : "");

      // keep the line model updated
      lines[idx].changeQty = chg;
      lines[idx].newQty    = newQty;
    }

    chgEl.addEventListener("input", recalc);
    chgEl.addEventListener("blur", () => {
      if (chgEl.value.trim() === "-") chgEl.value = "0";
      recalc();
    });

    recalc(); // initial
  });

  // Return a promise with final lines or null if cancelled
  return new Promise((resolve) => {
    // Confirm & Save
    document.getElementById("btn-confirm-modal")?.addEventListener("click", () => {
      const out = [];
      document.querySelectorAll("#adj-review-table tbody tr").forEach(tr => {
        const idx = Number(tr.getAttribute("data-idx"));
        const row = lines[idx];
        const reason = tr.querySelector(".inp-reason")?.value || "";
        const raw = (tr.querySelector(".inp-chg")?.value || "").trim();
        const cleaned = sanitizeSignedInt(raw);
        let chg = (cleaned === "-" ? 0 : Number(cleaned || 0));

        const old = row.oldQty ?? 0;

        // enforce same bounds
        if (old + chg < 0) chg = -old;
        const maxNew = Number(tr.querySelector(".inp-chg")?.dataset.maxNew || "");
        if (!Number.isNaN(maxNew) && maxNew > 0) {
          const maxIncrease = maxNew - old;
          if (chg > maxIncrease) chg = maxIncrease;
        }

        out.push({ productId: row.productId, oldQty: old, changeQty: chg, reason });
      });

      if (!out.length) { Swal.fire("No items","All quantities are zero.","info"); return; }
      modal.hide();
      resolve(out);
    });

    // Cancel -> resolve null
    modalEl.addEventListener("hidden.bs.modal", () => resolve(null), { once: true });

    modal.show();
  });
}

// ===== Details MODAL (self-contained) =====

// Ensures a dedicated modal exists for Adjustment Details
function ensureDetailsModalShell() {
  let modal = document.getElementById("adj-details-modal");
  if (modal) return modal;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
  <div class="modal fade" id="adj-details-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header py-2">
          <h5 class="modal-title" id="adj-details-title">Adjustment Details</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" title="Close"></button>
        </div>
        <div class="modal-body">
          <div id="adj-details-meta" class="small text-muted mb-3">Loading…</div>
          <div class="table-responsive">
            <table class="table table-sm table-bordered" id="adj-details-table">
              <thead class="table-light" style="position:sticky;top:0;z-index:1;">
                <tr>
                  <th style="width:40%;">Product</th>
                  <th class="text-end" style="width:12%;">Old</th>
                  <th class="text-end" style="width:12%;">Change</th>
                  <th class="text-end" style="width:12%;">New</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody id="adj-details-body">
                <tr><td colspan="5" class="text-center small text-muted py-3">Loading…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer gap-2" id="adj-details-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <!-- Approve button gets injected conditionally -->
        </div>
      </div>
    </div>
  </div>`;
  document.body.appendChild(wrapper.firstElementChild);
  return document.getElementById("adj-details-modal");
}

/**
 * Open a modal showing the full details of an adjustment.
 * - Shows Approve button only if canApprove === true
 * - Calls the API to load header+items
 * - When Approve succeeds, modal closes and resolves { approved:true }
 *
 * @param {Object} opts
 * @param {number} opts.adjustmentId
 * @param {boolean} opts.canApprove
 * @param {string} opts.baseApiUrl
 * @param {number} opts.approverStaffId - current user's staff_id
 * @returns {Promise<{approved:boolean}>}
 */
export async function openAdjustmentDetailsModal({ adjustmentId, canApprove, baseApiUrl, approverStaffId }) {
  const modalEl = ensureDetailsModalShell();
  const modal = new bootstrap.Modal(modalEl, { keyboard:true, backdrop:"static" });

  const titleEl = document.getElementById("adj-details-title");
  const metaEl  = document.getElementById("adj-details-meta");
  const bodyEl  = document.getElementById("adj-details-body");
  const footEl  = document.getElementById("adj-details-footer");

  // reset UI
  titleEl.textContent = `Adjustment #${adjustmentId}`;
  metaEl.textContent = "Loading…";
  bodyEl.innerHTML = `<tr><td colspan="5" class="text-center small text-muted py-3">Loading…</td></tr>`;

  // (re)build footer approve button based on canApprove
  let btnApprove = footEl.querySelector(".btn-approve-modal");
  if (btnApprove) btnApprove.remove();
  if (canApprove) {
    btnApprove = document.createElement("button");
    btnApprove.type = "button";
    btnApprove.className = "btn btn-success btn-approve-modal";
    btnApprove.textContent = "Approve";
    footEl.appendChild(btnApprove);
  }

  try {
    const res = await axios.get(`${baseApiUrl}/stock_adjustment.php`, {
      params: { operation:"getAdjustment", json: JSON.stringify({ adjustmentId }) }
    });
    const t = res.data || {};
    const h = t.header || {};
    const items = Array.isArray(t.items) ? t.items : [];

    // header/meta
    titleEl.textContent = `Adjustment #${h.adjustment_id ?? adjustmentId} — ${h.reference_no ?? ""}`;
    metaEl.innerHTML = `
      <div><b>Location:</b> ${h.location_name ?? "-"}</div>
      <div><b>Status:</b> ${h.status ?? "-"}</div>
      <div><b>Created:</b> ${h.created_at ? new Date(h.created_at).toLocaleString() : "-"}</div>
    `;

    // lines
    if (!items.length) {
      bodyEl.innerHTML = `<tr><td colspan="5" class="text-center small text-muted py-3">(no items)</td></tr>`;
    } else {
      bodyEl.innerHTML = items.map(i => `
        <tr>
          <td>${(i.sku||"")} ${i.product_name}</td>
          <td class="text-end">${i.old_quantity}</td>
          <td class="text-end">${i.change_quantity}</td>
          <td class="text-end">${i.new_quantity}</td>
          <td>${i.reason ? i.reason : ""}</td>
        </tr>
      `).join("");
    }

    // wire approve (if present)
    if (btnApprove) {
      btnApprove.disabled = (h.status === "approve");
      btnApprove.onclick = async () => {
        // extra guard
        if (!canApprove) {
          return Swal.fire("Not allowed","Only Admin or Warehouse Manager can approve.","info");
        }
        const ok = await Swal.fire({title:"Approve this adjustment?", icon:"question", showCancelButton:true});
        if(!ok.isConfirmed) return;

        const fd = new FormData();
        fd.append("operation","approve");
        fd.append("json", JSON.stringify({ adjustmentId, approveBy: approverStaffId }));
        const ares = await axios({ url:`${baseApiUrl}/stock_adjustment.php`, method:"POST", data: fd });

        if (ares.data === 1) {
          Swal.fire("OK","Adjustment approved & applied.","success");
          modal.hide();
          // resolve with approved:true after modal closes
        } else {
          Swal.fire("Error", ares.data?.message || "Failed", "error");
        }
      };
    }

    // show modal
    modal.show();

    // promise wrapper
    return new Promise((resolve) => {
      modalEl.addEventListener("hidden.bs.modal", () => {
        // If status changed to approve, caller can refresh list/inventory.
        const approvedNow = (metaEl.textContent.includes("approve")) ? true : false;
        resolve({ approved: approvedNow }); // conservative; caller can always refresh after approve click
      }, { once: true });

      // also update the resolve flag precisely on successful approve
      if (btnApprove) {
        const origOnClick = btnApprove.onclick;
        btnApprove.onclick = async (ev) => {
          const before = metaEl.innerHTML;
          await origOnClick(ev);
          // if the modal got hidden by approve, we can tweak meta to include "approve" so the listener above returns true
          if (document.hidden || !modalEl.classList.contains("show")) {
            metaEl.textContent = "approve"; // marker
          } else {
            metaEl.innerHTML = before; // no change
          }
        };
      }
    });

  } catch (err) {
    console.error(err);
    Swal.fire("Error","Failed to load details.","error");
    return { approved:false };
  }
}
