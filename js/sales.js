import { viewSaleModal, returnSaleModal } from "./modules/sales_modal.js";
import { requireRole, logout } from "./auth.js";

// 🔐 Admin only
const user = requireRole(["admin"]);



// sales.js (top)
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);
sessionStorage.setItem("user", JSON.stringify(user));10,2

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);
  loadFilters().catch(err => console.error("loadFilters error:", err));
  displaySummary().catch(err => console.error("displaySummary error:", err));
  displaySales().catch(err => console.error("displaySales error:", err));

  document.getElementById("btn-filter").addEventListener("click", () => {
    displaySales().catch(err => console.error("displaySales error:", err));
  });
});

const displaySummary = async () => {
  try {
    const response = await axios.get(`${baseApiUrl}/sales.php`, { params: { operation: "getSummary" } });
    console.log("getSummary →", response.data);
    if (response.status === 200) {
      const data = response.data || {};
      document.getElementById("stat-total-products").innerText = data.today_total ?? 0;
      document.getElementById("stat-active-products").innerText = data.today_transactions ?? 0;
      document.getElementById("stat-inactive-products").innerText = data.earned ?? 0;
      document.getElementById("stat-extra").innerText = data.refunds ?? 0;
    }
  } catch (e) {
    console.error("getSummary failed:", e);
  }
};

const loadFilters = async () => {
  try {
    // Staff
    const staffRes = await axios.get(`${baseApiUrl}/staff.php`, { params: { operation: "getAllStaff" } });
    console.log("getAllStaff →", staffRes.data);
    if (staffRes.status === 200 && Array.isArray(staffRes.data)) {
      const select = document.getElementById("filter-user");
      staffRes.data
        .filter(s => (s.role === "admin" || s.role === "cashier"))
        .forEach(st => {
          const staffName = st.staff_name || st.name || `#${st.staff_id}`;
          let opt = document.createElement("option");
          opt.value = st.staff_id;
          opt.innerText = `${staffName} (${st.role})`;
          select.appendChild(opt);
        });
    }

    // Terminals
    const salesRes = await axios.get(`${baseApiUrl}/sales.php`, { params: { operation: "getAllSales" } });
    console.log("getAllSales (for terminals) →", salesRes.data);
    if (salesRes.status === 200 && Array.isArray(salesRes.data)) {
      const uniqueTerms = [...new Set(salesRes.data.map(s => s.terminal))].filter(Boolean);
      const select = document.getElementById("filter-terminal");
      uniqueTerms.forEach(t => {
        let opt = document.createElement("option");
        opt.value = t;
        opt.innerText = t;
        select.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("loadFilters failed:", e);
  }
};

const displaySales = async () => {
  try {
    const params = { operation: "getAllSales" };

    // filters
    const staffId = document.getElementById("filter-user").value;
    const terminal = document.getElementById("filter-terminal").value;
    const start = document.getElementById("filter-start").value;
    const end = document.getElementById("filter-end").value;

    if (staffId) params.staffId = staffId;
    if (terminal) params.terminal = terminal;
    if (start) params.startDate = start;
    if (end) params.endDate = end;

    const response = await axios.get(`${baseApiUrl}/sales.php`, { params });
    console.log("getAllSales (for table) →", response.data);

    if (response.status === 200) {
      displaySalesTable(response.data);
    } else {
      displaySalesTable([]);
    }
  } catch (e) {
    console.error("displaySales failed:", e);
    displaySalesTable([]);
  }
};

const displaySalesTable = (sales) => {
  const tableDiv = document.getElementById("sales-table-div");
  tableDiv.innerHTML = "";

  if (!Array.isArray(sales) || sales.length === 0) {
    tableDiv.innerHTML = "<div class='p-3 text-muted'>No transactions found.</div>";
    return;
  }

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Transaction ID</th>
      <th>Date/Time</th>
      <th>Cashier</th>
      <th>Terminal</th>
      <th>Items</th>
      <th>Total</th>
      <th>Action</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  sales.forEach(sale => {
    const row = document.createElement("tr");
const showReturn = (sale.remaining_items ?? 0) > 0;

row.innerHTML = `
  <td>${String(sale.transaction_id).padStart(4,'0')}</td>
  <td>${sale.datetime}</td>
  <td>${sale.staff_name ?? "Unknown"}</td>
  <td>${sale.terminal ?? ""}</td>
  <td>${sale.items_count ?? 0}</td>
  <td>${sale.total_amount}</td>
  <td>
    <button class="btn btn-primary btn-sm btn-view">View</button>
    ${showReturn ? `<button class="btn btn-danger btn-sm btn-return">Return</button>` : ``}
  </td>
`;

    tbody.appendChild(row);

    row.querySelector(".btn-view").addEventListener("click", () => {
      viewSaleModal(sale.transaction_id);
    });
// where you wire the Return button
const btnReturn = row.querySelector(".btn-return");
if (btnReturn) {
  btnReturn.addEventListener("click", () => {
    returnSaleModal(sale.transaction_id, user.staff_id, displaySales);
  });
}


  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};
