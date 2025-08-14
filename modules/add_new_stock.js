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
            addedByStaff: staffId // use the logged-in staff id
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
