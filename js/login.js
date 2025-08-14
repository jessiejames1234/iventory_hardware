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

    if (res.data.status === "success") {
      // Store user info
        sessionStorage.setItem("user", JSON.stringify({
        user_id: res.data.user_id,
        staff_id: res.data.staff_id,
        name: res.data.name,
        role: res.data.role
        }));


      // role
      if (res.data.role === "admin") {
        window.location.href = "dashboard/staff_management.html";
      } else if (res.data.role === "staff") {
        window.location.href = "dashboard/pos.html";
      } else {
        errorDiv.textContent = "Invalid role assigned.";
      }
    } else {
      errorDiv.textContent = res.data.message;
    }
  } catch (err) {
    errorDiv.textContent = "Something went wrong.";
    console.error(err);
  }
};
