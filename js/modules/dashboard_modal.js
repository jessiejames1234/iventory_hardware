// /js/dashboard_modal.js
export function openListModal(title, _endpointOrNull, rowsOrObj, headersOpt){
  const titleEl = document.getElementById("blank-modal-title");
  const bodyEl  = document.getElementById("blank-main-div");
  const footEl  = document.getElementById("blank-modal-footer");

  titleEl.textContent = title;

  // Build table from rowsOrObj
  let headers = headersOpt;
  let rows = [];

  if (Array.isArray(rowsOrObj) && rowsOrObj.length && Array.isArray(rowsOrObj[0])) {
    // Already an array of arrays
    rows = rowsOrObj;
    if (!headers) headers = rows[0].map((_,i)=>`Col ${i+1}`);
  } else if (Array.isArray(rowsOrObj)) {
    // Array of objects
    const keys = headers || Object.keys(rowsOrObj[0] || {});
    headers = keys;
    rows = rowsOrObj.map(o => keys.map(k => o[k]));
  } else if (rowsOrObj && typeof rowsOrObj === "object") {
    // key-value pairs
    headers = ["Key","Value"];
    rows = Object.entries(rowsOrObj);
  } else {
    headers = ["Info"];
    rows = [["No data"]];
  }

  const table = document.createElement("table");
  table.className = "table table-sm";
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr>`;
  const tbody = document.createElement("tbody");
  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = r.map(c=>`<td>${c ?? ""}</td>`).join("");
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);

  bodyEl.innerHTML = "";
  bodyEl.appendChild(table);

  footEl.innerHTML = `<button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>`;

  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), { keyboard:true, backdrop:"static" });
  myModal.show();
}
