/**
 * Admin Panel JavaScript untuk Graha Advertising
 * File ini berisi semua fungsi yang berhubungan dengan panel admin
 */

import { showNotification } from "./ui.js"

// DOM Elements
const sidebarLinks = document.querySelectorAll("a[data-section]")
const sections = document.querySelectorAll('section[id$="-section"]')
const pageTitle = document.getElementById("page-title")
const sidebarToggle = document.getElementById("sidebar-toggle")
const mobileSidebarOverlay = document.getElementById("mobile-sidebar-overlay")
const closeSidebar = document.getElementById("close-sidebar")
const adminName = document.getElementById("admin-name")

/**
 * Fungsi untuk menampilkan section yang dipilih dan menyembunyikan yang lain
 * @param {string} sectionId - ID section yang akan ditampilkan
 */
function showSection(sectionId) {
  // Sembunyikan semua section
  sections.forEach((section) => {
    section.classList.add("hidden")
  })

  // Tampilkan section yang dipilih
  const selectedSection = document.getElementById(`${sectionId}-section`)
  if (selectedSection) {
    selectedSection.classList.remove("hidden")
  }

  // Update page title
  if (pageTitle) {
    pageTitle.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1)
  }

  // Update active link di sidebar
  sidebarLinks.forEach((link) => {
    if (link.dataset.section === sectionId) {
      link.classList.add("bg-primary", "text-white")
      link.classList.remove("hover:bg-gray-800")
    } else {
      link.classList.remove("bg-primary", "text-white")
      link.classList.add("hover:bg-gray-800")
    }
  })

  // Tutup sidebar mobile jika terbuka
  if (mobileSidebarOverlay) {
    mobileSidebarOverlay.classList.add("hidden")
  }
}

/**
 * Fungsi untuk logout admin
 * @param {Event} event - Event dari klik tombol logout
 */
function logoutAdmin(event) {
  event.preventDefault()

  // Hapus token dan data admin dari localStorage
  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")
  localStorage.removeItem("userRole")

  // Tampilkan notifikasi
  showNotification("Anda telah berhasil keluar.")

  // Redirect ke halaman login
  setTimeout(() => {
    window.location.href = "index.html"
  }, 1500)
}

/**
 * Fungsi untuk memeriksa apakah user memiliki akses admin
 * @returns {boolean} - true jika user adalah admin, false jika bukan
 */
function checkAdminAccess() {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")
  const userRole = userData.role || localStorage.getItem("userRole")

  if (!userRole || userRole !== "admin") {
    showNotification("Anda tidak memiliki akses ke halaman ini.", true)
    setTimeout(() => {
      window.location.href = "index.html"
    }, 1500)
    return false
  }

  return true
}

/**
 * Fungsi untuk mengatur data admin pada halaman
 */
function setupAdminData() {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")

  if (adminName && userData.name) {
    adminName.textContent = userData.name
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Cek akses admin
  if (!checkAdminAccess()) return

  // Setup data admin
  setupAdminData()

  // Default section
  showSection("dashboard")

  // Sidebar links
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const section = link.dataset.section
      showSection(section)
    })
  })

  // Mobile sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      mobileSidebarOverlay.classList.remove("hidden")
    })
  }

  // Close mobile sidebar
  if (closeSidebar) {
    closeSidebar.addEventListener("click", () => {
      mobileSidebarOverlay.classList.add("hidden")
    })
  }

  // Close mobile sidebar when clicking outside
  if (mobileSidebarOverlay) {
    mobileSidebarOverlay.addEventListener("click", (e) => {
      if (e.target === mobileSidebarOverlay) {
        mobileSidebarOverlay.classList.add("hidden")
      }
    })
  }
})

// Make functions available globally
window.logoutAdmin = logoutAdmin

// Export functions
export { showSection, logoutAdmin, checkAdminAccess }
