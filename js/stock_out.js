import { stockOutModal } from "./modules/stocking_adjust_model.js";
  import { checkAuth, logout } from "./auth.js";

  const user = checkAuth(); // 🔐 Redirects if not logged in
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
  sessionStorage.setItem("baseAPIUrl", baseApiUrl);

  document.addEventListener("DOMContentLoaded", () => {
    // 👤 Display logged-in user
    document.getElementById("logged-user").textContent = user.name;

    // 🚪 Logout
    document.getElementById("btn-logout").addEventListener("click", logout);

    displayStockOut();

    // Open stock out modal
    const btnAddStockOut = document.getElementById("btn-add-stockout");
    btnAddStockOut?.addEventListener("click", () => {
        stockOutModal(displayStockOut, user.staff_id, baseApiUrl);
    });
});

// Display all stock out records
export const displayStockOut = async () => {
    const tableDiv = document.getElementById("stock-table-div");
    if (!tableDiv) return;

    // Show loading spinner first
    tableDiv.innerHTML = `
        <div class="d-flex justify-content-center align-items-center p-5">
            <div class="spinner-border text-primary me-2" role="status"></div>
            <span class="fw-semibold">Loading stock out records...</span>
        </div>
    `;

    try {
        const response = await axios.get(`${baseApiUrl}/stock_out.php`, {
            params: { operation: "getAllStockOut" }
        });

        // Delay just to make spinner visible
        setTimeout(() => {
            const table = document.createElement("table");
            table.classList.add("table", "table-hover", "table-striped", "table-sm");
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Removed By</th>
                        <th>Reason</th>
                        <th>Date Removed</th>
                    </tr>
                </thead>
                <tbody>
                    ${response.data.map(stock => `
                        <tr>
                            <td>${stock.product_name}</td>
                            <td>-${stock.quantity}</td>
                            <td>${stock.removed_by || "-"}</td>
                            <td>${stock.reason || "-"}</td>
                            <td>${stock.date_removed}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            tableDiv.innerHTML = "";
            tableDiv.appendChild(table);
        }, 1000); // 300ms like your product page

    } catch (err) {
        console.error(err);
        tableDiv.innerHTML = `
            <div class="alert alert-danger m-0">
                Failed to fetch stock out records!
            </div>
        `;
    }
};