export const viewProductModal = async (productId) => {
  try {
    const params = {
      operation: "getProduct",
      id: productId
    };

    const response = await axios.get(`${sessionStorage.getItem("baseAPIUrl")}/product.php`, { params });
    if (!response.data) {
      alert("Failed to load product details.");
      return;
    }

    const product = response.data;

    // Prepare modal content
    const modalEl = document.getElementById("blank-modal");
    const modal = new bootstrap.Modal(modalEl, { keyboard: true, backdrop: "static" });

    document.getElementById("blank-modal-title").innerText = "Product Details";

    document.getElementById("blank-main-div").innerHTML = `
      <table class="table table-sm">
        <tr><td>Name</td><td>${product.product_name}</td></tr>
        <tr><td>Model</td><td>${product.model}</td></tr>
        <tr><td>Specs</td><td>${product.specs}</td></tr>
        <tr><td>Warranty</td><td>${product.warranty_period}</td></tr>
        <tr><td>Selling Price</td><td>₱${parseFloat(product.selling_price).toFixed(2)}</td></tr>
        <tr><td>Cost Price</td><td>₱${parseFloat(product.cost_price).toFixed(2)}</td></tr>
        <tr><td>Reorder Level</td><td>${product.reorder_level}</td></tr>
        <tr><td>Category</td><td>${product.category_name}</td></tr>
        <tr><td>Brand</td><td>${product.brand_name}</td></tr>
        <tr><td>Unit</td><td>${product.unit_name ?? "-"}</td></tr>
        <tr><td>Status</td><td>${product.is_active == 1 ? "Active" : "Inactive"}</td></tr>
        <tr><td>Created At</td><td>${product.created_at ?? "-"}</td></tr>
<tr><td>Created By</td><td>${product.created_by_name ?? "-"}</td></tr>
        <tr><td>Updated At</td><td>${product.updated_at ?? "-"}</td></tr>
<tr><td>Updated By</td><td>${product.updated_by_name ?? "-"}</td></tr>

      </table>
    `;

    document.getElementById("blank-modal-footer").innerHTML = `
      <button type="button" class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>
    `;

    modal.show();

  } catch (error) {
    console.error(error);
    alert("Error fetching product details.");
  }
};
