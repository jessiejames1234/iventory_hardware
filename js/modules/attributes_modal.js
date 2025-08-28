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
        if (!name) return alert("Name is required!");

        const formData = new FormData();
        formData.append("operation", `insert${capitalize(type)}`);
        formData.append("json", JSON.stringify({ name }));

        const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";

        try {
            const res = await axios.post(`${baseApiUrl}/attributes.php`, formData);
            if (res.data.status === "success") {
                alert(`${capitalize(type)} added successfully!`);
                refreshTable();
                myModal.hide();
            } else {
                alert(res.data.message || "Failed to insert.");
            }
        } catch (err) {
            console.error(err);
            alert("Error inserting data!");
        }
    });

    myModal.show();
};

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);