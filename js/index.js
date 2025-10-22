// index.js (ES module)
import { initPaymentModule } from "../js/modules/payment.js";
import { requireRole, logout } from "./auth.js";

// 🔐 cashier only
const user = requireRole(["cashier"]);
const baseApiUrl = "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

// ------- State -------  
let cart = {};
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let rowsPerPage = 10;

// ------- Utilities -------
const normalize = (s) =>
  (s == null
    ? ""
    : s.toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim());

const matches = (p, q) => {
  if (!q) return true;
  const hay = [
    p.name ?? p.product_name ?? "",
    p.sku ?? "",
    p.model ?? "",
    p.category ?? "",
    p.brand ?? "",
  ]
    .map(normalize)
    .join(" ");
  return hay.includes(q);
};

const debounce = (fn, ms = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

// ------- Cart UI -------
// Add this helper near your other utilities:
const getOnHand = (productId) => {
  // try from loaded product list first
  const p = allProducts.find(x => Number(x.product_id) === Number(productId));
  const q = Number(p?.quantity ?? 0);
  return Number.isFinite(q) ? q : 0;
};

function updateOrderMenu() {
  const orderTable = document.getElementById("order-table-body");
  const sumDiv = document.getElementById("sum");
  orderTable.innerHTML = "";

  let totalPrice = 0;
  const items = Object.values(cart);

  if (items.length === 0) {
    orderTable.innerHTML = `
      <tr>
        <td colspan="4" class="px-4 py-6 text-center text-gray-500 italic">
          No active order found.
        </td>
      </tr>`;
    sumDiv.textContent = "";
    return;
  }

  items.forEach((item) => {
    const stock = getOnHand(item.product_id);
    // auto-clamp item.quantity if it exceeds stock
    if (item.quantity > stock) item.quantity = Math.max(stock, 0);

    const itemTotal = Number(item.selling_price) * Number(item.quantity || 0);
    totalPrice += itemTotal;

    const row = document.createElement("tr");
    row.className = "border-b";

    row.innerHTML = `
      <td class="px-4 py-3 font-semibold whitespace-normal break-words w-1/2">
        ${item.product_name || item.name}
        <div class="text-xs text-gray-500">On hand: ${stock}</div>
      </td>
      <td class="px-4 py-3 text-center">
        <input 
          type="number" 
          min="1" 
          ${stock > 0 ? `max="${stock}"` : `max="0"`}
          value="${Math.max(1, Math.min(item.quantity, stock))}" 
          class="w-20 text-center border-2 border-gray-300 rounded-lg px-2 py-1 text-lg font-semibold focus:ring-2 focus:ring-blue-500"
        />
      </td>
      <td class="px-4 py-3 text-right font-bold text-green-700 text-lg">
        ₱${itemTotal.toFixed(2)}
      </td>
      <td class="px-4 py-3 text-center">
        <button class="text-red-600 hover:text-red-800 text-2xl font-bold remove-item">&times;</button>
      </td>
    `;

    // Quantity change (clamp to [1, stock])
    row.querySelector("input").addEventListener("input", (e) => {
      let newQty = parseInt(e.target.value) || 1;
      const maxQ = Math.max(stock, 0);
      newQty = Math.max(1, Math.min(newQty, maxQ));
      e.target.value = newQty;
      item.quantity = newQty;
      updateOrderMenu();
    });

    // Remove button
    row.querySelector(".remove-item").addEventListener("click", () => {
      delete cart[item.product_id];
      updateOrderMenu();
    });

    orderTable.appendChild(row);
  });

  sumDiv.textContent = `Total: ₱${totalPrice.toFixed(2)}`;
}



function addToOrder(product) {
  const id = product.product_id;
  const stock = Number(product.quantity ?? 0); // from API grid
  if (!cart[id]) {
    if (stock <= 0) {
      Swal.fire('Out of stock', `${product.product_name || product.name} has 0 on hand.`, 'warning');
      return;
    }
    cart[id] = {
      product_id: id,
      product_name: product.product_name || product.name,
      selling_price: parseFloat(product.selling_price ?? product.price ?? 0),
      quantity: 1,
    };
  } else {
    const nextQty = cart[id].quantity + 1;
    if (nextQty > stock) {
      Swal.fire('Insufficient stock', `Max available for ${product.product_name || product.name} is ${stock}.`, 'info');
      cart[id].quantity = stock; // clamp to max
    } else {
      cart[id].quantity = nextQty;
    }
  }
  updateOrderMenu();
}


function removeFromOrder(productId) {
  if (cart[productId]) {
    cart[productId].quantity -= 1;
    if (cart[productId].quantity <= 0) delete cart[productId];
    updateOrderMenu();
  }
}

// ------- Filters -------
async function loadFilters() {
  try {
    const [catsRes, brandsRes, unitsRes] = await Promise.all([
      fetch(`${baseApiUrl}/product.php?operation=getCategories`),
      fetch(`${baseApiUrl}/product.php?operation=getBrands`),
      fetch(`${baseApiUrl}/product.php?operation=getUnits`),
    ]);

    const cats = await catsRes.json();
    const brands = await brandsRes.json();
    const units = await unitsRes.json();

    fillSelect("filter-category", cats);
    fillSelect("filter-brand", brands);
    fillSelect("filter-unit", units);

    document.getElementById("filter-category").addEventListener("change", applyFilters);
    document.getElementById("filter-brand").addEventListener("change", applyFilters);
    document.getElementById("filter-unit").addEventListener("change", applyFilters);
  } catch (err) {
    console.error("Error loading filters:", err);
  }
}

function fillSelect(id, list) {
  const select = document.getElementById(id);
  if (!select) return;
  list.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = normalize(item.name);
    opt.textContent = item.name;
    select.appendChild(opt);
  });
}

