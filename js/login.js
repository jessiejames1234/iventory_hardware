const baseApiUrl = "http://localhost/hardware/api";

window.login = async function () {
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");

  const username = usernameEl.value.trim();
  const password = passwordEl.value.trim();

  // Reset borders
  usernameEl.classList.remove("input-error", "input-success");
  passwordEl.classList.remove("input-error", "input-success");

  let hasError = false;
  if (!username) { usernameEl.classList.add("input-error"); hasError = true; }
  if (!password) { passwordEl.classList.add("input-error"); hasError = true; }

  if (hasError) {
    Swal.fire({
      title: "Missing Fields",
      text: "Please fill out all fields.",
            toast: true,                   // ✅ make it a toast
      position: 'top-end',           // ✅ top-right corner
      icon: "warning",
      timer: 3000,
      showConfirmButton: false, 
      timerProgressBar: true,
      scrollbarPadding: false,
      backdrop: false
    });
    return;
  }

  try {
    const res = await axios.post(`${baseApiUrl}/login.php`, { username, password });
    const data = res.data;

    if (data.status === "success") {
      usernameEl.classList.add("input-success");
      passwordEl.classList.add("input-success");

const cleanRole = String(data.role || "")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "_");

sessionStorage.setItem("user", JSON.stringify({
  user_id: data.user_id,
  staff_id: data.staff_id,
  name: data.name,
  role: cleanRole,
  assigned_location_id: data.assigned_location_id || null,
  assigned_location_name: data.assigned_location_name || null
}));


      Swal.fire({
        title: "Welcome!",
        text: `Welcome back, ${data.name}!`,
              toast: true,                   // ✅ make it a toast
      position: 'top-end',           // ✅ top-right corner
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
        timerProgressBar: true,
        scrollbarPadding: false,
        backdrop: false
      }).then(() => {
        switch (data.role) {
          case "admin":
            window.location.href = "html/dashboard_store.html";
            break;
          case "cashier":
            window.location.href = "html/select_terminal.html";
            break;
          case "warehouse_manager":
            window.location.href = "html/purchase_order.html";
            break;
          case "store_clerk":
            window.location.href = "html/stock_adjustment_store.html";
            break;
          case "warehouse_clerk":
            window.location.href = "html/purchase_order.html";
            break;
          default:
            Swal.fire({
              title: "Invalid Role",
              text: "This account does not have a valid role assigned.",
                    toast: true,                   // ✅ make it a toast
      position: 'top-end',           // ✅ top-right corner
              icon: "error",
              confirmButtonText: "OK",
              scrollbarPadding: false,
              backdrop: false
            });
        }
      });
    } else {
      usernameEl.classList.add("input-error");
      passwordEl.classList.add("input-error");

      Swal.fire({
        title: "Login Failed",
        text: data.message || "Invalid username or password.",
              toast: true,                   // ✅ make it a toast
      position: 'top-end',           // ✅ top-right corner
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
        timerProgressBar: true,
        scrollbarPadding: false,
        backdrop: false
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      title: "Error",
      text: "Something went wrong. Please try again.",
            toast: true,                   // ✅ make it a toast
      position: 'top-end',           // ✅ top-right corner
      icon: "error",
      timer: 3000,
      showConfirmButton: false,
      timerProgressBar: true,
      scrollbarPadding: false,
      backdrop: false
    });
  }
};

// Remove red border when typing
document.addEventListener("DOMContentLoaded", () => {
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");
  [usernameEl, passwordEl].forEach(el => {
    el.addEventListener("input", () => {
      usernameEl.classList.remove("input-error");
      passwordEl.classList.remove("input-error");
    });
  });
});
