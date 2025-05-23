/**
 * product.js - File untuk menangani produk
 */

// Data produk (sebaiknya diambil dari API)
const productData = {
  "Kaos Custom": {
    title: "Kaos Custom",
    description:
      "Kaos berkualitas dengan berbagai pilihan bahan, warna, dan design. Cocok untuk acara, komunitas, atau kebutuhan pribadi Anda.",
    price: "Rp 40.000 - Rp 120.000",
    materials: ["PE", "Katun"],
    image: "https://i.pinimg.com/736x/f7/6d/83/f76d832d5e6d66a3fe44c162140e77f6.jpg",
  },
  "Jaket Custom": {
    title: "Jaket Custom",
    description: "Jaket dengan desain eksklusif sesuai keinginan Anda. Berbagai pilihan bahan dan warna tersedia.",
    price: "Rp 110.000 - Rp 250.000",
    materials: ["Parasut", "Wol", "Lotto"],
    image: "https://i.pinimg.com/736x/6a/54/39/6a5439f9bc0f3e76dd7123d7ffa5fc06.jpg",
  },
  "Kemeja Custom": {
    title: "Kemeja Custom",
    description: "Kemeja formal atau kasual dengan kualitas premium. Cocok untuk seragam kantor atau event.",
    price: "Rp 100.000 - Rp 200.000",
    materials: ["American Drill", "Japan Drill", "Toyobo"],
    image: "https://i.pinimg.com/736x/2b/2e/7f/2b2e7f38dedb7378a1cce1e833ce7dc4.jpg",
  },
  "Jersey Custom": {
    title: "Jersey Custom",
    description: "Seragam jersey custom, wujudkan tampilan profesional dengan sentuhan personal dari tim Anda.",
    price: "Rp 90.000 - Rp 250.000",
    materials: ["Jersey"],
    image: "https://i.pinimg.com/736x/a8/80/17/a8801742bf6916ab2262ecca92b78515.jpg",
  },
  "Kaos Polo Custom": {
    title: "Kaos Polo Custom",
    description: "Kaos Polo custom, wujudkan tampilan profesional dengan sentuhan personal dari tim Anda.",
    price: "Rp 90.000 - Rp 250.000",
    materials: ["Polo"],
    image: "https://i.pinimg.com/736x/31/c4/0a/31c40aee086c878bfadabdea4339736e.jpg",
  },
  "Hoodie Custom": {
    title: "Hoodie Custom",
    description:
      "Hoodie custom kami hadir dengan desain personal pilihanmu—cocok untuk komunitas, event, atau identitas tim yang ingin tampil beda namun tetap nyaman.",
    price: "Rp 90.000 - Rp 250.000",
    materials: ["Spunbond"],
    image: "https://i.pinimg.com/736x/c6/d2/2a/c6d22a2206a39a3cdfed4d9aad088ed0.jpg",
  },
}

// Fungsi untuk mendapatkan parameter dari URL
function getUrlParameter(name) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]")
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
  var results = regex.exec(location.search)
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
}

