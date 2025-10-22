import { checkAuth, logout } from "./auth.js";

  const user = checkAuth(); // 🔐 Redirects if not logged in
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
  sessionStorage.setItem("baseAPIUrl", baseApiUrl);

  document.addEventListener("DOMContentLoaded", () => {
    // 👤 Display logged-in user
    document.getElementById("logged-user").textContent = user.name;

    // 🚪 Logout
    document.getElementById("btn-logout").addEventListener("click", logout);

  });
