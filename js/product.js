  import { insertProductModal,updateProductModal,viewProductModal } from "./modules/model_product.js";


  import { checkAuth, logout } from "./auth.js";

  const user = checkAuth(); // 🔐 Redirects if not logged in
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
  sessionStorage.setItem("baseAPIUrl", baseApiUrl);

  document.addEventListener("DOMContentLoaded", () => {
    // 👤 Display logged-in user
    document.getElementById("logged-user").textContent = user.name;

    // 🚪 Logout
    document.getElementById("btn-logout").addEventListener("click", logout);

    // ➕ Add product
    document.getElementById("btn-add-product").addEventListener("click", () => {
      insertProductModal(user); // ✅ Pass user
    });

    displayProducts();
  });

  const displayProducts = async () => {
    const div = document.getElementById("products-table-div");

    // Show loading spinner
    div.innerHTML = `
      <div class="d-flex justify-content-center align-items-center p-5">
        <div class="spinner-border text-primary me-2" role="status"></div>
        <span class="fw-semibold">Loading products...</span>
      </div>
    `;

    try {
      const response = await axios.get(`${baseApiUrl}/product.php`, {
        params: { operation: "getProducts" },
      });

      if (response.status === 200) {
        // Wait 1 second before showing table
        setTimeout(() => {
          displayProductsTable(response.data);
        }, 500);
      } else {
        div.innerHTML = `<div class="text-center p-4 text-danger fw-semibold">Error loading products!</div>`;
      }
    } catch (error) {
      div.innerHTML = `<div class="text-center p-4 text-danger fw-semibold">Error loading products!</div>`;
      console.error(error);
    }
  };

  let currentProducts = []; // store all products globally
  let currentPage = 1;
  let rowsPerPage = 10;

  const displayProductsTable = (products) => {
    currentProducts = products;
    currentPage = 1; // reset to first page
    rowsPerPage = parseInt(document.getElementById("rows-per-page").value);
    renderTablePage();
  };

  const renderTablePage = () => {
    const div = document.getElementById("products-table-div");

    // Show loading spinner (same style)
    div.innerHTML = `
      <div class="d-flex justify-content-center align-items-center p-5">
        <div class="spinner-border text-primary me-2" role="status"></div>
        <span class="fw-semibold">Loading products...</span>
      </div>
    `;

    setTimeout(() => {
      const searchValue = document.getElementById("table-search").value.toLowerCase();
      const filtered = currentProducts.filter(p =>
        p.name.toLowerCase().includes(searchValue) ||
        (p.model || "").toLowerCase().includes(searchValue) ||
        (p.unit || "").toLowerCase().includes(searchValue) ||
        (p.category || "").toLowerCase().includes(searchValue) ||
        (p.brand || "").toLowerCase().includes(searchValue)
      );

      const totalPages = Math.ceil(filtered.length / rowsPerPage);
      if (currentPage > totalPages) currentPage = totalPages || 1;

      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      const pageData = filtered.slice(start, end);

      // Build table as before
      const table = document.createElement("table");
      table.classList.add("table", "table-hover", "align-middle", "mb-0", "table-striped");

      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr style="background-color:#2563eb; color:white;">
          <th>Name</th>
          <th>Model</th>

          <th>Unit</th>
                              <th>Category</th>
          <th>Brand</th>
          <th class="text-end">Price</th>

          <th class="text-center">Status</th>
          <th class="text-center">Actions</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      pageData.forEach(product => {
        const row = document.createElement("tr");
        if (product.is_active != 1) row.style.backgroundColor = "#f1f5f9";

        row.innerHTML = `
          <td class="fw-semibold">${product.name}</td>
          <td>${product.model || ""}</td>
          <td>${product.unit || ""}</td>
                    <td>${product.category}</td>
          <td>${product.brand}</td>
          <td class="text-end fw-semibold text-success">₱${parseFloat(product.price).toFixed(2)}</td>

          <td class="text-center">
            <span class="badge ${product.is_active == 1 ? "bg-success" : "bg-danger"} px-3 py-2 shadow-sm">
              ${product.is_active == 1 ? "Active" : "Inactive"}
            </span>
          </td>
          <td class="text-center">
            <div class="btn-group btn-group-sm shadow-sm">
              <button type="button" class="btn text-white" style="background-color:#6c757d;"><i class="bi bi-eye"></i></button>
              <button type="button" class="btn text-white" style="background-color:#2563eb;"><i class="bi bi-pencil-square"></i></button>
              <button type="button" class="btn text-white" style="background-color:#475569;">Toggle</button>
            </div>
          </td>
        `;
        tbody.appendChild(row);

        // Attach buttons (same as before)
        row.querySelector(".btn-group .btn:first-child").addEventListener("click", () => {
          viewProductModal(product.product_id);
        });
        row.querySelector(".btn-group .btn:nth-child(2)").addEventListener("click", () => {
          updateProductModal(product.product_id, displayProducts);
        });
        row.querySelector(".btn-group .btn:last-child").addEventListener("click", async () => {
          const formData = new FormData();
          formData.append("operation", "toggleProductStatus");
          formData.append("json", JSON.stringify({ id: product.product_id }));
          try {
            const res = await axios.post(`${baseApiUrl}/product.php`, formData);
            if (res.data.status === "success") displayProducts();
            else alert("Failed to toggle product status.");
          } catch (err) { alert("Failed to toggle product status."); console.error(err); }
        });
      });

      table.appendChild(tbody);
      div.innerHTML = ""; // remove spinner
      div.appendChild(table);

      renderPagination(filtered.length);
    }, 300); // short delay to show spinner
  };


  const renderPagination = (totalItems) => {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.className = `btn btn-sm ${i === currentPage ? "btn-primary" : "btn-outline-primary"}`;
      btn.textContent = i;
      btn.addEventListener("click", () => {
        currentPage = i;
        renderTablePage();
      });
      pagination.appendChild(btn);
    }
  };

  // Event listeners
  document.getElementById("table-search").addEventListener("input", renderTablePage);
  document.getElementById("rows-per-page").addEventListener("change", () => {
    rowsPerPage = parseInt(document.getElementById("rows-per-page").value);
    currentPage = 1;
    renderTablePage();
  });