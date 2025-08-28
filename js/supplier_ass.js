import { updateModal } from "./modules/model_supplier.js";

  import { checkAuth, logout } from "./auth.js";

  const user = checkAuth(); // 🔐 Redirects if not logged in
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
  sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {

          // 👤 Display logged-in user
          document.getElementById("logged-user").textContent = user.name;
        
          // 🚪 Logout
          document.getElementById("btn-logout").addEventListener("click", logout);
    displayAssignments();

    document.getElementById("btn-assign-supplier").addEventListener("click", () => {
        updateModal();
    });
});

const displayAssignments = async () => {
    const div = document.getElementById("supplier-table-div");
    if (!div) return;

    // 🔄 Show loading spinner
    div.innerHTML = `
        <div class="d-flex justify-content-center align-items-center p-5">
            <div class="spinner-border text-primary me-2" role="status"></div>
            <span class="fw-semibold">Loading assignments...</span>
        </div>
    `;

    try {
        const response = await axios.get(`${baseApiUrl}/supplier_ass.php`, {
            params: { operation: "getAllAssignments" }
        });

        setTimeout(() => {
            if (Array.isArray(response.data) && response.data.length) {
                renderTable(response.data);
            } else {
                div.innerHTML = `
                    <div class="alert alert-warning m-0">
                        No assignment data found.
                    </div>
                `;
            }
        }, 1000); // Smooth delay

    } catch (err) {
        console.error(err);
        div.innerHTML = `
            <div class="alert alert-danger m-0">
                Error loading data!
            </div>
        `;
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
