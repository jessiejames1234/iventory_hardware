import { insertProductModal, updateProductModal, viewProductModal } from "./modules/model_product.js";
import { requireRole, logout } from "./auth.js";


// 🔐 Admin only
const user = requireRole(["admin"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);

  const filterCategory = document.getElementById("filter-Category");
  const filterBrand = document.getElementById("filter-Brand");
  const filterUnit = document.getElementById("filter-Unit");
  const searchInput = document.getElementById("table-search");
 
  const statTotal = document.getElementById("stat-total-products");
  const statActive = document.getElementById("stat-active-products");
  const statInactive = document.getElementById("stat-inactive-products");

  let statusFilter = "";
  let categoryFilter = "";
  let brandFilter = "";
  let unitFilter = "";
  let searchTerm = "";

async function displayProducts() {
  const div = document.getElementById("products-table-div");

  const scrollY = window.scrollY;

  div.innerHTML = `
    <div class="d-flex justify-content-center align-items-center p-5">
      <div class="spinner-border text-primary me-2" role="status"></div>
      <span class="fw-semibold">Loading products...</span>
    </div>`;

  try {
    const res = await axios.get(`${baseApiUrl}/product.php`, {
      params: {
        operation: "getProducts",
        status: statusFilter,
        category: categoryFilter,
        brand: brandFilter,
        unit: unitFilter,
        search: searchTerm
      },
    });

    if (res.status === 200) {
      setTimeout(() => {
        displayProductsTable(res.data);

        // 🧭 Restore scroll position
        window.scrollTo({ top: scrollY, behavior: "smooth"});
      }, 500);
    } else {
      div.innerHTML = `<div class="text-center text-danger p-4 fw-semibold">Error loading products</div>`;
    }
  } catch (err) {
    div.innerHTML = `<div class="text-center text-danger p-4 fw-semibold">Error loading products</div>`;
    console.error(err);
  }
}


  // 🧩 Filter dropdowns + search
  [filterCategory, filterBrand, filterUnit].forEach((el) => {
    el.addEventListener("change", () => {
      categoryFilter = filterCategory.value;
      brandFilter = filterBrand.value;
      unitFilter = filterUnit.value;
      displayProducts();
    });
  });

  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value.toLowerCase();
    displayProducts();
  });

  // 🧩 Clickable stat boxes
  statTotal.parentElement.parentElement.style.cursor = "pointer";
  statActive.parentElement.parentElement.style.cursor = "pointer";
  statInactive.parentElement.parentElement.style.cursor = "pointer";

  statTotal.parentElement.parentElement.addEventListener("click", () => {
    statusFilter = "";
    displayProducts();
  });
  statActive.parentElement.parentElement.addEventListener("click", () => {
    statusFilter = "active";
    displayProducts();
  });
  statInactive.parentElement.parentElement.addEventListener("click", () => {
    statusFilter = "inactive";
    displayProducts();
  });

  // 🧩 Load dropdown filters
  async function loadFilterOptions() {
    try {
      const res = await axios.get(`${baseApiUrl}/product.php`, {
        params: { operation: "getFilters" },
      });
      const data = res.data;

      data.categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.category_id;
        opt.textContent = cat.name;
        filterCategory.appendChild(opt);
      });

      data.brands.forEach((brand) => {
        const opt = document.createElement("option");
        opt.value = brand.brand_id;
        opt.textContent = brand.name;
        filterBrand.appendChild(opt);
      });

      data.units.forEach((unit) => {
        const opt = document.createElement("option");
        opt.value = unit.unit_id;
        opt.textContent = unit.name;
        filterUnit.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to load filters:", err);
    }
  }

  // 🧩 Load global stats ONCE
  async function loadInitialStats() {
    try {
      const res = await axios.get(`${baseApiUrl}/product.php`, {
        params: { operation: "getProducts" },
      });
      if (res.status === 200) updateStats(res.data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  // ➕ Add Product
  document.getElementById("btn-add-product").addEventListener("click", () => {
    insertProductModal(user, (success) => {
      if (success) {
        displayProducts();
        loadInitialStats(); // ✅ Refresh totals when adding a new product
      }
    });
  });

  // ✅ Initial load
  loadFilterOptions();
  displayProducts();
  loadInitialStats();
});



// 📦 Fetch products + show spinners

let currentProducts = [];
let currentPage = 1;
let rowsPerPage = 10;
let sortKey = null;
let sortOrder = "asc";

const displayProductsTable = (products) => {
    // 🅰️ Sort alphabetically by product name (A → Z)
    currentProducts = products.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

    currentPage = 1; // reset to first page
    rowsPerPage = parseInt(document.getElementById("rows-per-page-footer").value);
    renderTablePage();
};


// 🔢 Show loading state in stats boxes
function showStatsLoading() {
  ["stat-total-products", "stat-active-products", "stat-inactive-products", "stat-extra"].forEach((id) => {
    const el = document.getElementById(id);
    el.innerHTML = `<div class="d-flex justify-content-center align-items-center">
      <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
    </div>`;
  });
}
// 🔢 Update global stats (only when called)
function updateStats(products) {
  const total = products.length;
  const active = products.filter((p) => p.is_active == 1).length;
  const inactive = total - active;

  document.getElementById("stat-total-products").textContent = total;
  document.getElementById("stat-active-products").textContent = active;
  document.getElementById("stat-inactive-products").textContent = inactive;
  document.getElementById("stat-extra").textContent = "0";
}

const renderTablePage = () => {
    const div = document.getElementById("products-table-div");

    // Show loading spinner
    div.innerHTML = `
        <div class="d-flex justify-content-center align-items-center p-5">
            <div class="spinner-border text-primary me-2" role="status"></div>
            <span class="fw-semibold">Loading products...</span>
        </div>
    `;

    setTimeout(() => {
        const searchValue = document.getElementById("table-search").value.toLowerCase();

        let filtered = currentProducts.filter(p =>
            p.name.toLowerCase().includes(searchValue) ||
            (p.model || "").toLowerCase().includes(searchValue) ||
            (p.unit || "").toLowerCase().includes(searchValue) ||
            (p.category || "").toLowerCase().includes(searchValue) ||
            (p.brand || "").toLowerCase().includes(searchValue)
        );

        // 🔽 Sorting
        if (sortKey) {
            filtered = filtered.sort((a, b) => {
                let valA, valB;
                switch (sortKey) {
                    case "cost":
                        valA = parseFloat(a.cost_price);
                        valB = parseFloat(b.cost_price);
                        break;
                    case "price":
                        valA = parseFloat(a.price);
                        valB = parseFloat(b.price);
                        break;
                    case "reorder":
                        valA = parseInt(a.reorder_level);
                        valB = parseInt(b.reorder_level);
                        break;
                    case "status":
                        valA = a.is_active == 1 ? 1 : 0;
                        valB = b.is_active == 1 ? 1 : 0;
                        break;
                    default:
                        valA = a[sortKey];
                        valB = b[sortKey];
                }
                if (valA < valB) return sortOrder === "asc" ? -1 : 1;
                if (valA > valB) return sortOrder === "asc" ? 1 : -1;
                return 0;
            });
        }

        const totalPages = Math.ceil(filtered.length / rowsPerPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageData = filtered.slice(start, end);

        // Build table
        const table = document.createElement("table");
        table.classList.add("table", "align-middle", "mb-0", "table-hover");

const thead = document.createElement("thead");
thead.innerHTML = `
    <tr class="bg-light text-secondary">
        <th class="text-center" style="width: 60px;">#</th>
        <th>Name</th>
        <th>Model</th>

                <th>SKU</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Unit</th>
                <th class="text-end sortable" data-key="price">
                    <span class="d-flex justify-content-end align-items-center gap-1">
                        <span>Sell Price</span>
                        <span class="sort-arrows">
                            <span class="arrow ${sortKey === "price" && sortOrder === "asc" ? "active" : ""}">▲</span>
                            <span class="arrow ${sortKey === "price" && sortOrder === "desc" ? "active" : ""}">▼</span>
                        </span>
                    </span>
                </th>
                <th class="text-end sortable" data-key="cost">
                    <span class="d-flex justify-content-end align-items-center gap-1">
                        <span>Cost</span>
                        <span class="sort-arrows">
                            <span class="arrow ${sortKey === "cost" && sortOrder === "asc" ? "active" : ""}">▲</span>
                            <span class="arrow ${sortKey === "cost" && sortOrder === "desc" ? "active" : ""}">▼</span>
                        </span>
                    </span>
                </th>
                <th class="text-end sortable" data-key="reorder">
                    <span class="d-flex justify-content-end align-items-center gap-1">
                        <span>Reorder</span>
                        <span class="sort-arrows">
                            <span class="arrow ${sortKey === "reorder" && sortOrder === "asc" ? "active" : ""}">▲</span>
                            <span class="arrow ${sortKey === "reorder" && sortOrder === "desc" ? "active" : ""}">▼</span>
                        </span>
                    </span>
                </th>
                <th class="text-end sortable" data-key="status">
                    <span class="d-flex justify-content-end align-items-center gap-1">
                        <span>Status</span>
                        <span class="sort-arrows">
                            <span class="arrow ${sortKey === "status" && sortOrder === "asc" ? "active" : ""}">▲</span>
                            <span class="arrow ${sortKey === "status" && sortOrder === "desc" ? "active" : ""}">▼</span>
                        </span>
                    </span>
                </th>
                <th class="text-center">Actions</th>
            </tr>
        `;
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement("tbody");
        pageData.forEach(product => {
            const row = document.createElement("tr");
            if (product.is_active != 1) row.style.backgroundColor = "#f9fafb";

row.innerHTML = `
    <td class="text-center fw-semibold">${start + pageData.indexOf(product) + 1}</td>
    <td class="fw-semibold">${product.name}</td>

                <td>${product.model || ""}</td>
                <td class="text-monospace">${product.sku || ""}</td>
                <td>${product.category}</td>
                <td>${product.brand}</td>
                <td>${product.unit || ""}</td>
                <td class="text-center fw-semibold text-success">₱${parseFloat(product.price).toFixed(2)}</td>
                <td class="text-center text-danger">₱${parseFloat(product.cost_price).toFixed(2)}</td>
                <td class="text-center">${product.reorder_level}</td>
                <td class="text-center">
                    <span class="d-inline-flex align-items-center gap-1">
                        <span class="rounded-circle" style="width:10px; height:10px; background-color:${product.is_active == 1 ? '#22c55e' : '#ef4444'};"></span>
                        <span class="small ${product.is_active == 1 ? 'text-success' : 'text-danger'}">
                            ${product.is_active == 1 ? "Active" : "Inactive"}
                        </span>
                    </span>
                </td>
                <td class="text-center">
                    <div class="dropdown">
                        <button class="btn btn-sm border-0 bg-transparent" data-bs-toggle="dropdown" style="padding: 4px 8px;">
                            <i class="bi bi-three-dots-vertical fs-5 text-secondary"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                            <li><a class="dropdown-item d-flex align-items-center gap-2 view-product" href="#"><i class="bi bi-eye text-primary"></i> View</a></li>
                            <li><a class="dropdown-item d-flex align-items-center gap-2 edit-product" href="#"><i class="bi bi-pencil-square text-warning"></i> Edit</a></li>
                            <li><a class="dropdown-item d-flex align-items-center gap-2 toggle-status" href="#"><i class="bi bi-arrow-repeat text-muted"></i> Toggle Status</a></li>
                        </ul>
                    </div>
                </td>
            `;
            tbody.appendChild(row);

            // Events for actions
            row.querySelector(".view-product").addEventListener("click", () => viewProductModal(product.product_id));

row.querySelector(".edit-product").addEventListener("click", () => {
    updateProductModal(product.product_id, async () => {
        await displayProducts();   // reload the product table
        await loadInitialStats();  // refresh total, active, inactive counts
    });
});


row.querySelector(".toggle-status").addEventListener("click", async () => {
    const formData = new FormData();
    formData.append("operation", "toggleProductStatus");
    formData.append("json", JSON.stringify({ id: product.product_id }));

    try {
        const res = await axios.post(`${baseApiUrl}/product.php`, formData);
        if (res.data.status === "success") {
            displayProducts();
            Swal.fire({
                title: "Updated",
                text: "Product status has been toggled.",
                icon: "success",
                showConfirmButton: false,
                timer: 800,
                timerProgressBar: true,
                          scrollbarPadding: false

            });
        } else {
            Swal.fire({
                title: "Failed",
                text: res.data?.message || "Could not toggle product status.",
                icon: "error",
                showConfirmButton: false,
                timer: 800,
                timerProgressBar: true,
                          scrollbarPadding: false

            });
        }
    } catch (err) {
        Swal.fire({
            title: "Error",
            text: "An error occurred while toggling product status.",
            icon: "error",
            showConfirmButton: false,
            timer: 800,
            timerProgressBar: true,
                      scrollbarPadding: false

        });
        console.error(err);
    }
});

        });
        table.appendChild(tbody);

        div.innerHTML = "";
        div.appendChild(table);

        // Add sorting click events
        thead.querySelectorAll(".sortable").forEach(th => {
            th.addEventListener("click", () => {
                const key = th.dataset.key;
                if (sortKey === key) {
                    sortOrder = sortOrder === "asc" ? "desc" : "asc";
                } else {
                    sortKey = key;
                    sortOrder = "asc";
                }
                renderTablePage();
            });
        });

        renderPagination(filtered.length);
    }, 300);
};

const renderPagination = (totalItems) => {
    const pagination = document.getElementById("pagination");
    const tableInfo = document.getElementById("table-info");
    const rowsSelect = document.getElementById("rows-per-page-footer");

    pagination.innerHTML = "";
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    if (totalPages <= 0) {
        tableInfo.textContent = "No entries available";
        return;
    }

    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, totalItems);
    tableInfo.textContent = `Showing ${start} to ${end} of ${totalItems} entries`;

    // First <<
    const firstLi = document.createElement("li");
    firstLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    firstLi.innerHTML = `<button class="page-link">&laquo;&laquo;</button>`;
    firstLi.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage = 1;
            renderTablePage();
        }
    });
    pagination.appendChild(firstLi);

    // Previous <
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<button class="page-link">&lsaquo;</button>`;
    prevLi.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTablePage();
        }
    });
    pagination.appendChild(prevLi);

    // Current page number
    const pageLi = document.createElement("li");
    pageLi.className = "page-item active";
    pageLi.innerHTML = `<button class="page-link">${currentPage}</button>`;
    pagination.appendChild(pageLi);

    // Next >
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<button class="page-link">&rsaquo;</button>`;
    nextLi.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTablePage();
        }
    });
    pagination.appendChild(nextLi);

    // Last >>
    const lastLi = document.createElement("li");
    lastLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    lastLi.innerHTML = `<button class="page-link">&raquo;&raquo;</button>`;
    lastLi.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            renderTablePage();
        }
    });
    pagination.appendChild(lastLi);

    // Sync dropdown
    rowsSelect.value = rowsPerPage;
};

// Event listeners
document.getElementById("rows-per-page-footer").addEventListener("change", (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTablePage();
});
