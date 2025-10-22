// ../js/dashboard.pro.js
import { requireRole, logout } from "./auth.js";
import { openListModal } from "./modules/dashboard_modal.js";

// === Session / base ===
const user = requireRole(["admin"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

// === Utilities ===
function el(tag, cls = "", html = "") {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html) n.innerHTML = html;
  return n;
}
const fmtPeso = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
function pesoTick(v) {
  return "₱" + Number(v || 0).toLocaleString();
}

function countUp(node, to, { duration = 900, money = false } = {}) {
  const start = performance.now();
  const from = 0;
  const diff = (to || 0) - from;
  function step(now) {
    const p = Math.min(1, (now - start) / duration); // 0..1
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    const val = from + diff * eased;
    node.textContent = money ? fmtPeso(val) : Math.round(val);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

async function loadChartJs() {
  if (window.Chart) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js";
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function fetchDashboard() {
  const { data } = await axios.get(`${baseApiUrl}/dashboard.php`, {
    params: { operation: "getDashboard" },
    validateStatus: () => true,
  });
  if (data?.error) throw new Error(data.message || "Server error");
  return data;
}

// === Init ===
document.addEventListener("DOMContentLoaded", init);

async function init() {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout")?.addEventListener("click", logout);
  document.getElementById("refresh-btn")?.addEventListener("click", reload);
  await reload();
}

async function reload() {
  const skeleton = document.getElementById("dashboard-skeleton");
  const root = document.getElementById("dashboard-root");
  if (skeleton && root) {
    skeleton.hidden = false;
    root.hidden = true;
    root.innerHTML = "";
  }

  try {
    const data = await fetchDashboard();
    await loadChartJs();
    renderDashboard(data);
    if (skeleton && root) {
      skeleton.hidden = true;
      root.hidden = false;
    }
    revealOnScroll();
  } catch (e) {
    console.error(e);
    Swal.fire("Network Error", e?.message || "Failed to load dashboard.", "error");
    if (skeleton && root) {
      skeleton.hidden = true;
      root.hidden = false;
    }
  }
}

// === Render ===
function renderDashboard(data) {
  if (!data || !data.inventory) {
    console.error("Bad payload", data);
    Swal.fire("Dashboard Error", "API returned an unexpected response.", "error");
    return;
  }

  const root = document.querySelector("#dashboard-root");
  root.innerHTML = "";

  // Row 1: Inventory KPI
  const row1 = el("div", "row g-3 p-3 stagger");
  row1.append(
    kpiCard("Total SKUs", data.inventory.total_skus, false),
    kpiCard("Active SKUs", data.inventory.active_skus, false),
    kpiCard("Inactive SKUs", data.inventory.inactive_skus, false),
    kpiCard("Open Shifts", data.operations.open_shifts, false)
  );
  root.append(row1);

  // Row 2: Sales KPI
  const s = data.sales.totals;
  const row2 = el("div", "row g-3 px-3 stagger");
  row2.append(
    kpiCard("Sales Today", s.today, true),
    kpiCard("This Week", s.this_week, true),
    kpiCard("This Month", s.this_month, true),
    kpiCard("All-time Sales", s.all_time, true)
  );
  root.append(row2);

  // Row 3: Charts
  const row3 = el("div", "row g-3 p-3 reveal");
  const c1 = chartCard("Sales by Terminal", "chart-term");
  const c2 = chartCard("Sales (Last 7 Days)", "chart-7d");
  row3.append(c1.wrap, c2.wrap);
  root.append(row3);

  const term = ensureChartData(
    (data.sales.by_terminal || []).map((x) => x.terminal_name || `T${x.terminal_id}`),
    (data.sales.by_terminal || []).map((x) => Number(x.sales || 0))
  );
  makeBar("chart-term", term.labels, term.data);

  const last7 = ensureChartData(
    (data.sales.by_day_7d || []).map((x) => x.d),
    (data.sales.by_day_7d || []).map((x) => Number(x.sales || 0))
  );
  makeLine("chart-7d", last7.labels, last7.data);

  // Row 4: Stock & Value
  const row4 = el("div", "row g-3 px-3 pb-3 reveal");
  row4.append(
    tableCard(
      "On-hand by Location",
      ["Location", "Type", "Qty"],
      (data.inventory.stock_by_location || []).map((r) => [r.location_name, r.type || "-", r.qty])
    ),
    tableCard(
      "Stock Value (Cost) by Location",
      ["Location", "Value"],
      (data.inventory.stock_value_by_location || []).map((r) => [r.location_name, fmtPeso(r.value_cost)])
    )
  );
  root.append(row4);

  // Row 5: Purchasing & GRN
  const poTbl = tableCard(
    "Purchase Orders by Status",
    ["Status", "Count"],
    (data.purchasing.po_by_status || []).map((r) => [r.status, r.cnt])
  );
  const grnTbl = tableCard(
    "GRNs by Status",
    ["Status", "Count"],
    (data.purchasing.grn_by_status || []).map((r) => [r.status, r.cnt])
  );

  const poTotals = el("div", "col-12 col-lg-4 p-3 reveal");
  poTotals.innerHTML = `
    <div class="border rounded p-3 bg-white h-100 hover-lift">
      <div class="fw-semibold mb-2">PO Value</div>
      <div class="d-flex justify-content-between"><span>Ordered</span><span id="po-ordered">${fmtPeso(0)}</span></div>
      <div class="d-flex justify-content-between"><span>Remaining</span><span id="po-remaining">${fmtPeso(0)}</span></div>
      <hr class="my-2">
      <button class="btn btn-sm btn-outline-primary w-100" id="btn-open-pos">View Open POs</button>
    </div>`;
  poTotals.querySelector("#btn-open-pos").addEventListener("click", () => {
    const rows = (data.purchasing.po_by_status || []).map((x) => [x.status, x.cnt]);
    openListModal("Purchase Orders by Status", null, rows, ["Status", "Count"]);
  });

  const row5 = el("div", "row g-3 px-3 pb-3");
  row5.append(poTbl, grnTbl, poTotals);
  root.append(row5);

  // Row 6: Top products & Low stock
  const topTbl = tableCard(
    "Top 10 Products (Qty)",
    ["Product", "Qty"],
    (data.sales.top_products_qty || []).map((r) => [r.product_name, r.qty])
  );

  const lowCard = el("div", "col-12 col-lg-6 p-3 reveal");
  lowCard.innerHTML = `
    <div class="border rounded p-3 bg-white h-100 d-flex flex-column hover-lift">
      <div class="d-flex align-items-center gap-2">
        <div class="fw-semibold">Low-Stock Overview</div>
        <span class="text-muted small">(qty ≤ reorder level)</span>
        <div class="ms-auto"></div>
      </div>
      <div class="mt-3 small text-muted">Use the button to view the full list.</div>
    </div>`;
  const lowBtn = el("button", "btn btn-sm btn-outline-danger ms-auto me-3", "View Low-Stock List");
  lowBtn.addEventListener("click", () => {
    const rows = (data.inventory.low_stock || []).map((r) => [
      r.location_name,
      r.product_name,
      r.qty,
      r.reorder_level,
    ]);
    openListModal("Low-Stock Items", null, rows, ["Location", "Product", "Qty", "Reorder"]);
  });
  lowCard.querySelector(".ms-auto").appendChild(lowBtn);

  const row6 = el("div", "row g-3 px-3 pb-4");
  row6.append(topTbl, lowCard);
  root.append(row6);

  // Footer mini stats
  const ops = data.operations;
  const foot = el("div", "p-3 text-muted small reveal");
  foot.innerHTML = `
    <div class="d-flex flex-wrap gap-3">
      <span><b>Locations:</b> ${(ops.locations || [])
        .map((l) => `${l.type || "unknown"}=${l.cnt}`)
        .join(", ")}</span>
      <span><b>Terminals Active:</b> ${ops.active_terminals}</span>
      <span><b>Sales Returns:</b> ${data.sales.sales_returns}</span>
      <span><b>Purchase Returns:</b> ${ops.purchase_returns}</span>
      <span><b>Transactions:</b> ${s.transactions} (Avg Ticket: ${fmtPeso(s.avg_ticket)})</span>
    </div>`;
  root.append(foot);

  // Animate KPIs & PO totals after mount
  requestAnimationFrame(() => {
    const invVals = [
      data.inventory.total_skus,
      data.inventory.active_skus,
      data.inventory.inactive_skus,
      data.operations.open_shifts,
    ];
    row1.querySelectorAll(".kpi-value").forEach((n, i) =>
      countUp(n, invVals[i], { duration: 700, money: false })
    );

    const saleVals = [s.today, s.this_week, s.this_month, s.all_time];
    row2.querySelectorAll(".kpi-value").forEach((n, i) =>
      countUp(n, saleVals[i], { duration: 900, money: true })
    );

    countUp(poTotals.querySelector("#po-ordered"), data.purchasing.po_value.ordered_value, {
      duration: 900,
      money: true,
    });
    countUp(poTotals.querySelector("#po-remaining"), data.purchasing.po_value.remaining_value, {
      duration: 900,
      money: true,
    });
  });
}

// === Charts ===
function ensureChartData(labels, data, placeholder = "No Data") {
  const hasData = Array.isArray(data) && data.some((v) => Number(v) > 0);
  return hasData ? { labels, data } : { labels: [placeholder], data: [0] };
}

function makeBar(id, labels, data) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Amount",
          data,
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.7,
          backgroundColor: "rgba(59,130,246,.3)",
          borderColor: "rgba(59,130,246,1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 1200, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => pesoTick(c.parsed.y) } },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: pesoTick },
          grid: { color: "rgba(15,23,42,.06)" },
        },
      },
    },
  });
}

