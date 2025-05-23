/**
 * ui.js - File untuk menangani UI components
 */

// Fungsi untuk menampilkan notifikasi
function showNotification(message, isError = false) {
  const notification = document.getElementById("notification")
  if (!notification) return

  notification.textContent = message
  notification.classList.remove("opacity-0", "pointer-events-none", "bg-green-500", "bg-red-500")
  notification.classList.add("opacity-100", isError ? "bg-red-500" : "bg-green-500")

  setTimeout(() => {
    notification.classList.add("opacity-0")
    notification.classList.add("pointer-events-none")
  }, 3000) // muncul 3 detik lalu hilang
}

// Fungsi untuk menampilkan loading state pada tombol
function setLoading(formId, isLoading) {
  const btnText = document.getElementById(`${formId}BtnText`)
  const loading = document.getElementById(`${formId}Loading`)

  if (btnText && loading) {
    if (isLoading) {
      btnText.classList.add("invisible")
      loading.classList.remove("hidden")
    } else {
      btnText.classList.remove("invisible")
      loading.classList.add("hidden")
    }
  }
}

// Fungsi untuk menampilkan error message
function showError(formId, message) {
  const errorElement = document.getElementById(`${formId}Error`)
  if (errorElement) {
    errorElement.textContent = message
    errorElement.classList.remove("hidden")
  }
}

// Fungsi untuk menyembunyikan error message
function hideError(formId) {
  const errorElement = document.getElementById(`${formId}Error`)
  if (errorElement) {
    errorElement.classList.add("hidden")
  }
}

// Fungsi untuk toggle mobile menu
function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu")
  if (mobileMenu) {
    mobileMenu.classList.toggle("hidden")
  }
}

// Fungsi untuk initialize UI components
function initUI() {
  // Initialize mobile menu toggle
  const mobileMenuButton = document.querySelector(".md\\:hidden.w-10.h-10")
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", toggleMobileMenu)
  }

  // Close notification when clicked
  const notification = document.getElementById("notification")
  if (notification) {
    notification.addEventListener("click", () => {
      notification.classList.add("opacity-0", "pointer-events-none")
    })
  }

  // Initialize smooth scroll for navigation links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href")

      // Check if it's an anchor link
      if (href.startsWith("#")) {
        e.preventDefault()
        const targetId = href
        const targetSection = document.querySelector(targetId)
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      }
    })
  })
}

// Export UI functions
window.UI = {
  showNotification,
  setLoading,
  showError,
  hideError,
  toggleMobileMenu,
  init: initUI,
}
