import { insertProductModal, insertBrandModal, insertCategoryModal } from "../modules/insert.js";
import { updateProductModal } from "../modules/update.js";

const baseApiUrl = "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-add-product")?.addEventListener("click", insertProductModal);
  document.getElementById("btn-add-brand")?.addEventListener("click", insertBrandModal);
  document.getElementById("btn-add-category")?.addEventListener("click", insertCategoryModal);
  displayProducts();
});
const displayProducts = async () => {
  const res = await axios.get(`${baseApiUrl}/products.php`, {
    params: { operation: "getProducts" }
  });

  if (res.status === 200) {
    renderProductTable(res.data);
  } else {
    alert("Failed to load products.");
  }
};

const renderProductTable = (products) => {
  const div = document.getElementById("items-table-div");
  div.innerHTML = "";

  const table = document.createElement("table");
  table.className = "table table-striped table-hover table-sm";
  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th><th>Name</th><th>Price</th>
        <th>Category</th><th>Brand</th><th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  products.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.category}</td>
      <td>${p.brand}</td>
      <td>
        <button class="btn btn-sm btn-success btn-edit">Edit</button>
      </td>
    `;

    row.querySelector(".btn-edit").addEventListener("click", () => {
      updateProductModal(p.product_id, displayProducts);
    });

    table.querySelector("tbody").appendChild(row);
  });

  div.appendChild(table);
};
