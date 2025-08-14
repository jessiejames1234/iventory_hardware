import { checkAuth } from "./auth.js";
import { stockOutModal } from "../modules/out_stock.js";

const user = checkAuth(); // Get logged-in staff
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";

document.addEventListener("DOMContentLoaded", () => {
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
    tableDiv.innerHTML = "";

    try {
        const response = await axios.get(`${baseApiUrl}/stock_out.php`, {
            params: { operation: "getAllStockOut" }
        });

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
        tableDiv.appendChild(table);

    } catch (err) {
        console.error(err);
        alert("Failed to fetch stock out records!");
    }
};
