/**
 * product.js - File untuk menangani produk
 */

// Fungsi untuk mengambil data produk dari API
async function fetchProductData() {
  try {
    const response = await fetch('http://localhost:3000/api/barang');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    // Transformasi data API ke format yang kompatibel dengan kode sebelumnya
    const transformedData = {};
    data.barang.forEach((item) => {
      transformedData[item.nama_barang] = {
        title: item.nama_barang,
        description: item.deskripsi,
        price: "Rp 40.000 - Rp 250.000", // Harga default karena tidak ada di API
        materials: item.bahan.map((b) => b.nama_bahan),
        image: item.url_gambar,
      };
    });
    return transformedData;
  } catch (error) {
    console.error('Error fetching product data:', error);
    return {}; // Kembalikan objek kosong jika gagal
  }
}

// Fungsi untuk mendapatkan parameter dari URL
function getUrlParameter(name) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Fungsi untuk load product detail
async function loadProductDetail() {
  const productData = await fetchProductData();
  const productName = getUrlParameter("product") || "Kaos A";
  const product = productData[productName] || productData["Kaos A"];

  // Set product details
  const productTitle = document.getElementById("product-title");
  const productBreadcrumb = document.getElementById("product-breadcrumb");
  const productDescription = document.getElementById("product-description");
  const productPrice = document.getElementById("product-price");
  const productImage = document.getElementById("product-image");

  if (productTitle) productTitle.textContent = product.title;
  if (productBreadcrumb) productBreadcrumb.textContent = product.title;
  if (productDescription) productDescription.textContent = product.description;
  if (productPrice) productPrice.textContent = product.price;
  if (productImage) {
    productImage.src = product.image;
    productImage.alt = product.title;
  }

  // Set document title
  document.title = `${product.title} - Graha Advertising`;

  // Populate material options
  const materialsContainer = document.getElementById("product-materials");
  if (materialsContainer) {
    materialsContainer.innerHTML = "";
    product.materials.forEach((material) => {
      const materialDiv = document.createElement("div");
      materialDiv.className = "border p-3 rounded cursor-pointer hover:bg-gray-50 hover:border-primary";
      materialDiv.innerHTML = `<div class="font-medium">${material}</div>`;
      materialsContainer.appendChild(materialDiv);
    });
  }

  // Set form values
  const produkInput = document.getElementById("produk");
  if (produkInput) produkInput.value = product.title;

  // Fill bahan dropdown
  const bahanSelect = document.getElementById("bahan");
  if (bahanSelect) {
    bahanSelect.innerHTML = ""; // Clear existing options
    product.materials.forEach((material) => {
      const option = document.createElement("option");
      option.value = material;
      option.textContent = material;
      bahanSelect.appendChild(option);
    });
  }

  // Add event listeners for material selection
  document.querySelectorAll("#product-materials > div").forEach((div) => {
    div.addEventListener("click", function () {
      // Remove active class from all materials
      document.querySelectorAll("#product-materials > div").forEach((el) => {
        el.classList.remove("border-primary", "bg-gray-50");
      });

      // Add active class to selected material
      this.classList.add("border-primary", "bg-gray-50");
    });
  });
}

// Fungsi untuk change main product image
function changeMainImage(src) {
  const productImage = document.getElementById("product-image");
  if (productImage) productImage.src = src;
}

// Fungsi untuk scroll to order form
function scrollToOrderForm() {
  openTab("order");
  const formPemesanan = document.getElementById("formPemesanan");
  if (formPemesanan) {
    formPemesanan.scrollIntoView({ behavior: "smooth" });
  }
}

// Fungsi untuk open tab
function openTab(tabName) {
  // Hide all tab content
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((content) => {
    content.classList.add("hidden");
  });

  // Show selected tab content
  const selectedTab = document.getElementById(`content-${tabName}`);
  if (selectedTab) selectedTab.classList.remove("hidden");

  // Update tab buttons
  const tabButtons = document.querySelectorAll('[id^="tab-"]');
  tabButtons.forEach((button) => {
    button.classList.remove("border-primary", "text-primary");
    button.classList.add("border-transparent");
  });

  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) {
    activeTab.classList.add("border-primary", "text-primary");
    activeTab.classList.remove("border-transparent");
  }
}

// Fungsi untuk initialize product page
async function initProductPage() {
  // Load product detail
  await loadProductDetail();

  // Add event listener for add to cart button
  const addToCartBtn = document.getElementById("add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", async () => {
      const productData = await fetchProductData();
      const productTitle = document.getElementById("product-title").textContent;
      const productImage = document.getElementById("product-image").src;

      // Get selected material (first one as default)
      const selectedMaterial = document.querySelector("#product-materials .border-primary")
        ? document.querySelector("#product-materials .border-primary").querySelector(".font-medium").textContent
        : document.querySelector("#product-materials div").querySelector(".font-medium").textContent;

      // Create product object
      const product = {
        name: productTitle,
        price: 85000, // Default price, would be better to have actual price data
        size: "M", // Default size
        quantity: 1,
        image: productImage,
        material: selectedMaterial,
      };

      // Add to cart
      if (typeof Cart !== "undefined" && Cart.addToCart) {
        Cart.addToCart(product);
      } else {
        console.error("Cart is not defined or does not have addToCart method.");
      }
    });
  }

  // Initialize size chart toggle
  const cmBtn = document.getElementById("cm-btn");
  const inchBtn = document.getElementById("inch-btn");
  const sizeChartCm = document.getElementById("size-chart-cm");
  const sizeChartInch = document.getElementById("size-chart-inch");

  if (cmBtn && inchBtn) {
    cmBtn.addEventListener("click", () => {
      cmBtn.classList.add("bg-primary", "text-white");
      cmBtn.classList.remove("text-gray-700");
      inchBtn.classList.remove("bg-primary", "text-white");
      inchBtn.classList.add("text-gray-700");
      sizeChartCm.classList.remove("hidden");
      sizeChartInch.classList.add("hidden");
    });

    inchBtn.addEventListener("click", () => {
      inchBtn.classList.add("bg-primary", "text-white");
      inchBtn.classList.remove("text-gray-700");
      cmBtn.classList.remove("bg-primary", "text-white");
      cmBtn.classList.add("text-gray-700");
      sizeChartInch.classList.remove("hidden");
      sizeChartCm.classList.add("hidden");
    });
  }

  // Initialize tab buttons
  const tabButtons = document.querySelectorAll('[id^="tab-"]');
  tabButtons.forEach((button) => {
    const tabName = button.id.replace("tab-", "");
    button.addEventListener("click", () => openTab(tabName));
  });
}

// Export product functions
window.Product = {
  loadDetail: loadProductDetail,
  changeMainImage,
  scrollToOrderForm,
  openTab,
  init: initProductPage,
};