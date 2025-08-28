const baseApiUrl = "http://localhost/hardware/api";

window.login = async function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorDiv = document.getElementById("error");

  if (!username || !password) {
    errorDiv.textContent = "Please enter both fields.";
    return;
  }

  try {
    const res = await axios.post(`${baseApiUrl}/login.php`, { username, password });
    const data = res.data;

    if (data.status === "success") {
      // Store user info
      sessionStorage.setItem("user", JSON.stringify({
        user_id: data.user_id,
        staff_id: data.staff_id,
        name: data.name,
        role: data.role,
        assigned_warehouse_id: data.assigned_warehouse_id || null
      }));

      // Redirect by role
      switch (data.role) {
        case "admin":
          window.location.href = "html/product_management.html";
          break;
        case "cashier":
          window.location.href = "html/POS.html";
          break;
        case "warehouse_manager":
          window.location.href = "html/warehouse_management.html";
          break;
        default:
          errorDiv.textContent = "Invalid role assigned.";
      }
    } else {
      errorDiv.textContent = data.message;
    }
  } catch (err) {
    errorDiv.textContent = "Something went wrong.";
    console.error(err);
  }
};
