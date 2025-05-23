// Fungsi untuk menampilkan notifikasi
function showNotification(message, isError = false) {
  const notification = document.getElementById("notification")
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

// Fungsi login
async function loginUser(event) {
  event.preventDefault()

  // Reset error message
  hideError("login")

  // Show loading state
  setLoading("login", true)

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  if (!email || !password) {
    showError("login", "Email dan kata sandi wajib diisi.")
    setLoading("login", false)
    return
  }

  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Login gagal. Silakan coba lagi.")
    }

    // Simpan token atau data user ke localStorage
    localStorage.setItem("authToken", data.token)
    localStorage.setItem("userData", JSON.stringify(data.user))

    // Tampilkan notifikasi sukses
    showNotification("Login berhasil! Selamat datang kembali.")

    // Tutup modal
    document.getElementById("authModal").classList.add("hidden")

    // Update UI untuk user yang sudah login
    updateAuthUI()
  } catch (error) {
    console.error("Login error:", error)
    showError("login", error.message || "Terjadi kesalahan. Silakan coba lagi.")
    showNotification("Login gagal. Silakan coba lagi.", true)
  } finally {
    setLoading("login", false)
  }
}

// Fungsi register
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

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone_number,
        email,
        password,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Pendaftaran gagal. Silakan coba lagi.")
    }

    // Tampilkan notifikasi sukses
    showNotification("Pendaftaran berhasil! Silakan login.")

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

// Mapping produk dan bahan
const productMaterials = {
  Kaos: ["Cotton Combed 24s", "Cotton Bamboo", "Cotton Carded"],
  Jaket: ["Baby Terry", "Fleece", "Parasut"],
  Kemeja: ["Oxford", "American Drill", "Canvas"],
  Jersey: ["Dry Fit", "Hyget", "Paragon"],
  "Kaos Polo": ["Lacoste CVC", "Lacoste PE"],
  Hoodie: ["Fleece", "Cotton Fleece"],
}

// Inisialisasi dropdown produk dan bahan
document.addEventListener("DOMContentLoaded", () => {
  const productSelect = document.getElementById("product-select")
  const materialSelect = document.getElementById("material-select")

  if (productSelect && materialSelect) {
    productSelect.addEventListener("change", function () {
      const selectedProduct = this.value
      materialSelect.innerHTML = '<option value="">-- Pilih Bahan --</option>' // Reset pilihan bahan

      if (selectedProduct && productMaterials[selectedProduct]) {
        productMaterials[selectedProduct].forEach((material) => {
          const option = document.createElement("option")
          option.value = material
          option.textContent = material
          materialSelect.appendChild(option)
        })
        materialSelect.disabled = false // Aktifkan dropdown bahan
      } else {
        materialSelect.disabled = true // Nonaktifkan dropdown jika tidak ada produk yang dipilih
      }
    })
  }
})

// Fungsi pesan produk
function pesanProduk(namaProduk, daftarBahan) {
  window.location.href = `product-detail.html?product=${encodeURIComponent(namaProduk)}`
}

// Fungsi untuk mendapatkan bahan yang dipilih
function getSelectedBahan(selectId) {
  const select = document.getElementById(selectId)
  return [select.value] // return dalam bentuk array
}

// Auth Modal
document.addEventListener("DOMContentLoaded", () => {
  const authModal = document.getElementById("authModal")
  const openModalBtn = document.querySelector("button.bg-white.text-primary.border") // tombol Masuk di header
  const closeModalBtn = document.getElementById("closeModal")
  const loginTab = document.getElementById("loginTab")
  const registerTab = document.getElementById("registerTab")
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")

  if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
      authModal.classList.remove("hidden")
    })
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      authModal.classList.add("hidden")
    })
  }

  // Toggle tab form
  if (loginTab && registerTab) {
    loginTab.addEventListener("click", () => {
      loginTab.classList.add("border-primary", "text-primary")
      loginTab.classList.remove("text-gray-500")
      registerTab.classList.remove("border-primary", "text-primary")
      registerTab.classList.add("text-gray-500")

      loginForm.classList.remove("hidden")
      registerForm.classList.add("hidden")
    })

    registerTab.addEventListener("click", () => {
      registerTab.classList.add("border-primary", "text-primary")
      registerTab.classList.remove("text-gray-500")
      loginTab.classList.remove("border-primary", "text-primary")
      loginTab.classList.add("text-gray-500")

      registerForm.classList.remove("hidden")
      loginForm.classList.add("hidden")
    })
  }
})

