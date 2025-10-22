import { requireRole, logout } from "./auth.js";

// 🔐 Require warehouse manager or clerk
const user = requireRole(["warehouse_manager", "warehouse_clerk"]);
const baseApiUrl = "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  
  
  
  
  if (!user) return; // safety check
  // 👤 Show logged-in user
  document.getElementById("logged-user").textContent = user.name;
  // 🚪 Logout
  document.getElementById("btn-logout")?.addEventListener("click", logout);



  
  // Save last page
  sessionStorage.setItem("lastPage", window.location.href);
  filterSidebarLinks(user.role, document.getElementById("sidebarContent"));
  const sidebarHTML = document.getElementById("sidebarContent").innerHTML;
  document.getElementById("offcanvasContent").innerHTML = sidebarHTML;
  filterSidebarLinks(user.role, document.getElementById("offcanvasContent"));
  //





  // 📦 Load products if authorized
  if (["warehouse_manager", "warehouse_clerk"].includes(user.role)) {
    loadProducts(user.staff_id);
  } else {
    document.getElementById("warehouse-table-div").innerHTML =
      `<p class="p-3 text-danger">Access denied. Only managers can view this.</p>`;
  }
});

//
// 🔎 Hide restricted sidebar links
//
function filterSidebarLinks(role, container = document) {
  container.querySelectorAll("[data-roles]").forEach(link => {
    const roles = link.getAttribute("data-roles").split(",").map(r => r.trim());
    if (!roles.includes(role)) {
      link.style.display = "none"; // hide restricted link
    }
  });
}

//
// 📦 Load warehouse products
//
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
        <thead>
          <tr style="background-color:#2563eb; color:white;">
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
