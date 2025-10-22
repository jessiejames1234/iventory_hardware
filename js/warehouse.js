import { requireRole, logout } from "./auth.js";
const user = requireRole(["admin"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);
  displayWarehouses();
  document.getElementById("btn-add-warehouse")?.addEventListener("click", insertWarehouseModal);

  // delegate clicks for "View" buttons
  document.getElementById("warehouse-table-div").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view-warehouse]");
    if(!btn) return;
    const id   = Number(btn.getAttribute("data-id"));
    const name = btn.getAttribute("data-name") || "Warehouse";
    viewWarehouseProducts(id, name);
  });
});

const displayWarehouses = async () => {
  const div = document.getElementById("warehouse-table-div");
  div.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-primary" role="status"></div></div>`;

  try{
    const res = await axios.get(`${baseApiUrl}/warehouse.php`, { params:{ operation:"getWarehouses" }});
    const rows = Array.isArray(res.data) ? res.data : [];
    if(!rows.length){
      div.innerHTML = `<div class="p-4 text-center text-muted">No warehouses found.</div>`;
      return;
    }
    let html = `
      <table class="table table-striped align-middle">
        <thead>
          <tr style="background-color:#2563eb; color:white;">
            <th>Name</th>
            <th>Location</th>
            <th style="width:110px;">Action</th>
          </tr>
        </thead>
        <tbody>
    `;
    rows.forEach(w => {
      // avoid breaking HTML with quotes inside name
      const safeName = String(w.name ?? "").replace(/"/g, "&quot;");
      html += `
        <tr>
          <td>${safeName}</td>
          <td>${w.location || "-"}</td>
          <td>
            <button class="btn btn-sm btn-primary" data-view-warehouse data-id="${w.id}" data-name="${safeName}">
              <i class="bi bi-eye"></i> View
            </button>
          </td>
        </tr>`;
    });
    html += `</tbody></table>`;
    div.innerHTML = html;
  } catch {
    div.innerHTML = `<div class="p-4 text-danger text-center">Error loading warehouses.</div>`;
  }
};

export const insertWarehouseModal = () => {
  const modalEl = document.getElementById("blank-modal");
  const modal = new bootstrap.Modal(modalEl);

  document.getElementById("blank-modal-title").innerText = "New Warehouse";
  document.getElementById("blank-main-div").innerHTML = `
    <div class="mb-3">
      <label class="form-label">Warehouse Name</label>
      <input type="text" id="warehouse-name" class="form-control" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Location / Address</label>
      <input type="text" id="warehouse-location" class="form-control">
    </div>
  `;
  document.getElementById("blank-modal-footer").innerHTML = `
    <button class="btn btn-success" id="btn-save-warehouse">Save</button>
    <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
  `;

  document.getElementById("btn-save-warehouse").onclick = async () => {
    const name = document.getElementById("warehouse-name").value.trim();
    const location = document.getElementById("warehouse-location").value.trim();
    if(!name){
      Swal.fire({ title:"Missing Name", text:"Please enter a warehouse name.", icon:"warning", timer:1500, showConfirmButton:false, scrollbarPadding:false });
      return;
    }
    try{
      const res = await axios.post(`${baseApiUrl}/warehouse.php`, new URLSearchParams({
        operation: "insertWarehouse",
        json: JSON.stringify({ name, location })
      }));
      if(res.data.status === "success"){
        Swal.fire({ title:"Warehouse Added", icon:"success", timer:1200, showConfirmButton:false, timerProgressBar:true, scrollbarPadding:false })
          .then(() => { modal.hide(); displayWarehouses(); });
      }else{
        Swal.fire({ title:"Failed", text:res.data.message||"Error creating warehouse.", icon:"error" });
      }
    }catch{
      Swal.fire({ title:"Error", text:"An error occurred while creating warehouse.", icon:"error" });
    }
  };

  modal.show();
};
export const viewWarehouseProducts = async (warehouseId, warehouseName) => {
  const modalEl = document.getElementById("blank-modal");

  // ✅ Make modal 1.5x wider
  modalEl.querySelector(".modal-dialog")?.classList.add("modal-xl"); // Bootstrap extra large size

  const modal = new bootstrap.Modal(modalEl);
  document.getElementById("blank-modal-title").innerText = `Products in ${warehouseName}`;
  document.getElementById("blank-main-div").innerHTML =
    `<div class="p-4 text-center"><div class="spinner-border text-primary" role="status"></div></div>`;
  document.getElementById("blank-modal-footer").innerHTML =
    `<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>`;
  modal.show();

  try {
    const res = await axios.get(`${baseApiUrl}/warehouse.php`, {
      params: { operation: "getProductsByWarehouse", warehouseId }
    });

    let rows = Array.isArray(res.data) ? res.data : [];
    if (!rows.length) {
      document.getElementById("blank-main-div").innerHTML =
        `<div class="p-4 text-center text-muted">No products in this warehouse.</div>`;
      return;
    }

    // Pagination setup
    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredRows = [...rows];
    let sortAsc = true;

    const uniqueBrands = [...new Set(rows.map(r => r.brand).filter(Boolean))];
    const uniqueCategories = [...new Set(rows.map(r => r.category).filter(Boolean))];
    const stockStatuses = ["All", "Low", "Normal", "High", "Out of Stock"];

    document.getElementById("blank-main-div").innerHTML = `
      <style>
        /* ✅ Make modal content wider */
        #blank-modal .modal-dialog.modal-xl {
          max-width: 95%; /* about 1.5x wider */
        }
        #blank-main-div { min-height: 520px; max-height: 520px; }
        #product-table-container { max-height: 370px; overflow-y: auto; }
        #product-table-container table { margin-bottom: 0; }
        .badge-low { background-color: #f59e0b; }   /* orange */
        .badge-normal { background-color: #3b82f6; }/* blue */
        .badge-high { background-color: #16a34a; }  /* green */
        .badge-out { background-color: #dc2626; }   /* red */
      </style>

      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <input type="text" id="filter-input" class="form-control w-25" placeholder="Search product name...">
        <select id="filter-brand" class="form-select w-auto">
          <option value="">All Brands</option>
          ${uniqueBrands.map(b => `<option value="${b}">${b}</option>`).join("")}
        </select>
        <select id="filter-category" class="form-select w-auto">
          <option value="">All Categories</option>
          ${uniqueCategories.map(c => `<option value="${c}">${c}</option>`).join("")}
        </select>
        <select id="filter-status" class="form-select w-auto">
          ${stockStatuses.map(s => `<option value="${s}">${s}</option>`).join("")}
        </select>
        <div id="pagination-controls" class="text-nowrap"></div>
      </div>

      <div id="product-table-container">
        <table class="table table-bordered align-middle">
          <thead class="table-light sticky-top bg-white">
            <tr>
              <th>Product</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Unit</th>
              <th class="text-end sortable" id="qty-header" style="cursor:pointer;">
                Quantity <i class="bi bi-arrow-down-up"></i>
              </th>
              <th>Stock Status</th>
            </tr>
          </thead>
          <tbody id="product-table-body"></tbody>
        </table>
      </div>
    `;

    const tbody = document.getElementById("product-table-body");
    const paginationDiv = document.getElementById("pagination-controls");
    const filterInput = document.getElementById("filter-input");
    const filterBrand = document.getElementById("filter-brand");
    const filterCategory = document.getElementById("filter-category");
    const filterStatus = document.getElementById("filter-status");
    const qtyHeader = document.getElementById("qty-header");

    const getBadge = (status) => {
      switch (status) {
        case "Low": return `<span class="badge badge-low text-white">${status}</span>`;
        case "Normal": return `<span class="badge badge-normal text-white">${status}</span>`;
        case "High": return `<span class="badge badge-high text-white">${status}</span>`;
        case "Out of Stock": return `<span class="badge badge-out text-white">${status}</span>`;
        default: return status || "-";
      }
    };

    const applyFilters = () => {
      const keyword = filterInput.value.toLowerCase();
      const brand = filterBrand.value;
      const category = filterCategory.value;
      const status = filterStatus.value;

      filteredRows = rows.filter(r => {
        return (
          r.name.toLowerCase().includes(keyword) &&
          (!brand || r.brand === brand) &&
          (!category || r.category === category) &&
          (status === "All" || !status || r.stock_status === status)
        );
      });
      currentPage = 1;
      renderTable();
    };

    const renderTable = () => {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageRows = filteredRows.slice(start, end);

      tbody.innerHTML = pageRows.map(p => `
        <tr>
          <td>${p.name}</td>
          <td>${p.brand || "-"}</td>
          <td>${p.category || "-"}</td>
          <td>${p.unit || "-"}</td>
          <td class="text-end">${p.quantity}</td>
          <td>${getBadge(p.stock_status)}</td>
        </tr>
      `).join("");

      // Fill empty rows to keep height fixed
      const remain = itemsPerPage - pageRows.length;
      if (remain > 0)
        tbody.innerHTML += `<tr><td colspan="6" style="height:${remain * 35}px"></td></tr>`;

      // Pagination
      const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
      paginationDiv.innerHTML = `
        <button class="btn btn-sm btn-outline-primary me-2" id="prev-page" ${currentPage === 1 ? "disabled" : ""}>
          <i class="bi bi-arrow-left"></i>
        </button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button class="btn btn-sm btn-outline-primary ms-2" id="next-page" ${currentPage === totalPages ? "disabled" : ""}>
          <i class="bi bi-arrow-right"></i>
        </button>
      `;

      document.getElementById("prev-page").onclick = () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
      };
      document.getElementById("next-page").onclick = () => {
        if (currentPage < totalPages) { currentPage++; renderTable(); }
      };
    };

    qtyHeader.addEventListener("click", () => {
      sortAsc = !sortAsc;
      filteredRows.sort((a, b) => sortAsc ? a.quantity - b.quantity : b.quantity - a.quantity);
      qtyHeader.querySelector("i").className = sortAsc ? "bi bi-arrow-down" : "bi bi-arrow-up";
      renderTable();
    });

    [filterInput, filterBrand, filterCategory, filterStatus].forEach(el =>
      el.addEventListener("input", applyFilters)
    );

    renderTable();
  } catch (err) {
    console.error(err);
    document.getElementById("blank-main-div").innerHTML =
      `<div class="p-4 text-danger text-center">Error loading products.</div>`;
  }
};