function applyFilters() {
  const q = normalize(document.getElementById("product-search").value);
  const cat = normalize(document.getElementById("filter-category").value);
  const brand = normalize(document.getElementById("filter-brand").value);
  const unit = normalize(document.getElementById("filter-unit").value);

  filteredProducts = allProducts.filter((p) => {
    const matchesSearch = matches(p, q);
    const matchesCat = !cat || normalize(p.category) === cat;
    const matchesBrand = !brand || normalize(p.brand) === brand;
    const matchesUnit = !unit || normalize(p.unit) === unit;
    return matchesSearch && matchesCat && matchesBrand && matchesUnit;
  });

  currentPage = 1;
  renderPage();
}

// ------- Search -------
function wireSearch() {
  const input = document.getElementById("product-search");
  if (!input) return;

  const run = debounce(() => {
    applyFilters();
  }, 150);

  input.addEventListener("input", run);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.currentTarget.blur();
  });
}

// ------- Fetch & render -------
async function loadProducts() {
  try {
    const res = await fetch(`${baseApiUrl}/product.php?operation=getProducts`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const products = await res.json();
    allProducts = Array.isArray(products) ? products : [];
    filteredProducts = allProducts.slice();

    renderPage();
    wireSearch();
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

function renderPage() {
  const container = document.querySelector(".products-grid");
  container.innerHTML = "";

if (!filteredProducts.length) {
  container.innerHTML = `
    <div class="col-span-full flex items-center justify-center py-10">
      <span class="text-gray-500 text-sm italic">
        No products match your search.
      </span>
    </div>
  `;
  document.getElementById("table-info").textContent = "No entries available";
  return;
}

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageItems = filteredProducts.slice(start, end);

  pageItems.forEach((product) => {
    const qty = product.quantity ?? 0;
    const price =
      product.price != null
        ? Number(product.price)
        : Number(product.selling_price ?? 0);

const card = document.createElement("div");
card.className = `
  product-card border p-3 rounded-lg shadow 
  hover:shadow-lg hover:bg-blue-50 
  transition bg-white text-sm leading-snug
  flex flex-col justify-between
`;


card.innerHTML = `
  <div class="flex flex-col space-y-1 overflow-hidden">
    <h4 class="font-bold text-sm text-gray-800 truncate">${product.name}</h4>
    <p class="text-gray-600 text-xs"><b>Brand:</b> <span class="truncate">${product.brand || ""}</span></p>
    <p class="text-gray-600 text-xs"><b>Unit:</b> ${product.unit || ""}</p>
    <p class="text-gray-600 text-xs"><b>SKU:</b> ${product.sku || ""}</p>
    <p class="text-gray-600 text-xs"><b>Qty:</b> 
      <span class="${qty > 0 ? "text-green-600" : "text-red-600 font-bold"}">
        ${qty} ${qty === 0 ? "⚠️" : ""}
      </span>
    </p>
  </div>
  <div class="mt-2 font-bold text-blue-600 text-base text-right">₱${parseFloat(product.price).toFixed(2)}</div>
`;


    card.addEventListener("click", () => addToOrder(product));
    container.appendChild(card);
  });

  renderPagination(filteredProducts.length);
}

function renderPagination(totalItems) {
  const pagination = document.getElementById("pagination");
  const tableInfo = document.getElementById("table-info");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(totalItems / rowsPerPage);
  if (totalItems === 0) {
    tableInfo.textContent = "No entries available";
    return;
  }

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);
  tableInfo.textContent = `Showing ${start} to ${end} of ${totalItems} entries`;

  // First <<
  const first = document.createElement("li");
  first.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  first.innerHTML = `<button class="page-link">&laquo;&laquo;</button>`;
  first.onclick = () => {
    if (currentPage > 1) {
      currentPage = 1;
      renderPage();
    }
  };
  pagination.appendChild(first);

  // Prev <
  const prev = document.createElement("li");
  prev.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prev.innerHTML = `<button class="page-link">&laquo;</button>`;
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  };
  pagination.appendChild(prev);

  // Current page number (static)
  const current = document.createElement("li");
  current.className = "page-item active";
  current.innerHTML = `<button class="page-link">${currentPage}</button>`;
  pagination.appendChild(current);

  // Next >
  const next = document.createElement("li");
  next.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  next.innerHTML = `<button class="page-link">&raquo;</button>`;
  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
    }
  };
  pagination.appendChild(next);

  // Last >>
  const last = document.createElement("li");
  last.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  last.innerHTML = `<button class="page-link">&raquo;&raquo;</button>`;
  last.onclick = () => {
    if (currentPage < totalPages) {
      currentPage = totalPages;
      renderPage();
    }
  };
  pagination.appendChild(last);
}


// ------- Page init -------
document.addEventListener("DOMContentLoaded", () => {
  // terminal name
  const tname =
    sessionStorage.getItem("terminal_name") ||
    `Terminal #${sessionStorage.getItem("terminal_id") || "?"}`;
  document.getElementById("current-terminal")?.replaceChildren(document.createTextNode(tname));

  // logged user
  const logged = document.getElementById("logged-user");
  if (logged) logged.textContent = user.name ?? "Cashier";

  // logout
  document.getElementById("btn-logout")?.addEventListener("click", logout);

  // order now button / payment module
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  initPaymentModule(cart, currentUser?.staff_id ?? 0, () => {
    updateOrderMenu();
    loadProducts(); // refresh products after payment
  });

  // pagination rows-per-page change
  document.getElementById("rows-per-page-footer").addEventListener("change", (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderPage();
  });

  // search + filters
  document.getElementById("product-search").addEventListener("input", applyFilters);
  loadFilters();

  // initial load
  loadProducts();
});