// Fungsi untuk load product detail
function loadProductDetail() {
  const productName = getUrlParameter("product") || "Kaos Custom"
  const product = productData[productName] || productData["Kaos Custom"]

  // Set product details
  const productTitle = document.getElementById("product-title")
  const productBreadcrumb = document.getElementById("product-breadcrumb")
  const productDescription = document.getElementById("product-description")
  const productPrice = document.getElementById("product-price")
  const productImage = document.getElementById("product-image")

  if (productTitle) productTitle.textContent = product.title
  if (productBreadcrumb) productBreadcrumb.textContent = product.title
  if (productDescription) productDescription.textContent = product.description
  if (productPrice) productPrice.textContent = product.price
  if (productImage) {
    productImage.src = product.image
    productImage.alt = product.title
  }

  // Set document title
  document.title = `${product.title} - Graha Advertising`

  // Populate material options
  const materialsContainer = document.getElementById("product-materials")
  if (materialsContainer) {
    materialsContainer.innerHTML = ""
    product.materials.forEach((material) => {
      const materialDiv = document.createElement("div")
      materialDiv.className = "border p-3 rounded cursor-pointer hover:bg-gray-50 hover:border-primary"
      materialDiv.innerHTML = `<div class="font-medium">${material}</div>`
      materialsContainer.appendChild(materialDiv)
    })
  }

  // Set form values
  const produkInput = document.getElementById("produk")
  if (produkInput) produkInput.value = product.title

  // Fill bahan dropdown
  const bahanSelect = document.getElementById("bahan")
  if (bahanSelect) {
    bahanSelect.innerHTML = "" // Clear existing options
    product.materials.forEach((material) => {
      const option = document.createElement("option")
      option.value = material
      option.textContent = material
      bahanSelect.appendChild(option)
    })
  }

  // Add event listeners for material selection
  document.querySelectorAll("#product-materials > div").forEach((div) => {
    div.addEventListener("click", function () {
      // Remove active class from all materials
      document.querySelectorAll("#product-materials > div").forEach((el) => {
        el.classList.remove("border-primary", "bg-gray-50")
      })

      // Add active class to selected material
      this.classList.add("border-primary", "bg-gray-50")
    })
  })
}

// Fungsi untuk change main product image
function changeMainImage(src) {
  const productImage = document.getElementById("product-image")
  if (productImage) productImage.src = src
}

// Fungsi untuk scroll to order form
function scrollToOrderForm() {
  openTab("order")
  const formPemesanan = document.getElementById("formPemesanan")
  if (formPemesanan) {
    formPemesanan.scrollIntoView({ behavior: "smooth" })
  }
}

// Fungsi untuk open tab
function openTab(tabName) {
  // Hide all tab content
  const tabContents = document.querySelectorAll(".tab-content")
  tabContents.forEach((content) => {
    content.classList.add("hidden")
  })

  // Show selected tab content
  const selectedTab = document.getElementById(`content-${tabName}`)
  if (selectedTab) selectedTab.classList.remove("hidden")

  // Update tab buttons
  const tabButtons = document.querySelectorAll('[id^="tab-"]')
  tabButtons.forEach((button) => {
    button.classList.remove("border-primary", "text-primary")
    button.classList.add("border-transparent")
  })

  const activeTab = document.getElementById(`tab-${tabName}`)
  if (activeTab) {
    activeTab.classList.add("border-primary", "text-primary")
    activeTab.classList.remove("border-transparent")
  }
}

// Fungsi untuk initialize product page
function initProductPage() {
  // Load product detail
  loadProductDetail()

  // Add event listener for add to cart button
  const addToCartBtn = document.getElementById("add-to-cart-btn")
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const productTitle = document.getElementById("product-title").textContent
      const productImage = document.getElementById("product-image").src

      // Get selected material (first one as default)
      const selectedMaterial = document.querySelector("#product-materials .border-primary")
        ? document.querySelector("#product-materials .border-primary").querySelector(".font-medium").textContent
        : document.querySelector("#product-materials div").querySelector(".font-medium").textContent

      // Create product object
      const product = {
        name: productTitle,
        price: 85000, // Default price, would be better to have actual price data
        size: "M", // Default size
        quantity: 1,
        image: productImage,
        material: selectedMaterial,
      }

      // Add to cart
      if (typeof Cart !== "undefined" && Cart.addToCart) {
        Cart.addToCart(product)
      } else {
        console.error("Cart is not defined or does not have addToCart method.")
      }
    })
  }

  // Initialize size chart toggle
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

  // Initialize tab buttons
  const tabButtons = document.querySelectorAll('[id^="tab-"]')
  tabButtons.forEach((button) => {
    const tabName = button.id.replace("tab-", "")
    button.addEventListener("click", () => openTab(tabName))
  })
}

// Export product functions
window.Product = {
  data: productData,
  loadDetail: loadProductDetail,
  changeMainImage,
  scrollToOrderForm,
  openTab,
  init: initProductPage,
}
