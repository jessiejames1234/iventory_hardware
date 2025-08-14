export const stockOutModal = async (refreshDisplay, staffId, baseApiUrl) => {
    const myModal = new bootstrap.Modal(document.getElementById("blank-modal"));
    document.getElementById("blank-modal-title").innerText = "Stock Out Product";

    try {
        // Fetch products only
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
