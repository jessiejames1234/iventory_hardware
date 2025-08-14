export const checkAuth = () => {
  const user = JSON.parse(sessionStorage.getItem("user"));

  if (!user) {
    window.location.href = "../index.html"; // or adjust if needed
  }

  return user;
};

export const logout = async () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  await axios.post(`${sessionStorage.baseAPIUrl}/logout.php`, { staff_id: user.staff_id });

  sessionStorage.clear();
  window.location.href = "../index.html";
};

