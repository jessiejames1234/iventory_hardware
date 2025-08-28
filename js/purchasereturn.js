import { purchaseReturnModal } from "./modules/stocking_adjust_model.js";

import { checkAuth, logout } from "./auth.js";

const user = checkAuth(); // 🔐 Redirects if not logged in
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {

  // 👤 Display logged-in user
  document.getElementById("logged-user").textContent = user.name;

  // 🚪 Logout
  document.getElementById("btn-logout").addEventListener("click", logout);

    displayPurchaseReturns();

    document.getElementById("btn-add-return")?.addEventListener("click", () => {
        purchaseReturnModal(displayPurchaseReturns, user.staff_id, baseApiUrl);
    });
});

export const displayPurchaseReturns = async () => {
    const tableDiv = document.getElementById("purchasereturn-table-div");
    if (!tableDiv) return;

    // 🔄 Show loading spinner
    tableDiv.innerHTML = `
        <div class="d-flex justify-content-center align-items-center p-5">
            <div class="spinner-border text-primary me-2" role="status"></div>
            <span class="fw-semibold">Loading purchase return records...</span>
        </div>
    `;

    try {
        const response = await axios.get(`${baseApiUrl}/purchasereturn.php`, {
            params: { operation: "getAllReturns" }
        });

        setTimeout(() => {
            const records = Array.isArray(response.data) ? response.data : [];

            if (!records.length) {
                tableDiv.innerHTML = `
                    <div class="alert alert-warning m-0">
                        No return records found.
                    </div>
                `;
                return;
            }

            const table = document.createElement("table");
            table.classList.add("table", "table-hover", "table-striped", "table-sm");
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Supplier</th>
                        <th>Quantity</th>
                        <th>Returned By</th>
                        <th>Reason</th>
                        <th>Return Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(r => `
                        <tr>
                            <td>${r.product_name}</td>
                            <td>${r.supplier_name}</td>
                            <td>${r.quantity}</td>
                            <td>${r.returned_by_name}</td>
                            <td>${r.reason || "-"}</td>
                            <td>${r.return_date}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            tableDiv.innerHTML = "";
            tableDiv.appendChild(table);
        }, 1000); // Smooth delay

    } catch (err) {
        console.error(err);
        tableDiv.innerHTML = `
            <div class="alert alert-danger m-0">
                Failed to fetch purchase return records!
            </div>
        `;
    }
};