// Fungsi untuk update UI berdasarkan status login
function updateAuthUI() {
  const authToken = localStorage.getItem("authToken")
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")

  const loginButtons = document.querySelectorAll("button.bg-white.text-primary.border")
  const userMenus = document.querySelectorAll(".user-menu")

  if (authToken) {
    // User sudah login
    loginButtons.forEach((button) => {
      button.innerHTML = `
        <div class="flex items-center">
          <i class="ri-user-line mr-2"></i>
          <span>${userData.name || "Akun Saya"}</span>
        </div>
      `
      button.onclick = function (e) {
        e.preventDefault()
        // Toggle dropdown menu user
        const userMenu = this.nextElementSibling
        if (userMenu && userMenu.classList.contains("user-menu")) {
          userMenu.classList.toggle("hidden")
        }
      }
    })

    // Tambahkan dropdown menu user jika belum ada
    loginButtons.forEach((button) => {
      let userMenu = button.nextElementSibling
      if (!userMenu || !userMenu.classList.contains("user-menu")) {
        userMenu = document.createElement("div")
        userMenu.className = "user-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden"
        userMenu.innerHTML = `
          <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profil Saya</a>
          <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Pesanan Saya</a>
          <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onclick="logoutUser(event)">Keluar</a>
        `
        button.parentNode.appendChild(userMenu)
      }
    })
  } else {
    // User belum login
    loginButtons.forEach((button) => {
      button.textContent = "Masuk"
      button.onclick = () => {
        document.getElementById("authModal").classList.remove("hidden")
      }
    })

    // Hapus dropdown menu user jika ada
    userMenus.forEach((menu) => {
      menu.remove()
    })
  }
}

// Fungsi logout
function logoutUser(event) {
  event.preventDefault()

  // Hapus token dan data user dari localStorage
  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")

  // Update UI
  updateAuthUI()

  // Tampilkan notifikasi
  showNotification("Anda telah berhasil keluar.")
}

// Size Chart Toggle
document.addEventListener("DOMContentLoaded", () => {
  const cmBtn = document.getElementById("cm-btn")
  const inchBtn = document.getElementById("inch-btn")
  const sizeChartCm = document.getElementById("size-chart-cm")
  const sizeChartInch = document.getElementById("size-chart-inch")

  if (cmBtn && inchBtn) {
    cmBtn.addEventListener("click", () => {
      cmBtn.classList.add("bg-primary", "text-white")
      cmBtn.classList.remove("text-gray-700")
      inchBtn.classList.remove("bg-primary", "text-white")
      inchBtn.classList.add("text-gray-700")
      sizeChartCm.classList.remove("hidden")
      sizeChartInch.classList.add("hidden")
    })

    inchBtn.addEventListener("click", () => {
      inchBtn.classList.add("bg-primary", "text-white")
      inchBtn.classList.remove("text-gray-700")
      cmBtn.classList.remove("bg-primary", "text-white")
      cmBtn.classList.add("text-gray-700")
      sizeChartInch.classList.remove("hidden")
      sizeChartCm.classList.add("hidden")
    })
  }
})

