export const showInsertModal = (type, refreshTable) => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"));
  document.getElementById("blank-modal-title").innerText = `Add New ${capitalize(type)}`;
  document.getElementById("blank-main-div").innerHTML = `
    <div class="mb-3">
      <label class="form-label">${capitalize(type)} Name</label>
      <input type="text" id="insert-name" class="form-control" placeholder="Enter ${type} name" />
    </div>
  `;
  const footer = document.getElementById("blank-modal-footer");
  footer.innerHTML = `
    <button class="btn btn-primary w-100 btn-save-insert">Save</button>
    <button class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>
  `;

  footer.querySelector(".btn-save-insert").addEventListener("click", async () => {
    const name = document.getElementById("insert-name").value.trim();
    if (!name) {
      Swal.fire({
        title: "Validation Error",
        text: "Name is required!",
        icon: "warning",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        scrollbarPadding: false
      });
      return;
    }

    const formData = new FormData();
    formData.append("operation", `insert${capitalize(type)}`);
    formData.append("json", JSON.stringify({ name }));

    const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";

    try {
      const res = await axios.post(`${baseApiUrl}/attributes.php`, formData);
      if (res.data.status === "success") {
        Swal.fire({
          title: "Added!",
          text: `${capitalize(type)} added successfully!`,
          icon: "success",
          showConfirmButton: false,
          timer: 1200,
          timerProgressBar: true,
          scrollbarPadding: false
        }).then(() => {
          refreshTable();
          myModal.hide();
        });
      } else {
        Swal.fire({
          title: "Failed",
          text: res.data.message || "Insert failed.",
          icon: "error",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          scrollbarPadding: false
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error",
        text: "Error inserting data!",
        icon: "error",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        scrollbarPadding: false
      });
    }
  });

  myModal.show();
};

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
