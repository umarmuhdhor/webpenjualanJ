/**
 * Auth Service untuk Graha Advertising
 * File ini berisi semua fungsi yang berhubungan dengan autentikasi
 */

import { authAPI } from "./api.js"
const { showNotification, setLoading, showError, hideError } = window.UI;

/**
 * Fungsi untuk login user
 * @param {Event} event - Event dari form submit
 */
async function loginUser(event) {
  event.preventDefault()

  console.log("Login form submitted");

  // Reset error message
  hideError("login")

  // Show loading state
  setLoading("login", true)

  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");

  // Pastikan input ada
  if (!emailInput || !passwordInput) {
    console.error("Login form elements not found");
    showError("login", "Form login tidak ditemukan. Silakan muat ulang halaman.");
    setLoading("login", false);
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validasi input
  if (!email || !password) {
    console.log("Empty email or password", { email, password });
    showError("login", "Email dan kata sandi wajib diisi.");
    setLoading("login", false);
    return;
  }

  // Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log("Invalid email format:", email);
    showError("login", "Email tidak valid.");
    setLoading("login", false);
    return;
  }

  try {
    console.log("Sending login request:", { email });
    const data = await authAPI.login(email, password);
    console.log("Login API response:", data);

    // Simpan token ke localStorage
    localStorage.setItem("authToken", data.token);

    // Simpan role user jika ada
    if (data.role) {
      localStorage.setItem("userRole", data.role);
    }

    // Simpan data user dasar
    const userData = {
      name: data.name || data.user?.name || email.split("@")[0],
      email: email,
      role: data.role || "user",
    };
    localStorage.setItem("userData", JSON.stringify(userData));

    // Tampilkan notifikasi sukses
    showNotification("Login berhasil! Selamat datang kembali.");

    // Tutup modal
    const authModal = document.getElementById("authModal");
    if (authModal) {
      console.log("Closing auth modal");
      authModal.classList.add("hidden");
    } else {
      console.error("Auth modal not found");
    }

    // Update UI untuk user yang sudah login
    updateAuthUI();

    // Reset form
    document.getElementById("loginForm").reset();
  } catch (error) {
    console.error("Login error:", error.message, error.stack);
    showError("login", error.message || "Email atau password salah.");
    showNotification("Login gagal. Silakan coba lagi.", true);
  } finally {
    setLoading("login", false);
  }
}

/**
 * Fungsi untuk register user
 * @param {Event} event - Event dari form submit
 */
async function registerUser(event) {
  event.preventDefault()

  // Reset error message
  hideError("register")

  // Show loading state
  setLoading("register", true)

  const name = document.getElementById("registerName").value
  const phone_number = document.getElementById("registerPhone").value
  const email = document.getElementById("registerEmail").value
  const password = document.getElementById("registerPassword").value
  const confirm = document.getElementById("registerConfirm").value

  if (!name || !phone_number || !email || !password || !confirm) {
    showError("register", "Semua field wajib diisi.")
    setLoading("register", false)
    return
  }

  if (password !== confirm) {
    showError("register", "Konfirmasi password tidak cocok.")
    setLoading("register", false)
    return
  }

  if (password.length < 6) {
    showError("register", "Password minimal 16 karakter.")
    setLoading("register", false)
    return
  }

  try {
    const userData = {
      name,
      phone_number,
      email,
      password,
    }

    const response = await authAPI.register(userData)

    // Tampilkan notifikasi sukses
    showNotification("Pendaftaran berhasil! Silakan login.")

    // Reset form
    document.getElementById("registerForm").reset()

    // Switch to login tab
    const loginTab = document.getElementById("loginTab")
    if (loginTab) {
      loginTab.click()
    }
  } catch (error) {
    console.error("Register error:", error)
    showError("register", error.message || "Terjadi kesalahan. Silakan coba lagi.")
    showNotification("Pendaftaran gagal. Silakan coba lagi.", true)
  } finally {
    setLoading("register", false)
  }
}

/**
 * Fungsi untuk logout user
 * @param {Event} event - Event dari klik tombol logout
 */
