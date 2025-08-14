export const updateModal = async (id, refreshDisplay) => {
    const myModal = new bootstrap.Modal(document.getElementById("blank-modal"));

    let productSupplier = id ? await getAssignment(id) : { product_id: "", supplier_id: "" };
    let products = await getProducts();
    let suppliers = await getSuppliers();

    document.getElementById("blank-modal-title").innerText = id ? "Update Assignment" : "New Assignment";

    document.getElementById("blank-main-div").innerHTML = `
        <div class="mb-3">
            <label>Product</label>
            ${createSelect("product-id", products, "product_id", "name", productSupplier.product_id)}
        </div>
        <div class="mb-3">
            <label>Supplier</label>
            ${createSelect("supplier-id", suppliers, "supplier_id", "name", productSupplier.supplier_id)}
        </div>
    `;

    document.getElementById("blank-modal-footer").innerHTML = `
        <button class="btn btn-primary w-100">${id ? "Update" : "Save"}</button>
        <button type="button" class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>
    `;

document.querySelector("#blank-modal-footer .btn-primary").addEventListener("click", async () => {
    let formData = {
        productId: document.getElementById("product-id").value,
        supplierId: document.getElementById("supplier-id").value
    };
    if (id) formData.id = id;

    const data = new FormData();
    data.append("operation", id ? "updateAssignment" : "insertAssignment");
    data.append("json", JSON.stringify(formData));

    const response = await axios.post(`${sessionStorage.baseAPIUrl}/supplier_ass.php`, data);

    if (response.data == 1) {
        alert(id ? "Updated successfully!" : "Inserted successfully!");
        myModal.hide();
        refreshDisplay();
    } else if (response.data == -1) {
        alert("This product already has this supplier assigned!");
    } else {
        alert("Error saving record!");
    }
});


    myModal.show();
};

// ✅ Fetch a single product-supplier assignment
// In supplier_ass.js


// In supplier_ass_modal.js
const getAssignment = async (id) => {
    const res = await axios.get(`${sessionStorage.baseAPIUrl}/supplier_ass.php`, {
        params: { operation: "getAssignment", json: JSON.stringify({ id }) }
    });
    return res.data[0] || {};
};

const getProducts = async () => {
    const res = await axios.get(`${sessionStorage.baseAPIUrl}/product.php`, {
        params: { operation: "getProducts" }
    });
    return Array.isArray(res.data) ? res.data : [];
};

const getSuppliers = async () => {
    const res = await axios.get(`${sessionStorage.baseAPIUrl}/suppliers.php`, {
        params: { operation: "getAllSuppliers" }
    });
    // Only include active suppliers
    return Array.isArray(res.data) ? res.data.filter(s => s.is_active == 1) : [];
};

// ✅ Generate dropdown HTML
const createSelect = (id, data, valueKey, textKey, selectedValue) => {
    let html = `<select id="${id}" class="form-select">`;
    data.forEach(item => {
        let selected = item[valueKey] == selectedValue ? "selected" : "";
        html += `<option value="${item[valueKey]}" ${selected}>${item[textKey]}</option>`;
    });
    html += "</select>";
    return html;
};
