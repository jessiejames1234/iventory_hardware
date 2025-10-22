import { showInsertModal } from "./modules/attributes_modal.js";
import { requireRole, logout } from "./auth.js";

// 🔐 Admin only
const user = requireRole(["admin"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

// State for pagination
let units = [], brands = [], categories = [];
let unitPage = 1, brandPage = 1, categoryPage = 1;
let rowsPerPage = 10;

document.addEventListener("DOMContentLoaded", () => {
    displayUnits();
    displayBrands();
    displayCategories();

    // 👤 Display logged-in user
    document.getElementById("logged-user").textContent = user.name;

    // 🚪 Logout
    document.getElementById("btn-logout").addEventListener("click", logout);

    // ➕ Add buttons for modal
    document.getElementById("btn-add-unit")?.addEventListener("click", () => showInsertModal("unit", displayUnits));
    document.getElementById("btn-add-brand")?.addEventListener("click", () => showInsertModal("brand", displayBrands));
    document.getElementById("btn-add-category")?.addEventListener("click", () => showInsertModal("category", displayCategories));
});

// 🔹 Loading spinner HTML
const loadingHTML = `
<div class="d-flex justify-content-center py-4">
    <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>
</div>
`;

/* -------------------------- UNITS -------------------------- */
export const displayUnits = async () => {
    const div = document.getElementById("unit-table-div");
    div.innerHTML = loadingHTML;

    try {
        const res = await axios.get(`${baseApiUrl}/attributes.php`, { params: { operation: "getUnits" } });
        units = res.data || [];
        unitPage = 1; // reset page
        renderUnitTable();
    } catch (err) {
        console.error(err);
        div.innerHTML = `<div class="text-danger text-center py-3">Failed to load units.</div>`;
    }
};

const renderUnitTable = () => {
    const searchValue = document.getElementById("unit-search")?.value.toLowerCase() || "";
    const filtered = units.filter(u => u.name.toLowerCase().includes(searchValue));
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (unitPage > totalPages) unitPage = totalPages || 1;

    const start = (unitPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filtered.slice(start, end);

    const div = document.getElementById("unit-table-div");
    div.innerHTML = "";

    if (pageData.length === 0) {
        div.innerHTML = `<div class="alert alert-secondary text-center m-0">No matching records found.</div>`;
        document.getElementById("unit-info").textContent = "No entries available";
        document.getElementById("unit-pagination").innerHTML = "";
        return;
    }

    const table = document.createElement("table");
    table.className = "table table-striped table-hover mb-0";
    table.innerHTML = `
        <thead class="bg-light text-secondary">
            <tr><th>Unit</th></tr>
        </thead>
        <tbody>${pageData.map(u => `<tr><td>${u.name}</td></tr>`).join('')}</tbody>
    `;
    div.appendChild(table);

    renderPagination("unit", filtered.length, unitPage, (page) => { unitPage = page; renderUnitTable(); });
};

/* -------------------------- BRANDS -------------------------- */
export const displayBrands = async () => {
    const div = document.getElementById("brand-table-div");
    div.innerHTML = loadingHTML;

    try {
        const res = await axios.get(`${baseApiUrl}/attributes.php`, { params: { operation: "getBrands" } });
        brands = res.data || [];
        brandPage = 1;
        renderBrandTable();
    } catch (err) {
        console.error(err);
        div.innerHTML = `<div class="text-danger text-center py-3">Failed to load brands.</div>`;
    }
};

const renderBrandTable = () => {
    const searchValue = document.getElementById("brand-search")?.value.toLowerCase() || "";
    const filtered = brands.filter(b => b.name.toLowerCase().includes(searchValue));
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (brandPage > totalPages) brandPage = totalPages || 1;

    const div = document.getElementById("brand-table-div");
    div.innerHTML = "";

    if (filtered.length === 0) {
        div.innerHTML = `<div class="alert alert-secondary text-center m-0">No matching records found.</div>`;
        document.getElementById("brand-info").textContent = "No entries available";
        document.getElementById("brand-pagination").innerHTML = "";
        return;
    }

    const table = document.createElement("table");
    table.className = "table table-striped table-hover mb-0";
    table.innerHTML = `
        <thead class="bg-light text-secondary">
            <tr><th>Brand</th></tr>
        </thead>
        <tbody>${filtered.slice((brandPage-1)*rowsPerPage, brandPage*rowsPerPage).map(b => `<tr><td>${b.name}</td></tr>`).join('')}</tbody>
    `;
    div.appendChild(table);

    renderPagination("brand", filtered.length, brandPage, (page) => { brandPage = page; renderBrandTable(); });
};

/* -------------------------- CATEGORIES -------------------------- */
export const displayCategories = async () => {
    const div = document.getElementById("category-table-div");
    div.innerHTML = loadingHTML;

    try {
        const res = await axios.get(`${baseApiUrl}/attributes.php`, { params: { operation: "getCategories" } });
        categories = res.data || [];
        categoryPage = 1;
        renderCategoryTable();
    } catch (err) {
        console.error(err);
        div.innerHTML = `<div class="text-danger text-center py-3">Failed to load categories.</div>`;
    }
};

const renderCategoryTable = () => {
    const searchValue = document.getElementById("category-search")?.value.toLowerCase() || "";
    const filtered = categories.filter(c => c.name.toLowerCase().includes(searchValue));
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (categoryPage > totalPages) categoryPage = totalPages || 1;

    const div = document.getElementById("category-table-div");
    div.innerHTML = "";

    if (filtered.length === 0) {
        div.innerHTML = `<div class="alert alert-secondary text-center m-0">No matching records found.</div>`;
        document.getElementById("category-info").textContent = "No entries available";
        document.getElementById("category-pagination").innerHTML = "";
        return;
    }

    const table = document.createElement("table");
    table.className = "table table-striped table-hover mb-0";
    table.innerHTML = `
        <thead class="bg-light text-secondary">
            <tr><th>Category</th></tr>
        </thead>
        <tbody>${filtered.slice((categoryPage-1)*rowsPerPage, categoryPage*rowsPerPage).map(c => `<tr><td>${c.name}</td></tr>`).join('')}</tbody>
    `;
    div.appendChild(table);

    renderPagination("category", filtered.length, categoryPage, (page) => { categoryPage = page; renderCategoryTable(); });
};

/* -------------------------- PAGINATION HELPER -------------------------- */
const renderPagination = (prefix, totalItems, currentPage, onPageChange) => {
    const pagination = document.getElementById(`${prefix}-pagination`);
    const info = document.getElementById(`${prefix}-info`);
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    pagination.innerHTML = "";

    if (totalPages <= 0) {
        info.textContent = "No entries available";
        return;
    }

    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, totalItems);
    info.textContent = `Showing ${start} to ${end} of ${totalItems} entries`;

    // << First
    const firstLi = document.createElement("li");
    firstLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    firstLi.innerHTML = `<button class="page-link">&laquo;&laquo;</button>`;
    firstLi.addEventListener("click", () => { if(currentPage>1) onPageChange(1); });
    pagination.appendChild(firstLi);

    // < Prev
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<button class="page-link">&lsaquo;</button>`;
    prevLi.addEventListener("click", () => { if(currentPage>1) onPageChange(currentPage-1); });
    pagination.appendChild(prevLi);

    // Current page
    const pageLi = document.createElement("li");
    pageLi.className = "page-item active";
    pageLi.innerHTML = `<button class="page-link">${currentPage}</button>`;
    pagination.appendChild(pageLi);

    // > Next
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<button class="page-link">&rsaquo;</button>`;
    nextLi.addEventListener("click", () => { if(currentPage<totalPages) onPageChange(currentPage+1); });
    pagination.appendChild(nextLi);

    // >> Last
    const lastLi = document.createElement("li");
    lastLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    lastLi.innerHTML = `<button class="page-link">&raquo;&raquo;</button>`;
    lastLi.addEventListener("click", () => { if(currentPage<totalPages) onPageChange(totalPages); });
    pagination.appendChild(lastLi);
};

/* -------------------------- SEARCH LISTENERS -------------------------- */
document.getElementById("unit-search")?.addEventListener("input", () => renderUnitTable());
document.getElementById("brand-search")?.addEventListener("input", () => renderBrandTable());
document.getElementById("category-search")?.addEventListener("input", () => renderCategoryTable());
