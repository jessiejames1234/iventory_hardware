import { requireRole, logout } from "./auth.js";

// 🔐 Admin-only
const user = requireRole(["admin"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);

  const filterCategory = document.getElementById("filter-category");
  const filterBrand = document.getElementById("filter-brand");
  const filterUnit = document.getElementById("filter-unit");
  const searchInput = document.getElementById("search-input");

  let categoryFilter = "";
  let brandFilter = "";
  let unitFilter = "";
  let searchTerm = "";
  let statusFilter = "all"; // all | good | low | out

  // 🧩 Load filters
  async function loadFilters() {
    try {
      const res = await axios.get(`${baseApiUrl}/inventory.php`, {
        params: { operation: "getFilters" },
      });
      const data = res.data;

      data.categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = cat.name;
        filterCategory.appendChild(opt);
      });
      data.brands.forEach((b) => {
        const opt = document.createElement("option");
        opt.value = b.name;
        opt.textContent = b.name;
        filterBrand.appendChild(opt);
      });
      data.units.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.name;
        opt.textContent = u.name;
        filterUnit.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to load filters:", err);
    }
  }

  // 📦 Display inventory
  async function displayInventory() {
    const div = document.getElementById("inventory-table-div");
    div.innerHTML = `
      <div class="d-flex justify-content-center align-items-center p-5">
        <div class="spinner-border text-primary me-2" role="status"></div>
        <span class="fw-semibold">Loading inventory...</span>
      </div>`;

    try {
      const res = await axios.get(`${baseApiUrl}/inventory.php`, {
        params: { operation: "getAllProductsWithQty" },
      });

      const products = res.data;
      if (!Array.isArray(products)) throw new Error("Invalid response");

      let currentPage = 1;
      let rowsPerPage = parseInt(document.getElementById("rows-per-page-footer").value) || 10;

      const renderTable = () => {
        const tableDiv = document.getElementById("inventory-table-div");

        // Filtering + status logic
        const filtered = products.filter((p) => {
          const cat = p.category || ""; 
          const br = p.brand || "";
          const un = p.unit || "";
          const qty = parseInt(p.quantity || 0);
          const reorder = parseInt(p.reorder_level || 0);
          let computedStatus = "good";
          if (qty === 0) computedStatus = "out";
          else if (qty < reorder) computedStatus = "low";

          return (
            (categoryFilter === "" || cat === categoryFilter) &&
            (brandFilter === "" || br === brandFilter) &&
            (unitFilter === "" || un === unitFilter) &&
            (statusFilter === "all" || computedStatus === statusFilter) &&
            (
              p.product_name.toLowerCase().includes(searchTerm) ||
              (p.model || "").toLowerCase().includes(searchTerm) ||
              (p.sku || "").toLowerCase().includes(searchTerm) ||
              br.toLowerCase().includes(searchTerm)
            )
          );
        });

        // Pagination
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
    <th class="text-center" style="width:60px;">#</th>
    <th style="min-width: 200px;">Product</th>
    <th>Model</th>
    <th>SKU</th>
    <th>Category</th>
    <th>Brand</th>
    <th>Unit</th>
    <th class="text-end">Reorder</th>
    <th class="text-end">Quantity</th>
    <th class="text-center sortable" id="status-sort">
      <span class="d-flex justify-content-center align-items-center gap-1">
        <span>Status</span>
        <span class="sort-arrows">
          <i class="bi bi-caret-up-fill ${statusFilter === "good" ? "text-success" : "text-muted"}"></i>
          <i class="bi bi-dash-lg ${statusFilter === "low" ? "text-warning" : "text-muted"}"></i>
          <i class="bi bi-caret-down-fill ${statusFilter === "out" ? "text-danger" : "text-muted"}"></i>
        </span>
      </span>
    </th>
  </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        if (!filtered.length) {
          tbody.innerHTML = `
            <tr>
              <td colspan="10" class="text-center text-muted py-4">
                <i class="bi bi-info-circle"></i> No matching products found
              </td>
            </tr>`;
        } else {
          pageData.forEach((p, i) => {
            const qty = parseInt(p.quantity || 0);
            const reorder = parseInt(p.reorder_level || 0);

            let status = "Good", color = "#22c55e", code = "good";
            if (qty === 0) { status = "Out of Stock"; color = "#ef4444"; code = "out"; }
            else if (qty < reorder) { status = "Low Stock"; color = "#facc15"; code = "low"; }

            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td class="text-center fw-semibold">${start + i + 1}</td>
              <td class="fw-semibold">${p.product_name}</td>
              <td>${p.model || "-"}</td>
              <td>${p.sku || "-"}</td>
              <td>${p.category || "-"}</td>
              <td>${p.brand || "-"}</td>
              <td>${p.unit || "-"}</td>
              <td class="text-end">${reorder}</td>
              <td class="text-end fw-semibold ${qty === 0 ? "text-danger": qty < reorder ? "text-warning" : "text-success"}">${qty}</td>
              <td class="text-center">
                <span class="d-inline-flex align-items-center gap-1">
                  <span class="rounded-circle" style="width:10px; height:10px; background-color:${color};"></span>
                  <span class="small fw-semibold" style="color:${color};">${status}</span>
                </span>
              </td>`;
            tbody.appendChild(tr);
          });
        }

        table.appendChild(tbody);
        tableDiv.innerHTML = "";
        tableDiv.appendChild(table);

        // 🔽 Clickable status filter toggle
        const statusSort = document.getElementById("status-sort");
        statusSort.addEventListener("click", () => {
          switch (statusFilter) {
            case "all": statusFilter = "good"; break;
            case "good": statusFilter = "low"; break;
            case "low": statusFilter = "out"; break;
            case "out": statusFilter = "all"; break;
          }
          renderTable();
        });

        renderPagination(filtered.length);
      };

      // ✅ Pagination footer
      const renderPagination = (totalItems) => {
        const pagination = document.getElementById("pagination");
        const tableInfo = document.getElementById("table-info");
        pagination.innerHTML = "";

        const totalPages = Math.ceil(totalItems / rowsPerPage);
        if (totalPages <= 0) {
          tableInfo.textContent = "No entries available";
          return;
        }

        const start = (currentPage - 1) * rowsPerPage + 1;
        const end = Math.min(currentPage * rowsPerPage, totalItems);
        tableInfo.textContent = `Showing ${start} to ${end} of ${totalItems} entries`;

        const makeBtn = (label, disabled, onClick) => {
          const li = document.createElement("li");
          li.className = `page-item ${disabled ? "disabled" : ""}`;
          li.innerHTML = `<button class="page-link">${label}</button>`;
          if (!disabled) li.addEventListener("click", onClick);
          pagination.appendChild(li);
        };

        makeBtn("««", currentPage === 1, () => { currentPage = 1; renderTable(); });
        makeBtn("‹", currentPage === 1, () => { currentPage--; renderTable(); });
        const pageLi = document.createElement("li");
        pageLi.className = "page-item active";
        pageLi.innerHTML = `<button class="page-link">${currentPage}</button>`;
        pagination.appendChild(pageLi);
        makeBtn("›", currentPage === totalPages, () => { currentPage++; renderTable(); });
        makeBtn("»»", currentPage === totalPages, () => { currentPage = totalPages; renderTable(); });

        document.getElementById("rows-per-page-footer").value = rowsPerPage;
      };

      document.getElementById("rows-per-page-footer").addEventListener("change", (e) => {
        rowsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
      });

      renderTable();
    } catch (err) {
      console.error(err);
      div.innerHTML = `<div class="alert alert-danger m-3">Failed to load inventory.</div>`;
    }
  }

  // 🧭 Filters and search
  [filterCategory, filterBrand, filterUnit].forEach((el) => {
    el.addEventListener("change", () => {
      categoryFilter = filterCategory.value;
      brandFilter = filterBrand.value;
      unitFilter = filterUnit.value;
      displayInventory();
    });
  });

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase();
    displayInventory();
  });

  loadFilters();
  displayInventory();
});
