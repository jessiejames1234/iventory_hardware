import { insertSupplierModal } from "../modules/insert_supplier.js";
import { viewSupplierModal } from "../modules/view_supplier.js";
import { updateSupplierModal } from "../modules/update_supplier.js";

const baseApiUrl = "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  displaySuppliers();

  const addBtn = document.getElementById("btn-add-supplier");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      insertSupplierModal(displaySuppliers);
    });
  }
});

const displaySuppliers = async () => {
  const response = await axios.get(`${baseApiUrl}/suppliers.php`, {
    params: { operation: "getAllSuppliers" },
  });

  if (response.status === 200) {
    displaySuppliersTable(response.data);
  } else {
    alert("Error fetching suppliers!");
  }
};

const displaySuppliersTable = (suppliers) => {
  const tableDiv = document.getElementById("supplier-table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>NAME</th>
      <th>COMPANY</th>
      <th>CONTACT</th>
      <th>EMAIL</th>
      <th>ADDRESS</th>
      <th>NOTES</th>
      <th>STATUS</th>
      <th>ACTION</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  suppliers.forEach((supplier) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${supplier.supplier_id}</td>
      <td>${supplier.name}</td>
      <td>${supplier.company_name}</td>
      <td>${supplier.contact_info}</td>
      <td>${supplier.email}</td>
      <td>${supplier.address}</td>
      <td>${supplier.notes}</td>
      <td>${supplier.is_active == 1 ? "Active" : "Inactive"}</td>
      <td>
        <button type='button' class='btn btn-primary btn-sm btn-view'>View</button>
        <button type='button' class='btn btn-success btn-sm btn-update'>Update</button>
        <button type='button' class='btn btn-danger btn-sm btn-delete'>Delete</button>
      </td>
    `;
    tbody.appendChild(row);

    // View
    row.querySelector(".btn-view").addEventListener("click", () => {
      viewSupplierModal(supplier.supplier_id);
    });

    // Update
    row.querySelector(".btn-update").addEventListener("click", () => {
      updateSupplierModal(supplier.supplier_id, displaySuppliers);
    });

    // Delete
    row.querySelector(".btn-delete").addEventListener("click", () => {
      deleteSupplier(supplier.supplier_id);
    });
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};

const deleteSupplier = async (supplierId) => {
  if (!confirm("Are you sure you want to delete this supplier?")) return;

  const formData = new FormData();
  formData.append("operation", "deleteSupplier");
  formData.append("json", JSON.stringify({ supplierId }));

  const response = await axios.post(`${baseApiUrl}/suppliers.php`, formData);

  if (response.data == 1) {
    displaySuppliers();
    alert("Supplier deleted successfully!");
  } else {
    alert("Error deleting supplier!");
  }
};