function logoutUser(event) {
  event.preventDefault()

  // Hapus token dan data user dari localStorage
  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")
  localStorage.removeItem("userRole")

  // Update UI
  updateAuthUI()

  // Tampilkan notifikasi
  showNotification("Anda telah berhasil keluar.")

  // Redirect ke home jika di halaman yang memerlukan login
  if (window.location.pathname.includes("profile") || window.location.pathname.includes("orders")) {
    window.location.href = "index.html"
  }
}
/**
 * Fungsi untuk update UI berdasarkan status login
 * @returns {Promise<void>} Promise yang menyelesaikan setelah UI diperbarui
 */
function updateAuthUI() {
  return new Promise((resolve) => {
    const authToken = localStorage.getItem("authToken");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    // Target container tombol di header
    const authButtonContainer = document.getElementById("auth-button-container");
    const dashboardBtn = document.getElementById("dashboard-btn");
    const cartButton = document.getElementById("cart-button");

    if (authToken && userData.email) {
      // Pengguna sudah login
      if (authButtonContainer) {
        // Kosongkan container
        authButtonContainer.innerHTML = "";
        authButtonContainer.className = "flex items-center space-x-2";

        if (userData.role === "admin") {
          // Tombol untuk admin: Dashboard dan Logout
          const dashboardButton = document.createElement("button");
          dashboardButton.className = "bg-blue-500 text-white border border-blue-500 rounded-md px-4 py-2 flex items-center hover:bg-blue-600";
          dashboardButton.innerHTML = `<i class="ri-dashboard-line mr-2"></i><span>Dashboard</span>`;
          dashboardButton.onclick = () => {
            window.location.href = "admin.html"; // Sesuaikan dengan halaman dashboard
          };

          const logoutButton = document.createElement("button");
          logoutButton.className = "bg-red-500 text-white border border-red-500 rounded-md px-4 py-2 flex items-center hover:bg-red-600";
          logoutButton.innerHTML = `<i class="ri-logout-box-line mr-2"></i><span>Logout</span>`;
          logoutButton.onclick = (e) => {
            e.preventDefault();
            logoutUser(e);
          };

          // Tambahkan tombol ke container
          authButtonContainer.appendChild(dashboardButton);
          authButtonContainer.appendChild(logoutButton);

          // Tampilkan tombol dashboard jika ada
          if (dashboardBtn) {
            dashboardBtn.classList.remove("hidden");
          }
        } else {
          // Tombol untuk user biasa: Profile dan Logout
          const profileButton = document.createElement("button");
          profileButton.className = "bg-white text-primary border border-primary rounded-md px-4 py-2 flex items-center hover:bg-gray-100";
          profileButton.innerHTML = `<i class="ri-user-line mr-2"></i><span>Profile</span>`;
          profileButton.onclick = () => {
            window.location.href = "profile.html";
          };

          const logoutButton = document.createElement("button");
          logoutButton.className = "bg-red-500 text-white border border-red-500 rounded-md px-4 py-2 flex items-center hover:bg-red-600";
          logoutButton.innerHTML = `<i class="ri-logout-box-line mr-2"></i><span>Logout</span>`;
          logoutButton.onclick = (e) => {
            e.preventDefault();
            logoutUser(e);
          };

          // Tambahkan tombol ke container
          authButtonContainer.appendChild(profileButton);
          authButtonContainer.appendChild(logoutButton);

          // Sembunyikan tombol dashboard
          if (dashboardBtn) {
            dashboardBtn.classList.add("hidden");
          }
        }

        // Tampilkan tombol keranjang
        if (cartButton) {
          cartButton.style.display = "flex";
        }
      } else {
        console.error("Kontainer tombol autentikasi tidak ditemukan");
      }
    } else {
      // Pengguna belum login
      if (authButtonContainer) {
        authButtonContainer.innerHTML = "";
        const loginButton = document.createElement("button");
        loginButton.className = "bg-white text-primary border border-primary rounded-md px-4 py-2 flex items-center hover:bg-gray-100";
        loginButton.innerHTML = `<i class="ri-login-box-line mr-2"></i><span>Masuk</span>`;
        loginButton.onclick = () => {
          document.getElementById("authModal").classList.remove("hidden");
        };
        authButtonContainer.appendChild(loginButton);

        // Sembunyikan tombol keranjang dan dashboard
        if (cartButton) {
          cartButton.style.display = "none";
        }
        if (dashboardBtn) {
          dashboardBtn.classList.add("hidden");
        }
      } else {
        console.error("Kontainer tombol autentikasi tidak ditemukan");
      }
    }

    resolve();
  });
}