// Form Pemesanan
document.addEventListener("DOMContentLoaded", () => {
  const sizeInputs = ["size-s", "size-m", "size-l", "size-xl", "size-xxl"]
  const quantityInput = document.getElementById("quantity-input")
  const sizeWarning = document.getElementById("size-warning")
  const hitungButton = document.getElementById("hitung-harga-btn")
  const productSelect = document.getElementById("product-select")
  const unitPriceElem = document.getElementById("unit-price")
  const subtotalElem = document.getElementById("subtotal")
  const totalPriceElem = document.getElementById("total-price")

  // Format angka jadi format Rupiah (e.g. Rp 1.000.000)
  function formatRupiah(number) {
    return "Rp " + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  // Hitung total quantity dari input ukuran dan validasi minimal 12 pcs
  function updateTotalQuantity() {
    let total = 0
    sizeInputs.forEach((id) => {
      const el = document.getElementById(id)
      if (el) {
        const value = Number.parseInt(el.value) || 0
        total += value
      }
    })

    if (quantityInput) {
      if (total < 12) {
        quantityInput.value = 12
        if (sizeWarning) sizeWarning.style.display = "block"
        quantityInput.setCustomValidity("Minimal pemesanan adalah 12 pcs.")
      } else {
        quantityInput.value = total
        if (sizeWarning) sizeWarning.style.display = "none"
        quantityInput.setCustomValidity("")
      }
      quantityInput.reportValidity()

      // Update elemen display jumlah di UI
      const displayQuantity = document.getElementById("display-quantity")
      if (displayQuantity) {
        displayQuantity.textContent = total + " pcs"
      }
    }
  }

  // Update harga satuan tampil di UI saat produk dipilih
  function updateUnitPrice() {
    if (productSelect && unitPriceElem) {
      const hargaSatuan = Number.parseInt(productSelect.value)
      unitPriceElem.textContent = formatRupiah(hargaSatuan)
    }
  }

  // Kalkulasi subtotal, diskon, dan total harga
  function calculatePrice() {
    if (productSelect && quantityInput && subtotalElem && totalPriceElem) {
      const hargaSatuan = Number.parseInt(productSelect.value)
      const jumlah = Number.parseInt(quantityInput.value)

      const subtotal = hargaSatuan * jumlah
      const total = subtotal

      subtotalElem.textContent = formatRupiah(subtotal)
      totalPriceElem.textContent = formatRupiah(total)
    }
  }

  // Event listener untuk input ukuran, otomatis update total quantity dan validasi
  sizeInputs.forEach((id) => {
    const input = document.getElementById(id)
    if (input) {
      input.addEventListener("input", () => {
        updateTotalQuantity()
      })
    }
  })

  // Update harga satuan dan kalkulasi harga saat produk diganti
  if (productSelect) {
    productSelect.addEventListener("change", () => {
      updateUnitPrice()
      calculatePrice()
    })
  }

  // Tombol hitung harga: validasi total ukuran tidak melebihi jumlah & jumlah minimal
  if (hitungButton) {
    hitungButton.addEventListener("click", (e) => {
      const totalUkuran = sizeInputs.reduce((sum, id) => {
        const val = Number.parseInt(document.getElementById(id)?.value) || 0
        return sum + val
      }, 0)

      const jumlah = Number.parseInt(quantityInput?.value)

      if (jumlah < 12) {
        alert("Minimal pemesanan adalah 12 pcs.")
        e.preventDefault()
        return
      }

      if (totalUkuran > jumlah) {
        alert("Jumlah total ukuran tidak boleh melebihi jumlah yang dipesan.")
        e.preventDefault()
        return
      }

      // Jika valid, hitung harga
      calculatePrice()
    })
  }

  // Inisialisasi saat halaman dimuat
  updateTotalQuantity()
  updateUnitPrice()
  calculatePrice()
})

// Cart functionality
document.addEventListener("DOMContentLoaded", () => {
  const cart = []
  const cartModal = document.getElementById("cart-modal")
  const cartButton = document.getElementById("cart-button")
  const closeCart = document.getElementById("close-cart")
  const cartItems = document.getElementById("cart-items")
  const cartCount = document.getElementById("cart-count")
  const cartSubtotal = document.getElementById("cart-subtotal")
  const cartDiscount = document.getElementById("cart-discount")
  const cartTotal = document.getElementById("cart-total")
  const successModal = document.getElementById("success-modal")
  const continueShoppingBtn = document.getElementById("continue-shopping")
  const viewCartBtn = document.getElementById("view-cart")
  const checkoutButton = document.getElementById("checkout-button")

  function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    if (cartCount) cartCount.textContent = totalItems
  }

  function calculateDiscount(total, quantity) {
    let discountPercentage = 0
    if (quantity >= 120) discountPercentage = 12
    else if (quantity > 90) discountPercentage = 9
    else if (quantity > 60) discountPercentage = 6
    else if (quantity > 30) discountPercentage = 3
    return (total * discountPercentage) / 100
  }

  function updateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)
    const discount = calculateDiscount(subtotal, totalQuantity)
    const total = subtotal - discount

    if (cartSubtotal) cartSubtotal.textContent = `Rp ${subtotal.toLocaleString("id-ID")}`
    if (cartDiscount) cartDiscount.textContent = `Rp ${discount.toLocaleString("id-ID")}`
    if (cartTotal) cartTotal.textContent = `Rp ${total.toLocaleString("id-ID")}`
  }

  function updateCartDisplay() {
    if (!cartItems) return

    cartItems.innerHTML = ""
    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="ri-shopping-cart-line ri-3x mb-3"></i>
          <p>Keranjang belanja kosong</p>
        </div>
      `
    } else {
      cart.forEach((item, index) => {
        const itemElement = document.createElement("div")
        itemElement.className = "flex items-center gap-4 border-b pb-4"
        itemElement.innerHTML = `
          <div class="w-20 h-20 bg-gray-100 rounded overflow-hidden">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
          </div>
          <div class="flex-1">
            <h4 class="font-medium">${item.name}</h4>
            <p class="text-sm text-gray-500">Ukuran: ${item.size}</p>
            <div class="flex items-center mt-2">
              <button class="decrease-quantity w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center" data-index="${index}">
                <i class="ri-subtract-line"></i>
              </button>
              <span class="mx-3">${item.quantity}</span>
              <button class="increase-quantity w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center" data-index="${index}">
                <i class="ri-add-line"></i>
              </button>
              <span class="ml-auto">Rp ${(item.price * item.quantity).toLocaleString("id-ID")}</span>
            </div>
          </div>
          <button class="remove-item text-gray-400 hover:text-red-500" data-index="${index}">
            <i class="ri-delete-bin-line"></i>
          </button>
        `
        cartItems.appendChild(itemElement)
      })
    }
    updateCartCount()
    updateCartTotals()
  }

  function addToCart(product) {
    // Check if cart exists
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    // Add product to cart
    cart.push(product)

    // Save cart
    localStorage.setItem("cart", JSON.stringify(cart))

    // Update cart count
    const cartCount = document.getElementById("cart-count")
    if (cartCount) {
      cartCount.textContent = cart.length
    }

    // Show notification
    showNotification("Produk ditambahkan ke keranjang")

    // Show success modal
    const successModal = document.getElementById("success-modal")
    if (successModal) {
      successModal.classList.remove("hidden")
    }
  }

  function showSuccessModal() {
    if (successModal) successModal.classList.remove("hidden")
  }

  function hideSuccessModal() {
    if (successModal) successModal.classList.add("hidden")
  }

  // Event Listeners
  if (cartButton) {
    cartButton.addEventListener("click", () => {
      if (cartModal) cartModal.classList.remove("hidden")
    })
  }

  if (closeCart) {
    closeCart.addEventListener("click", () => {
      if (cartModal) cartModal.classList.add("hidden")
    })
  }

  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", hideSuccessModal)
  }

  if (viewCartBtn) {
    viewCartBtn.addEventListener("click", () => {
      hideSuccessModal()
      if (cartModal) cartModal.classList.remove("hidden")
    })
  }

  if (cartItems) {
    cartItems.addEventListener("click", (e) => {
      const index = e.target.closest("[data-index]")?.dataset.index
      if (!index) return
      if (e.target.closest(".decrease-quantity")) {
        if (cart[index].quantity > 1) {
          cart[index].quantity--
          updateCartDisplay()
        }
      } else if (e.target.closest(".increase-quantity")) {
        cart[index].quantity++
        updateCartDisplay()
      } else if (e.target.closest(".remove-item")) {
        cart.splice(index, 1)
        updateCartDisplay()
      }
    })
  }

  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      if (cart.length === 0) {
        alert("Keranjang belanja masih kosong")
        return
      }
    })
  }

  // Example add to cart functionality for product buttons
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
      const product = {
        name: button.dataset.name || button.closest(".bg-white").querySelector("h3").textContent,
        price: Number.parseInt(button.dataset.price) || 85000,
        size: button.dataset.size || "M",
        quantity: 1,
        image: button.dataset.image || button.closest(".bg-white").querySelector("img").src,
      }
      addToCart(product)
    })
  })

  // Initialize cart display
  updateCartDisplay()
})

// Smooth scroll for navigation links
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const targetSection = document.querySelector(targetId)
      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
})

// Jalankan updateAuthUI saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI()

  // Kode lain yang sudah ada...
})