function makeLine(id, labels, data) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Amount",
          data,
          fill: false,
          tension: 0.35,
          pointRadius: 3,
          borderWidth: 2,
          borderColor: "rgba(14,165,233,1)",
          backgroundColor: "rgba(14,165,233,.25)",
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 1200, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => pesoTick(c.parsed.y) } },
      },
      scales: {
        x: { grid: { color: "rgba(15,23,42,.03)" } },
        y: {
          beginAtZero: true,
          ticks: { callback: pesoTick },
          grid: { color: "rgba(15,23,42,.06)" },
        },
      },
    },
  });
}

// === Components ===
function kpiCard(title, value, isMoney) {
  const col = el("div", "col-6 col-lg-3");
  col.innerHTML = `
    <div class="kpi-card p-3 h-100 hover-lift fade-up" role="status" aria-live="polite">
      <div class="kpi-title">${title}</div>
      <div class="kpi-value mt-1">${isMoney ? fmtPeso(value) : value}</div>
    </div>`;
  return col;
}

function chartCard(title, canvasId) {
  const wrap = el("div", "col-12 col-lg-6");
  const card = el("div", "chart-card p-3 h-100 hover-lift");
  card.innerHTML = `<div class="card-heading fw-bold">${title}</div><canvas id="${canvasId}" height="120"></canvas>`;
  wrap.append(card);
  return { wrap, canvasId };
}

function tableCard(title, headers, rows) {
  const col = el("div", "col-12 col-lg-6 p-3");
  const card = el("div", "table-card p-3 h-100 hover-lift");
  const table = el("table", "table table-sm table-hover align-middle mb-0");
  const thead = el("thead");
  thead.innerHTML = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  const tbody = el("tbody");
  (rows || []).forEach((r) => {
    const tr = el("tr");
    tr.innerHTML = r.map((c) => `<td>${c ?? ""}</td>`).join("");
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
  card.innerHTML = `<div class="card-heading fw-bold">${title}</div>`;
  card.append(table);
  col.append(card);
  return col;
}

// === Reveal on scroll ===
function revealOnScroll() {
  const els = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  els.forEach((el) => io.observe(el));
}
