/**
 * cart.js - File untuk menangani keranjang belanja
 */

// Import UI module (asumsi UI ada di file terpisah)
import * as UI from "./ui.js" // Gantilah './ui.js' dengan path yang sesuai

// Fungsi untuk menampilkan cart modal
function showCartModal() {
  const cartModal = document.getElementById("cart-modal")
  if (cartModal) {
    cartModal.classList.remove("hidden")
  }
}

// Fungsi untuk menyembunyikan cart modal
function hideCartModal() {
  const cartModal = document.getElementById("cart-modal")
  if (cartModal) {
    cartModal.classList.add("hidden")
  }
}

// Fungsi untuk menampilkan success modal
function showSuccessModal() {
  const successModal = document.getElementById("success-modal")
  if (successModal) {
    successModal.classList.remove("hidden")
  }
}

// Fungsi untuk menyembunyikan success modal
function hideSuccessModal() {
  const successModal = document.getElementById("success-modal")
  if (successModal) {
    successModal.classList.add("hidden")
  }
}

// Fungsi untuk mendapatkan cart dari localStorage
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]")
}

// Fungsi untuk menyimpan cart ke localStorage
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart))
}

// Fungsi untuk menambahkan produk ke cart
function addToCart(product) {
  const cart = getCart()

  // Cek apakah produk sudah ada di cart
  const existingProductIndex = cart.findIndex(
    (item) => item.name === product.name && item.size === product.size && item.material === product.material,
  )

  if (existingProductIndex !== -1) {
    // Update quantity jika produk sudah ada
    cart[existingProductIndex].quantity += product.quantity
  } else {
    // Tambahkan produk baru ke cart
    cart.push(product)
  }

  // Simpan cart ke localStorage
  saveCart(cart)

  // Update UI
  updateCartCount()
  updateCartDisplay()

  // Tampilkan notifikasi
  UI.showNotification("Produk ditambahkan ke keranjang")

  // Tampilkan success modal
  showSuccessModal()
}

// Fungsi untuk menghapus produk dari cart
function removeFromCart(index) {
  const cart = getCart()

  // Hapus produk dari cart
  cart.splice(index, 1)

  // Simpan cart ke localStorage
  saveCart(cart)

  // Update UI
  updateCartCount()
  updateCartDisplay()

  // Tampilkan notifikasi
  UI.showNotification("Produk dihapus dari keranjang")
}

// Fungsi untuk mengupdate quantity produk di cart
function updateCartItemQuantity(index, quantity) {
  const cart = getCart()

  // Update quantity
  cart[index].quantity = quantity

  // Simpan cart ke localStorage
  saveCart(cart)

  // Update UI
  updateCartDisplay()
}

// Fungsi untuk menghitung diskon
function calculateDiscount(total, quantity) {
  let discountPercentage = 0
  if (quantity >= 120) discountPercentage = 12
  else if (quantity > 90) discountPercentage = 9
  else if (quantity > 60) discountPercentage = 6
  else if (quantity > 30) discountPercentage = 3
  return (total * discountPercentage) / 100
}

// Fungsi untuk mengupdate jumlah item di cart
function updateCartCount() {
  const cart = getCart()
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  const cartCount = document.getElementById("cart-count")
  if (cartCount) {
    cartCount.textContent = totalItems
  }
}

// Fungsi untuk mengupdate tampilan cart
export function updateCartDisplay() {
  const cart = getCart()
  const cartItems = document.getElementById("cart-items")

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
          <p class="text-sm text-gray-500">Bahan: ${item.material || "-"}</p>
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

  // Update cart totals
  updateCartTotals()
}

// Fungsi untuk mengupdate total harga di cart
function updateCartTotals() {
  const cart = getCart()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)
  const discount = calculateDiscount(subtotal, totalQuantity)
  const total = subtotal - discount

  const cartSubtotal = document.getElementById("cart-subtotal")
  const cartDiscount = document.getElementById("cart-discount")
  const cartTotal = document.getElementById("cart-total")

  if (cartSubtotal) cartSubtotal.textContent = `Rp ${subtotal.toLocaleString("id-ID")}`
  if (cartDiscount) cartDiscount.textContent = `Rp ${discount.toLocaleString("id-ID")}`
  if (cartTotal) cartTotal.textContent = `Rp ${total.toLocaleString("id-ID")}`
}

// Fungsi untuk initialize cart
function initCart() {
  // Update cart count
  updateCartCount()

  // Add event listener for cart button
  const cartButton = document.getElementById("cart-button")
  if (cartButton) {
    cartButton.addEventListener("click", showCartModal)
  }

  // Add event listener for close cart button
  const closeCart = document.getElementById("close-cart")
  if (closeCart) {
    closeCart.addEventListener("click", hideCartModal)
  }

  // Add event listener for continue shopping button
  const continueShoppingBtn = document.getElementById("continue-shopping")
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", hideSuccessModal)
  }

  // Add event listener for view cart button
  const viewCartBtn = document.getElementById("view-cart")
  if (viewCartBtn) {
    viewCartBtn.addEventListener("click", () => {
      hideSuccessModal()
      showCartModal()
    })
  }

  // Add event listener for cart items
  const cartItems = document.getElementById("cart-items")
  if (cartItems) {
    cartItems.addEventListener("click", (e) => {
      const index = e.target.closest("[data-index]")?.dataset.index
      if (!index) return

      if (e.target.closest(".decrease-quantity")) {
        const cart = getCart()
        if (cart[index].quantity > 1) {
          updateCartItemQuantity(index, cart[index].quantity - 1)
        }
      } else if (e.target.closest(".increase-quantity")) {
        const cart = getCart()
        updateCartItemQuantity(index, cart[index].quantity + 1)
      } else if (e.target.closest(".remove-item")) {
        removeFromCart(index)
      }
    })
  }

  // Add event listener for checkout button
  const checkoutButton = document.getElementById("checkout-button")
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      const cart = getCart()
      if (cart.length === 0) {
        UI.showNotification("Keranjang belanja masih kosong", true)
        return
      }

      // Check if user is logged in
      const authToken = localStorage.getItem("authToken")
      if (!authToken) {
        UI.showNotification("Silakan login terlebih dahulu untuk melanjutkan checkout", true)
        hideCartModal()
        document.getElementById("authModal").classList.remove("hidden")
        return
      }

      // Redirect to checkout page
      window.location.href = "checkout.html"
    })
  }
}

// Export cart functions
window.Cart = {
  show: showCartModal,
  hide: hideCartModal,
  addToCart,
  removeFromCart,
  updateQuantity: updateCartItemQuantity,
  getCart,
  updateDisplay: updateCartDisplay,
  init: initCart,
}
