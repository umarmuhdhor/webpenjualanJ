/**
 * Main JavaScript untuk Graha Advertising
 * File ini berisi inisialisasi dan fungsi-fungsi utama
 */

// Import dari modul lain
import { updateAuthUI } from "./auth.js";
import { updateCartDisplay } from "./cart.js";

// Inisialisasi Swiper
function initSwiper() {
  // Swiper sudah tersedia global dari CDN
  const swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,
    spaceBetween: 20,
    loop: false,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });
}

// Inisialisasi dropdown produk dan bahan
function initProductMaterialsDropdown() {
  const productSelect = document.getElementById("product-select");
  const materialSelect = document.getElementById("material-select");

  if (productSelect && materialSelect) {
    productSelect.addEventListener("change", function () {
      const selectedProduct = this.value;
      materialSelect.innerHTML = '<option value="">-- Pilih Bahan --</option>'; // Reset pilihan bahan

      if (selectedProduct && window.Product && window.Product.data[selectedProduct]) {
        window.Product.data[selectedProduct].materials.forEach((material) => {
          const option = document.createElement("option");
          option.value = material;
          option.textContent = material;
          materialSelect.appendChild(option);
        });
        materialSelect.disabled = false; // Aktifkan dropdown bahan
      } else {
        materialSelect.disabled = true; // Nonaktifkan dropdown jika tidak ada produk yang dipilih
      }
    });
  }
}

// Inisialisasi smooth scroll untuk navigation links
function initSmoothScroll() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      // Jika link mengarah ke halaman lain, biarkan default behavior
      if (this.getAttribute("href").includes(".html")) {
        return;
      }

      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

// Inisialisasi size chart toggle
function initSizeChartToggle() {
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
}

// Inisialisasi semua fungsi saat DOM sudah siap
document.addEventListener("DOMContentLoaded", () => {
  // Inisialisasi UI dari ui.js
  if (window.UI && typeof window.UI.init === "function") {
    window.UI.init();
  } else {
    console.error("UI initialization function not found");
  }

  // Inisialisasi keranjang
  if (window.Cart && typeof window.Cart.init === "function") {
    window.Cart.init();
  } else {
    console.error("Cart initialization function not found");
  }

  // Update tampilan keranjang
  updateCartDisplay();

  // Inisialisasi event listeners untuk keranjang
  initCartEventListeners();

  // Inisialisasi Swiper
  initSwiper();

  // Inisialisasi dropdown produk dan bahan
  initProductMaterialsDropdown();

  // Inisialisasi size chart toggle
  initSizeChartToggle();

  // Update UI berdasarkan status login dan peran
  import("./auth.js").then((module) => {
    if (module && typeof module.updateAuthUI === "function") {
      module.updateAuthUI().then(() => {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const dashboardBtn = document.getElementById("dashboard-btn");
        if (dashboardBtn) {
          if (userData.role === "admin") {
            dashboardBtn.classList.remove("hidden");
          } else {
            dashboardBtn.classList.add("hidden");
          }
        }
      }).catch((error) => {
        console.error("Error updating auth UI:", error);
      });
    } else {
      console.error("updateAuthUI function not found in auth.js");
    }
  }).catch((error) => {
    console.error("Failed to load auth.js:", error);
  });

  // Access materials via window.Product.data
  if (window.Product && window.Product.data) {
    const productName = "Kaos Custom"; // Replace with the desired product
    const materials = window.Product.data[productName]?.materials || [];
    console.log(`Materials for ${productName}:`, materials);
  } else {
    console.error("Product data not found");
  }
});

// Expose fungsi-fungsi yang dibutuhkan di global scope
window.loginUser = (event) => {
  import("./auth.js").then((module) => {
    if (module && typeof module.loginUser === "function") {
      module.loginUser(event);
    } else {
      console.error("loginUser function not found in auth.js");
    }
  });
};

window.registerUser = (event) => {
  import("./auth.js").then((module) => {
    if (module && typeof module.registerUser === "function") {
      module.registerUser(event);
    } else {
      console.error("registerUser function not found in auth.js");
    }
  });
};

window.logoutUser = (event) => {
  import("./auth.js").then((module) => {
    if (module && typeof module.logoutUser === "function") {
      module.logoutUser(event);
    } else {
      console.error("logoutUser function not found in auth.js");
    }
  });
};

window.addToCart = (product) => {
  import("./cart.js").then((module) => {
    if (module && typeof module.addToCart === "function") {
      module.addToCart(product);
    } else {
      console.error("addToCart function not found in cart.js");
    }
  });
};

window.changeMainImage = (src) => {
  import("./product.js").then((module) => {
    if (module && typeof module.changeMainImage === "function") {
      module.changeMainImage(src);
    } else {
      console.error("changeMainImage function not found in product.js");
    }
  });
};

window.scrollToOrderForm = () => {
  import("./product.js").then((module) => {
    if (module && typeof module.scrollToOrderForm === "function") {
      module.scrollToOrderForm();
    } else {
      console.error("scrollToOrderForm function not found in product.js");
    }
  });
};

window.openTab = (tabName) => {
  import("./product.js").then((module) => {
    if (module && typeof module.openTab === "function") {
      module.openTab(tabName);
    } else {
      console.error("openTab function not found in product.js");
    }
  });
};