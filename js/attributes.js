import { showInsertModal } from "./modules/attributes_modal.js";
import { checkAuth, logout } from "./auth.js";

const user = checkAuth(); // 🔐 Redirects if not logged in
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
    displayUnits();
    displayBrands();
    displayCategories();

    // 👤 Display logged-in user
    document.getElementById("logged-user").textContent = user.name;

    // 🚪 LogoutI
    document.getElementById("btn-logout").addEventListener("click", logout);

    // ➕ Add buttons for modal
    document.getElementById("btn-add-unit")?.addEventListener("click", () => showInsertModal("unit", displayUnits));
    document.getElementById("btn-add-brand")?.addEventListener("click", () => showInsertModal("brand", displayBrands));
    document.getElementById("btn-add-category")?.addEventListener("click", () => showInsertModal("category", displayCategories));
});

const loadingHTML = `
    <div class="d-flex justify-content-center py-4">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
`;

export const displayUnits = async () => {
    const div = document.getElementById("unit-table-div");
    div.innerHTML = loadingHTML;

    try {
        const res = await axios.get(`${baseApiUrl}/attributes.php`, { params: { operation: "getUnits" } });
        setTimeout(() => {
            const table = document.createElement("table");
            table.className = "table table-striped table-hover";
            table.innerHTML = `
                <thead><tr><th>Unit</th></tr></thead>
                <tbody>${res.data.map(u => `<tr><td>${u.name}</td></tr>`).join('')}</tbody>
            `;
            div.innerHTML = "";
            div.appendChild(table);
        }, 1000);
    } catch (err) {
        console.error(err);
        div.innerHTML = `<div class="text-danger text-center py-3">Failed to load units.</div>`;
    }
};

export const displayBrands = async () => {
    const div = document.getElementById("brand-table-div");
    div.innerHTML = loadingHTML;

    try {
        const res = await axios.get(`${baseApiUrl}/attributes.php`, { params: { operation: "getBrands" } });
        setTimeout(() => {
            const table = document.createElement("table");
            table.className = "table table-striped table-hover";
            table.innerHTML = `
                <thead><tr><th>Brand</th></tr></thead>
                <tbody>${res.data.map(b => `<tr><td>${b.name}</td></tr>`).join('')}</tbody>
            `;
            div.innerHTML = "";
            div.appendChild(table);
        }, 1000);
    } catch (err) {
        console.error(err);
        div.innerHTML = `<div class="text-danger text-center py-3">Failed to load brands.</div>`;
    }
};

export const displayCategories = async () => {
    const div = document.getElementById("category-table-div");
    div.innerHTML = loadingHTML;

    try {
        const res = await axios.get(`${baseApiUrl}/attributes.php`, { params: { operation: "getCategories" } });
        setTimeout(() => {
            const table = document.createElement("table");
            table.className = "table table-striped table-hover";
            table.innerHTML = `
                <thead><tr><th>Category</th></tr></thead>
                <tbody>${res.data.map(c => `<tr><td>${c.name}</td></tr>`).join('')}</tbody>
            `;
            div.innerHTML = "";
            div.appendChild(table);
        }, 1000);
    } catch (err) {
        console.error(err);
        div.innerHTML = `<div class="text-danger text-center py-3">Failed to load categories.</div>`;
    }
};