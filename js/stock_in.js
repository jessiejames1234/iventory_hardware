import { addNewStockModal } from "../modules/add_new_stock.js";
import { checkAuth, logout } from "./auth.js";

const user = checkAuth(); // 🔐 Get logged-in staff info

document.addEventListener("DOMContentLoaded", () => {
    displayStock();
    document.getElementById("btn-add-stock").addEventListener("click", () => {
        addNewStockModal(displayStock, user.staff_id); // pass staff_id
    });
});

export const displayStock = async () => {
    const response = await axios.get(`${sessionStorage.baseAPIUrl}/stock_in.php`, {
        params: { operation: "getAllStock" }
    });

    if (response.status === 200) {
        displayStockTable(response.data);
    } else {
        alert("Failed to fetch stock records!");
    }
};

const displayStockTable = (stocks) => {
    const div = document.getElementById("stock-table-div");
    div.innerHTML = "";

    const table = document.createElement("table");
    table.classList.add("table", "table-hover", "table-striped", "table-sm");

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Supplier</th>
            <th>Quantity</th>
            <th>Remarks</th>
            <th>Added By</th>
            <th>Date Received</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    stocks.forEach(stock => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${stock.stockin_id}</td>
            <td>${stock.product_name}</td>
            <td>${stock.supplier_name}</td>
            <td>+${stock.quantity}</td>
            <td>${stock.remarks}</td>
            <td>${stock.added_by}</td>
            <td>${stock.date_received}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    div.appendChild(table);
};
