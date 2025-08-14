import { updateModal } from "../modules/supplier_ass_modal.js";

const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";

document.addEventListener("DOMContentLoaded", () => {
    displayAssignments();

    document.getElementById("btn-assign-supplier").addEventListener("click", () => {
        openInsertModal();
    });
});

const displayAssignments = async () => {
    try {
        // ✅ Correct endpoint for product-supplier assignments
const response = await axios.get(`${baseApiUrl}/supplier_ass.php`, {
    params: { operation: "getAllAssignments" }
});


        if (Array.isArray(response.data)) {
            renderTable(response.data);
        } else {
            alert("No assignment data found.");
        }
    } catch (err) {
        console.error(err);
        alert("Error loading data!");
    }
};

const renderTable = (data) => {
    const div = document.getElementById("supplier-table-div");
    div.innerHTML = "";

    const table = document.createElement("table");
    table.classList.add("table", "table-hover", "table-striped", "table-sm");

    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Supplier</th>
                <th>Action</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement("tbody");
    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.product_supplier_id}</td>
            <td>${row.product_name}</td>
            <td>${row.supplier_name}</td>
            <td>
                <button class="btn btn-success btn-sm btn-update">Update</button>
                <button class="btn btn-danger btn-sm btn-delete">Delete</button>
            </td>
        `;

        tr.querySelector(".btn-update").addEventListener("click", () => {
            updateModal(row.product_supplier_id, displayAssignments);
        });

        tr.querySelector(".btn-delete").addEventListener("click", () => {
            deleteAssignment(row.product_supplier_id);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    div.appendChild(table);
};

const deleteAssignment = async (id) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    const formData = new FormData();
    formData.append("operation", "deleteAssignment");
    formData.append("json", JSON.stringify({ id }));

    const response = await axios.post(`${baseApiUrl}/product_supplier.php`, formData);

    if (response.data == 1) {
        alert("Deleted successfully!");
        displayAssignments();
    } else {
        alert("Error deleting record!");
    }
};

const openInsertModal = () => {
    updateModal(null, displayAssignments); // null = insert mode
};
