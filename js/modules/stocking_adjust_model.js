// stock_modals.js

// ================= Add New Stock Modal =================
export const addNewStockModal = async (refreshDisplay, staffId) => {
    const myModal = new bootstrap.Modal(document.getElementById("blank-modal"));
    document.getElementById("blank-modal-title").innerText = "Add New Stock";

    // Fetch product-supplier assignments
    let products = [];
    try {
        const response = await axios.get(`${sessionStorage.baseAPIUrl}/supplier_ass.php`, {
            params: { operation: "getAllAssignments" }
        });
        products = response.data;
    } catch (err) {
        console.error("Failed to load products:", err);
        alert("Cannot load product-supplier data. Check backend path.");
        return;
    }

    // Modal HTML
    let html = `
        <table class="table table-sm">
            <tr>
                <td>Product - Supplier</td>
                <td>
                    <select id="product-supplier" class="form-select">
                        ${products.map(p => `<option value="${p.product_supplier_id}">${p.product_name} - ${p.supplier_name}</option>`).join('')}
                    </select>
                </td>
            </tr>
            <tr>
                <td>Quantity</td>
                <td><input type="number" id="stock-quantity" class="form-control" /></td>
            </tr>
            <tr>
                <td>Remarks</td>
                <td><input type="text" id="stock-remarks" class="form-control" /></td>
            </tr>
        </table>
    `;
    document.getElementById("blank-main-div").innerHTML = html;

    const modalFooter = document.getElementById("blank-modal-footer");
    modalFooter.innerHTML = `
        <button class="btn btn-primary w-100 btn-save-stock">Save</button>
        <button class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>
    `;

    modalFooter.querySelector(".btn-save-stock").addEventListener("click", async () => {
        const jsonData = {
            productSupplierId: document.getElementById("product-supplier").value,
            quantity: document.getElementById("stock-quantity").value,
            remarks: document.getElementById("stock-remarks").value,
            addedByStaff: staffId
        };

        const formData = new FormData();
        formData.append("operation", "insertStock");
        formData.append("json", JSON.stringify(jsonData));

        try {
            const res = await axios.post(`${sessionStorage.baseAPIUrl}/stock_in.php`, formData);
            if (res.data == 1) {
                refreshDisplay();
                alert("Stock successfully added!");
                myModal.hide();
            } else {
                alert("Error adding stock!");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to add stock. Check backend.");
        }
    });

    myModal.show();
};

// ================= Stock Out Modal =================
export const stockOutModal = async (refreshDisplay, staffId, baseApiUrl) => {
    const myModal = new bootstrap.Modal(document.getElementById("blank-modal"));
    document.getElementById("blank-modal-title").innerText = "Stock Out Product";

    try {
        const response = await axios.get(`${baseApiUrl}/product.php`, {
            params: { operation: "getProducts" }
        });
        const products = Array.isArray(response.data) ? response.data : [];

        if (products.length === 0) {
            document.getElementById("blank-main-div").innerHTML = "<p>No products available.</p>";
            myModal.show();
            return;
        }

        let html = `
            <table class="table table-sm">
                <tr>
                    <td>Product</td>
                    <td>
                        <select id="stockout-product" class="form-select">
                            ${products.map(p => `<option value="${p.product_id}">${p.product_name || p.name}</option>`).join('')}
                        </select>
                    </td>
                </tr>
                <tr>
                    <td>Quantity</td>
                    <td><input type="number" id="stockout-quantity" class="form-control" min="1" /></td>
                </tr>
                <tr>
                    <td>Reason</td>
                    <td><input type="text" id="stockout-reason" class="form-control" /></td>
                </tr>
            </table>
        `;
        document.getElementById("blank-main-div").innerHTML = html;

        const modalFooter = document.getElementById("blank-modal-footer");
        modalFooter.innerHTML = `
            <button class="btn btn-primary w-100 btn-save-stockout">Save</button>
            <button class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>
        `;

        modalFooter.querySelector(".btn-save-stockout").addEventListener("click", async () => {
            const quantity = parseInt(document.getElementById("stockout-quantity").value, 10);
            if (!quantity || quantity <= 0) {
                alert("Quantity must be greater than 0.");
                return;
            }

            const jsonData = {
                productId: document.getElementById("stockout-product").value,
                quantity,
                reason: document.getElementById("stockout-reason").value,
                removedByStaff: staffId
            };

            const formData = new FormData();
            formData.append("operation", "insertStockOut");
            formData.append("json", JSON.stringify(jsonData));

            try {
                const res = await axios.post(`${baseApiUrl}/stock_out.php`, formData);
                if (res.data == 1) {
                    refreshDisplay();
                    alert("Stock successfully removed!");
                    myModal.hide();
                } else {
                    alert("Error removing stock!");
                }
            } catch (err) {
                console.error(err);
                alert("Failed to remove stock!");
            }
        });

        myModal.show();
    } catch (err) {
        console.error(err);
        alert("Failed to load products!");
    }
};

// ================= Purchase Return Modal =================
export const purchaseReturnModal = async (refreshDisplay, staffId, baseApiUrl) => {
    const myModal = new bootstrap.Modal(document.getElementById("blank-modal"));
    document.getElementById("blank-modal-title").innerText = "Purchase Return";

    // Fetch product-supplier assignments
    const response = await axios.get(`${baseApiUrl}/supplier_ass.php`, {
        params: { operation: "getAllAssignments" }
    });
    const assignments = response.data;

    let html = `
        <table class="table table-sm">
            <tr>
                <td>Product - Supplier</td>
                <td>
                    <select id="return-product-supplier" class="form-select">
                        ${assignments.map(a => `<option value="${a.product_supplier_id}">${a.product_name} - ${a.supplier_name}</option>`).join('')}
                    </select>
                </td>
            </tr>
            <tr>
                <td>Quantity</td>
                <td><input type="number" id="return-quantity" class="form-control"/></td>
            </tr>
            <tr>
                <td>Reason</td>
                <td><input type="text" id="return-reason" class="form-control"/></td>
            </tr>
        </table>
    `;
    document.getElementById("blank-main-div").innerHTML = html;

    const modalFooter = document.getElementById("blank-modal-footer");
    modalFooter.innerHTML = `
        <button class="btn btn-primary w-100 btn-save-return">Save</button>
        <button class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>
    `;

    modalFooter.querySelector(".btn-save-return").addEventListener("click", async () => {
        const jsonData = {
            productSupplierId: document.getElementById("return-product-supplier").value,
            quantity: parseInt(document.getElementById("return-quantity").value) || 0,
            reason: document.getElementById("return-reason").value,
            returnedBy: staffId
        };

        const formData = new FormData();
        formData.append("operation", "insertReturn");
        formData.append("json", JSON.stringify(jsonData));

        try {
            const res = await axios.post(`${baseApiUrl}/purchasereturn.php`, formData);
            if (res.data.success == 1) {
                refreshDisplay();
                alert("Return recorded successfully!");
                myModal.hide();
            } else {
                console.error(res.data.error);
                alert("Failed to record return: " + (res.data.error || ""));
            }
        } catch (err) {
            console.error(err);
            alert("Error processing return!");
        }
    });

    myModal.show();
};
