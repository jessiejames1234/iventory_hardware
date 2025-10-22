export const checkAuth = () => {
  const user = JSON.parse(sessionStorage.getItem("user"));

  if (!user) {
    window.location.href = "../index.html"; // not logged in
  }

  return user;
};

export const logout = async () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  await axios.post(`${sessionStorage.baseAPIUrl}/logout.php`, { staff_id: user.staff_id });

  sessionStorage.clear();

  Swal.fire({
    title: "Logged Out",
    text: "You have been successfully logged out.",
    icon: "success",
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
    scrollbarPadding: false
  }).then(() => {
    window.location.href = "../index.html";
  });
};

export const requireRole = (allowedRoles = []) => {
  const user = checkAuth();

  if (!allowedRoles.includes(user.role)) {
    // 🚫 Unauthorized → send back to last page
    const lastPage = sessionStorage.getItem("lastPage");

    if (lastPage && lastPage !== window.location.href) {
      window.location.href = lastPage;
    } else {
      history.back(); // try browser history
    }
  }

  return user; // ✅ stays if allowed
};
