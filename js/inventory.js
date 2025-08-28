import { checkAuth, logout } from "./auth.js";

const user = checkAuth(); // 🔐 Redirects if not logged in
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  // 👤 Display logged-in user
  document.getElementById("logged-user").textContent = user.name;

  // 🚪 Logout
  document.getElementById("btn-logout").addEventListener("click", logout);

    displayInventory();
});

export const displayInventory = async () => {
    const tableDiv = document.getElementById("inventory-table-div");
    if (!tableDiv) return;

    // Show loading spinner
    tableDiv.innerHTML = `
      <div class="d-flex justify-content-center align-items-center p-5 gap-2">
        <div class="spinner-border text-primary" role="status"></div>
        <span class="fw-semibold">Loading inventory...</span>
      </div>
    `;

    try {
        const response = await axios.get(`${baseApiUrl}/inventory.php`, {
            params: { operation: "getAllProducts" }
        });

        // Add smooth delay
        setTimeout(() => {
            if (Array.isArray(response.data) && response.data.length) {
                const table = document.createElement("table");
                table.classList.add("table", "table-hover", "table-striped", "table-sm");
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Model</th>
                            <th>Category</th>
                            <th>Brand</th>
                            <th>Unit</th>
                            <th>Current Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.data.map(p => `
                            <tr>
                                <td>${p.product_name}</td>
                                <td>${p.model || "-"}</td>
                                <td>${p.category || "-"}</td>
                                <td>${p.brand || "-"}</td>
                                <td>${p.unit || "-"}</td>
                                <td>${p.quantity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;
                tableDiv.innerHTML = "";
                tableDiv.appendChild(table);
            } else {
                tableDiv.innerHTML = `<div class="alert alert-warning m-0">No inventory data found.</div>`;
            }
        }, 1000);

    } catch (err) {
        console.error(err);
        tableDiv.innerHTML = `<div class="alert alert-danger m-0">Failed to fetch inventory!</div>`;
    }
};
