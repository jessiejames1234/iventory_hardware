


import { checkAuth, logout } from "./auth.js";
const user = checkAuth(); // 👈 this ensures redirect if not logged in
const baseApiUrl = "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);
document.addEventListener("DOMContentLoaded", () => {
  // 👤 Show logged in user
  document.getElementById("logged-user").textContent = user.name;

  // 🚪 Logout
  document.getElementById("btn-logout")?.addEventListener("click", logout);

  // Load products only if warehouse_manager
  if (user.role === "warehouse_manager") {
    loadProducts(user.staff_id);
  } else {
    document.getElementById("warehouse-table-div").innerHTML =
      `<p class="p-3 text-danger">Access denied. Only managers can view this.</p>`;
  }
});


async function loadProducts(staff_id) {
  try {
    const res = await axios.post("../api/getProductsByWarehouse.php", {
      staff_id: staff_id
    });

    const { warehouse_name, products } = res.data;

    // 🏷️ Update the card header title
    document.querySelector("#warehouse-title").innerHTML = `
      <i class="bi bi-box-seam me-2" style="color: #3b82f6;"></i>
      ${warehouse_name || "Warehouse Inventory"}
    `;

    if (!Array.isArray(products) || products.length === 0) {
      document.getElementById("warehouse-table-div").innerHTML =
        `<p class="p-3">No products found for your warehouse.</p>`;
      return;
    }

    let table = `
      <table class="table table-striped mb-0">
        <thead">
        <tr style="background-color:#2563eb; color:white;">
            <th>ID</th>
            <th>Product</th>
            <th>Model</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Warehouse</th>
          </tr>
        </thead>
        <tbody>
    `;

    products.forEach(p => {
      table += `
        <tr>
          <td>${p.product_id}</td>
          <td>${p.product_name}</td>
          <td>${p.model}</td>
          <td>${p.selling_price}</td>
          <td>${p.quantity}</td>
          <td>${p.warehouse_name}</td>
        </tr>
      `;
    });

    table += "</tbody></table>";
    document.getElementById("warehouse-table-div").innerHTML = table;

  } catch (err) {
    console.error("Error loading products:", err);
    document.getElementById("warehouse-table-div").innerHTML =
      `<p class="p-3 text-danger">Error loading products.</p>`;
  }
}
