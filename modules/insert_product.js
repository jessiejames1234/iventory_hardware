// ensure this file calls the RIGHT endpoint and the RIGHT lists
export const insertProductModal = async (user) => { // ⬅️ accept user
  const modal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  const [categories, brands, sizes, colors, units] = await Promise.all([
    getList("getCategories"),
    getList("getBrands"),
    getList("getSizes"),
    getList("getColors"),
    getList("getUnits"),
  ]);

  document.getElementById("blank-modal-title").innerText = "Add New Product";
document.getElementById("blank-main-div").innerHTML = `
<table class="table table-sm">
<tr><td>Name</td><td><input type="text" id="product-name" class="form-control required" /></td></tr>
<tr><td>Model</td><td><input type="text" id="product-model" class="form-control" /></td></tr>
<tr><td>Specs</td><td><textarea id="product-specs" class="form-control"></textarea></td></tr>
<tr><td>Warranty</td><td><input type="text" id="product-warranty" class="form-control" /></td></tr>
<tr><td>Selling Price</td><td><input type="number" id="product-price" class="form-control required" /></td></tr>
<tr><td>Cost Price</td><td><input type="number" id="product-cost" class="form-control required" /></td></tr>
<tr><td>Reorder Level</td><td><input type="number" id="product-reorder" class="form-control" /></td></tr>
<tr><td>Category</td><td>${buildSelect(categories, 'product-category')}</td></tr>
<tr><td>Brand</td><td>${buildSelect(brands, 'product-brand')}</td></tr>
<tr><td>Unit</td><td>${buildSelect(units, 'product-unit', true)}</td></tr>
</table>`;


  document.getElementById("blank-modal-footer").innerHTML = `
    <button class="btn btn-primary w-100" id="btn-save-product">Save</button>
  `;

  document.getElementById("btn-save-product").addEventListener("click", async () => {
    const name    = document.getElementById("product-name").value.trim();
    const price   = parseFloat(document.getElementById("product-price").value);
    const cost    = parseFloat(document.getElementById("product-cost").value);
    const catId   = document.getElementById("product-category").value;
    const brandId = document.getElementById("product-brand").value;
    const reorderRaw = document.getElementById("product-reorder").value; // "" or "0" or "5"
    const reorderNum = reorderRaw === "" ? null : Number(reorderRaw);

    // client-side guard (server re-checks)
    const errs = [];
    if (!name) errs.push("Name is required.");
    if (!catId) errs.push("Category is required.");
    if (!brandId) errs.push("Brand is required.");
    if (!(price > 0)) errs.push("Selling price must be greater than 0.");
    if (!(cost  > 0)) errs.push("Cost price must be greater than 0.");
    // NOT required; only block negatives
    if (reorderRaw !== "" && isNaN(reorderNum)) errs.push("Reorder must be a number.");
    if (reorderNum !== null && reorderNum < 0)  errs.push("Reorder cannot be negative.");

    if (errs.length) {
      alert(errs.join("\n"));
      return;
    }

const payload = {
    name: document.getElementById("product-name").value.trim(),
    model: document.getElementById("product-model").value.trim(),
    specs: document.getElementById("product-specs").value.trim(),
    warranty_period: document.getElementById("product-warranty").value.trim(),
    price: parseFloat(document.getElementById("product-price").value),
    cost_price: parseFloat(document.getElementById("product-cost").value),
    // ✅ Default to 0 if empty
    reorder_level: document.getElementById("product-reorder").value.trim() === "" ? 0 : Number(document.getElementById("product-reorder").value.trim()),
    categoryId: document.getElementById("product-category").value,
    brandId: document.getElementById("product-brand").value,
    unitId: document.getElementById("product-unit").value || null,
    createdBy: user.staff_id
};




    const formData = new FormData();
    formData.append("operation", "insertProduct");
    formData.append("json", JSON.stringify(payload));

    const res = await axios.post(`${sessionStorage.baseAPIUrl}/product.php`, formData);
    if (res.data.status === "success") {
      alert("Product added!");
      bootstrap.Modal.getInstance(document.getElementById("blank-modal"))?.hide();
      location.reload();
    } else {
      alert(res.data.message || "Insert failed.");
    }
  });

  modal.show();
};

const getList = async (operation) => {
  const res = await axios.get(`${sessionStorage.baseAPIUrl}/product.php`, { params: { operation } });
  return Array.isArray(res.data) ? res.data : [];
};

const buildSelect = (list, id, includeEmpty = false) => {
  let html = `<select id="${id}" class="form-select">`;
  if (includeEmpty) html += `<option value="">-- Select --</option>`;
  list.forEach(item => {
    html += `<option value="${item.id}">${item.name}</option>`;
  });
  html += `</select>`;
  return html;
};