/**
 * Fungsi untuk check apakah user sudah login
 */
function isLoggedIn() {
  const authToken = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")
  return authToken && userData
}

/**
 * Fungsi untuk get user data
 */
function getCurrentUser() {
  if (isLoggedIn()) {
    return JSON.parse(localStorage.getItem("userData"))
  }
  return null
}

/**
 * Fungsi untuk protect halaman yang memerlukan login
 */
function requireAuth() {
  if (!isLoggedIn()) {
    showNotification("Silakan login terlebih dahulu.", true)
    setTimeout(() => {
      window.location.href = "index.html"
    }, 1500)
    return false
  }
  return true
}

// Initialize Auth Modal dan Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing auth.js"); // Log untuk debugging

  const authModal = document.getElementById("authModal");
  const closeModalBtn = document.getElementById("closeModal");
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  // Log untuk memastikan elemen ditemukan
  console.log("Elements found:", {
    authModal: !!authModal,
    closeModalBtn: !!closeModalBtn,
    loginTab: !!loginTab,
    registerTab: !!registerTab,
    loginForm: !!loginForm,
    registerForm: !!registerForm,
  });

  // Close modal when clicking close button
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Close modal button clicked");
      authModal.classList.add("hidden");
    });
  } else {
    console.error("Close modal button not found");
  }

  // Close modal when clicking outside
  if (authModal) {
    authModal.addEventListener("click", (e) => {
      if (e.target === authModal) {
        console.log("Clicked outside modal, closing");
        authModal.classList.add("hidden");
      }
    });
  } else {
    console.error("Auth modal not found");
  }

  // Toggle tab form
  if (loginTab && registerTab) {
    loginTab.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Switching to login tab");
      loginTab.classList.add("border-primary", "text-primary");
      loginTab.classList.remove("text-gray-500");
      registerTab.classList.remove("border-primary", "text-primary");
      registerTab.classList.add("text-gray-500");

      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");

      hideError("login");
      hideError("register");
    });

    registerTab.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Switching to register tab");
      registerTab.classList.add("border-primary", "text-primary");
      registerTab.classList.remove("text-gray-500");
      loginTab.classList.remove("border-primary", "text-primary");
      loginTab.classList.add("text-gray-500");

      registerForm.classList.remove("hidden");
      loginForm.classList.add("hidden");

      hideError("login");
      hideError("register");
    });
  } else {
    console.error("Login or register tab not found");
  }

  // Add form submit event listeners
  if (loginForm) {
    loginForm.addEventListener("submit", loginUser);
    console.log("Login form event listener attached");
  } else {
    console.error("Login form not found");
  }

  if (registerForm) {
    registerForm.addEventListener("submit", registerUser);
    console.log("Register form event listener attached");
  } else {
    console.error("Register form not found");
  }

  // Update UI saat halaman dimuat
  updateAuthUI();

  // Mobile menu toggle
  const mobileMenuButton = document.querySelector(".md\\:hidden .ri-menu-line");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () => {
      console.log("Toggling mobile menu");
      mobileMenu.classList.toggle("hidden");
    });
  }
});

// Make functions available globally for onclick handlers
window.logoutUser = logoutUser
window.updateAuthUI = updateAuthUI

// Export fungsi-fungsi auth
export { loginUser, registerUser, logoutUser, updateAuthUI, isLoggedIn, getCurrentUser, requireAuth }