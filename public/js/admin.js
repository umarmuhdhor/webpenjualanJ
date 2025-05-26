let products = [];
let materials = [];
let orders = [];
let stocks = [];

// Utility Functions
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notification-text");

  notificationText.textContent = message;
  notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg transition-opacity duration-300 z-50 ${
    type === "success" ? "bg-green-500" : "bg-red-500"
  } text-white opacity-100`;

  setTimeout(() => {
    notification.classList.add("opacity-0");
  }, 3000);
}

function openModal(title, content) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-content").innerHTML = content;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

// Navigation Functions
function switchTab(tabName) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.add("hidden");
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("bg-primary");
  });

  document.getElementById(`${tabName}-tab`).classList.remove("hidden");
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("bg-primary");

  const titles = {
    products: "Manajemen Barang",
    materials: "Manajemen Bahan",
    orders: "Manajemen Pesanan",
    stocks: "Manajemen Stok",
    warehouseStocks : "Manajemen Stok Gudang",
  };
  document.getElementById("page-title").textContent = titles[tabName];
}

// Product Functions
async function fetchProducts() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return [];
  }

  try {
    const response = await fetch('http://localhost:3000/api/barang', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (response.ok) {
      products = data.barang || [];
      return products;
    } else {
      showNotification(data.error || 'Gagal mengambil data barang', 'error');
      return [];
    }
  } catch (error) {
    showNotification('Terjadi kesalahan saat mengambil data barang', 'error');
    return [];
  }
}

async function renderProducts() {
  await fetchProducts();
  const grid = document.getElementById("products-grid");
  const BASE_URL = "http://localhost:3000"; // Backend URL
  grid.innerHTML = products
    .map((product) => {
      const bahanNames = product.bahan.map((b) => b.nama_bahan).join(", ");
      // Use BASE_URL and remove extra /images/ from url_gambar
      const imageUrl = `${BASE_URL}/${product.url_gambar}`;
      return `
        <div class="border rounded-lg p-4 space-y-4">
          <img src="${imageUrl}" alt="${product.nama_barang}" class="w-full h-48 object-cover rounded">
          <div>
            <h3 class="font-semibold text-lg">${product.nama_barang}</h3>
            <p class="text-gray-600 text-sm">${product.deskripsi || ""}</p>
            <p class="text-gray-800 font-medium">Rp ${product.harga.toLocaleString("id-ID")}</p>
            <div class="mt-2">
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">${bahanNames}</span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button onclick="editProduct(${product.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteProduct(${product.id})" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
  console.log("[05:26 PM WIB, May 25, 2025] Rendered products with image URLs");
}

function getProductForm(product = null) {
  const materialCheckboxes = materials
    .map(
      (material) => `
        <div class="flex items-center space-x-2">
          <input type="checkbox" id="bahan-${material.id}" value="${material.id}" 
            ${product && product.bahan.some((b) => b.id === material.id) ? "checked" : ""}>
          <label for="bahan-${material.id}" class="text-sm">${material.nama_bahan}</label>
        </div>
      `
    )
    .join("");

  return `
    <form id="product-form" class="space-y-4" enctype="multipart/form-data">
      <div>
        <label class="block text-gray-700 mb-2">Nama Barang</label>
        <input type="text" id="nama_barang" value="${product ? product.nama_barang : ""}" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Harga (Rp)</label>
        <input type="number" id="harga" value="${product ? product.harga : ""}" min="0" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Gambar</label>
        <input type="file" id="gambar" accept="image/*" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
          ${product ? "" : "required"}>
        ${product ? `<img src="${product.url_gambar}" alt="Current Image" class="w-32 h-32 object-cover mt-2">` : ""}
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Deskripsi</label>
        <textarea id="deskripsi" rows="3" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">${product ? product.deskripsi : ""}</textarea>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Bahan</label>
        <div class="space-y-2">
          ${materialCheckboxes}
        </div>
      </div>
      <div class="flex justify-end space-x-2">
        <button type="button" onclick="closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Batal
        </button>
        <button type="submit" class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
          ${product ? "Update" : "Tambah"} Barang
        </button>
      </div>
    </form>
  `;
}

async function addProduct() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  await fetchMaterials();
  openModal("Tambah Barang Baru", getProductForm());

  document.getElementById("product-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const selectedBahanIds = Array.from(
      document.querySelectorAll('input[type="checkbox"]:checked')
    ).map((cb) => parseInt(cb.value));

    const formData = new FormData();
    formData.append("nama_barang", document.getElementById("nama_barang").value);
    formData.append("harga", parseInt(document.getElementById("harga").value));
    formData.append("gambar", document.getElementById("gambar").files[0]);
    formData.append("deskripsi", document.getElementById("deskripsi").value);
    formData.append("bahan_ids", JSON.stringify(selectedBahanIds));

    try {
      const response = await fetch('http://localhost:3000/api/barang', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        await renderProducts();
        closeModal();
        showNotification("Barang berhasil ditambahkan!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal menambahkan barang', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat menambahkan barang', 'error');
    }
  });
}

async function editProduct(id) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  await fetchMaterials();
  const product = products.find((p) => p.id === id);
  if (!product) return;

  openModal("Edit Barang", getProductForm(product));

  document.getElementById("product-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const selectedBahanIds = Array.from(
      document.querySelectorAll('input[type="checkbox"]:checked')
    ).map((cb) => parseInt(cb.value));

    const formData = new FormData();
    formData.append("nama_barang", document.getElementById("nama_barang").value);
    formData.append("harga", parseInt(document.getElementById("harga").value));
    const gambarInput = document.getElementById("gambar").files[0];
    if (gambarInput) {
      formData.append("gambar", gambarInput);
    }
    formData.append("deskripsi", document.getElementById("deskripsi").value);
    formData.append("bahan_ids", JSON.stringify(selectedBahanIds));

    try {
      const response = await fetch(`http://localhost:3000/api/barang/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        await renderProducts();
        closeModal();
        showNotification("Barang berhasil diupdate!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal mengupdate barang', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat mengupdate barang', 'error');
    }
  });
}

async function deleteProduct(id) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  if (confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
    try {
      const response = await fetch(`http://localhost:3000/api/barang/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        await renderProducts();
        showNotification("Barang berhasil dihapus!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal menghapus barang', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat menghapus barang', 'error');
    }
  }
}

// Material Functions
async function fetchMaterials() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return [];
  }

  try {
    const response = await fetch('http://localhost:3000/api/bahan', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (response.ok) {
      materials = data.bahan || [];
      return materials;
    } else if (response.status === 401) {
      showNotification('Token tidak valid. Silakan login ulang.', 'error');
      return [];
    } else {
      showNotification(data.error || 'Gagal mengambil data bahan', 'error');
      return [];
    }
  } catch (error) {
    showNotification('Terjadi kesalahan saat mengambil data bahan', 'error');
    return [];
  }
}

async function renderMaterials() {
  await fetchMaterials();
  const table = document.getElementById("materials-table");
  table.innerHTML = materials
    .map(
      (material) => `
        <tr class="border-b">
          <td class="p-4 font-medium">${material.nama_bahan}</td>
          <td class="p-4 text-gray-600">${material.deskripsi || ""}</td>
          <td class="p-4">
            <div class="flex space-x-2">
              <button onclick="editMaterial(${material.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteMaterial(${material.id})" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function getMaterialForm(material = null) {
  return `
    <form id="material-form" class="space-y-4">
      <div>
        <label class="block text-gray-700 mb-2">Nama Bahan</label>
        <input type="text" id="nama_bahan" value="${material ? material.nama_bahan : ""}" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Deskripsi</label>
        <textarea id="deskripsi" rows="3" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">${material ? material.deskripsi : ""}</textarea>
      </div>
      <div class="flex justify-end space-x-2">
        <button type="button" onclick="closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Batal
        </button>
        <button type="submit" class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
          ${material ? "Update" : "Tambah"} Bahan
        </button>
      </div>
    </form>
  `;
}

async function addMaterial() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  openModal("Tambah Bahan Baru", getMaterialForm());

  document.getElementById("material-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const newMaterial = {
      nama_bahan: document.getElementById("nama_bahan").value,
      deskripsi: document.getElementById("deskripsi").value,
    };

    try {
      const response = await fetch('http://localhost:3000/api/bahan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newMaterial),
      });
      const data = await response.json();
      if (response.ok) {
        await renderMaterials();
        closeModal();
        showNotification("Bahan berhasil ditambahkan!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal menambahkan bahan', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat menambahkan bahan', 'error');
    }
  });
}

async function editMaterial(id) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  const material = materials.find((m) => m.id === id);
  if (!material) return;

  openModal("Edit Bahan", getMaterialForm(material));

  document.getElementById("material-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const updatedMaterial = {
      nama_bahan: document.getElementById("nama_bahan").value,
      deskripsi: document.getElementById("deskripsi").value,
    };

    try {
      const response = await fetch(`http://localhost:3000/api/bahan/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedMaterial),
      });
      const data = await response.json();
      if (response.ok) {
        await renderMaterials();
        closeModal();
        showNotification("Bahan berhasil diupdate!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal mengupdate bahan', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat mengupdate bahan', 'error');
    }
  });
}

async function deleteMaterial(id) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  if (confirm("Apakah Anda yakin ingin menghapus bahan ini?")) {
    try {
      const response = await fetch(`http://localhost:3000/api/bahan/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        await renderMaterials();
        showNotification("Bahan berhasil dihapus!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal menghapus bahan', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat menghapus bahan', 'error');
    }
  }
}

// Order Functions
async function fetchOrders() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return [];
  }

  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log("Data dari API orders:", data); // Log untuk debugging
    if (response.ok) {
      orders = data|| [];
      console.log("Orders yang disimpan:", orders); // Log untuk debugging
      return orders;
    } else if (response.status === 401) {
      showNotification('Token tidak valid. Silakan login ulang.', 'error');
      return [];
    } else {
      showNotification(data.error || 'Gagal mengambil data pesanan', 'error');
      return [];
    }
  } catch (error) {
    console.error("Error saat fetchOrders:", error); // Log untuk debugging
    showNotification('Terjadi kesalahan saat mengambil data pesanan', 'error');
    return [];
  }
}

async function renderOrders(filteredOrders = null) {
  await fetchOrders();
  const ordersToRender = filteredOrders || orders;
  const table = document.getElementById("orders-table");
  table.innerHTML = ordersToRender
    .map((order) => {
      const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        processing: "bg-blue-100 text-blue-800",
        shipped: "bg-purple-100 text-purple-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
      };

      return `
        <tr class="border-b">
          <td class="p-4 font-medium">${order.id}</td>
          <td class="p-4">${order.user_id.user_name}</td>
          <td class="p-4">${order.nama_barang} (${order.quantity})</td>
          <td class="p-4">Rp ${order.total_price.toLocaleString("id-ID")}</td>
          <td class="p-4">
            <select onchange="updateOrderStatus(${order.id}, this.value)" 
              class="border rounded px-2 py-1 text-xs ${statusColors[order.status] || "bg-gray-100"}">
              <option value="diterima" ${order.status == "diterima" ? "selected" : ""}>Menunggu</option>
              <option value="diproses" ${order.status == "diproses" ? "selected" : ""}>Diproses</option>
              <option value="selesai" ${order.status == "selesai" ? "selected" : ""}>Selesai</option>
              <option value="dibatalkan" ${order.status == "dibatalkan" ? "selected" : ""}>Dibatalkan</option>
            </select>
          </td>
          <td class="p-4">${new Date(order.created_at).toLocaleDateString("id-ID")}</td>
          <td class="p-4">
            <button onclick="viewOrder(${order.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function updateOrderStatus(orderId, newStatus) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  console.log(newStatus);

  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await response.json();
    if (response.ok) {
      await renderOrders();
      showNotification("Status pesanan berhasil diupdate!");
    } else if (response.status === 401) {
      showNotification('Token tidak valid. Silakan login ulang.', 'error');
    } else {
      showNotification(data.error || 'Gagal mengupdate status pesanan', 'error');
    }
  } catch (error) {
    showNotification('Terjadi kesalahan saat mengupdate status pesanan', 'error');
  }
}

function viewOrder(orderId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  const orderDetails = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-700 font-medium">ID Pesanan</label>
          <p class="text-gray-900">${order.id}</p>
        </div>
        <div>
          <label class="block text-gray-700 font-medium">Pelanggan</label>
          <p class="text-gray-900">${order.user_name}</p>
        </div>
        <div>
          <label class="block text-gray-700 font-medium">Produk</label>
          <p class="text-gray-900">${order.nama_barang}</p>
        </div>
        <div>
          <label class="block text-gray-700 font-medium">Jumlah</label>
          <p class="text-gray-900">${order.quantity}</p>
        </div>
        <div>
          <label class="block text-gray-700 font-medium">Total</label>
          <p class="text-gray-900">Rp ${order.total_price.toLocaleString("id-ID")}</p>
        </div>
        <div>
          <label class="block text-gray-700 font-medium">Status</label>
          <p class="text-gray-900">${order.status}</p>
        </div>
      </div>
      <div class="flex justify-end">
        <button onclick="closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Tutup
        </button>
      </div>
    </div>
  `;

  openModal("Detail Pesanan", orderDetails);
}

function getFilteredOrders() {
  const searchTerm = document.getElementById("order-search").value.toLowerCase();
  const statusFilter = document.getElementById("status-filter").value;

  return orders.filter((order) => {
    const matchesSearch =
      order.id.toString().includes(searchTerm) ||
      order.user_name.toLowerCase().includes(searchTerm);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

// Stock Functions - Updated to use barang_id instead of nama_barang
// Stock Functions
async function fetchStocks() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return [];
  }

  try {
    const response = await fetch('http://localhost:3000/api/stock/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (response.ok) {
      // Filter for entries where type is "in"
      stocks = (data.history || []).filter(stock => stock.type === 'in');
      return stocks;
    } else if (response.status === 401) {
      showNotification('Token tidak valid. Silakan login ulang.', 'error');
      return [];
    } else {
      showNotification(data.error || 'Gagal mengambil data stok', 'error');
      return [];
    }
  } catch (error) {
    showNotification('Terjadi kesalahan saat mengambil data stok', 'error');
    return [];
  }
}

async function renderStocks() {
  await fetchStocks();
  const table = document.getElementById("stocks-table");
  table.innerHTML = stocks
    .map(
      (stock) => `
        <tr class="border-b">
          <td class="p-4 font-medium">${stock.nama_barang}</td>
          <td class="p-4">${stock.color}</td>
          <td class="p-4">${stock.size}</td>
          <td class="p-4">${stock.quantity}</td>
          <td class="p-4">${stock.description || ""}</td>
          <td class="p-4">${new Date(stock.created_at).toLocaleDateString("id-ID")}</td>
        </tr>
      `
    )
    .join("");
}

function getStockForm(stock = null) {
  const productOptions = products
    .map(
      (product) =>
        `<option value="${product.id}" ${
          stock && stock.barang_id === product.id ? "selected" : ""
        }>${product.nama_barang}</option>`
    )
    .join("");

  return `
    <form id="stock-form" class="space-y-4">
      <div>
        <label class="block text-gray-700 mb-2">Barang</label>
        <select id="barang_id" class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
          <option value="">Pilih barang</option>
          ${productOptions}
        </select>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Warna</label>
        <input type="text" id="color" value="${stock ? stock.color : ""}" placeholder="Hitam" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Ukuran</label>
        <select id="size" class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
          <option value="">Pilih ukuran</option>
          <option value="XS" ${stock && stock.size === "XS" ? "selected" : ""}>XS</option>
          <option value="S" ${stock && stock.size === "S" ? "selected" : ""}>S</option>
          <option value="M" ${stock && stock.size === "M" ? "selected" : ""}>M</option>
          <option value="L" ${stock && stock.size === "L" ? "selected" : ""}>L</option>
          <option value="XL" ${stock && stock.size === "XL" ? "selected" : ""}>XL</option>
          <option value="XXL" ${stock && stock.size === "XXL" ? "selected" : ""}>XXL</option>
          <option value="One Size" ${stock && stock.size === "One Size" ? "selected" : ""}>One Size</option>
        </select>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Jumlah</label>
        <input type="number" id="quantity" value="${stock ? stock.quantity : ""}" min="1" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Keterangan</label>
        <textarea id="description" rows="3" placeholder="Restock Jaket B" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">${stock ? stock.description : ""}</textarea>
      </div>
      <div class="flex justify-end space-x-2">
        <button type="button" onclick="closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Batal
        </button>
        <button type="submit" class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
          ${stock ? "Update" : "Tambah"} Stok
        </button>
      </div>
    </form>
  `;
}

async function addStock() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  await fetchProducts();
  openModal("Tambah Stok Barang", getStockForm());

  document.getElementById("stock-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const newStock = {
      barang_id: parseInt(document.getElementById("barang_id").value),
      color: document.getElementById("color").value,
      size: document.getElementById("size").value,
      quantity: parseInt(document.getElementById("quantity").value),
      description: document.getElementById("description").value,
    };

    try {
      const response = await fetch('http://localhost:3000/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newStock),
      });
      const data = await response.json();
      if (response.ok) {
        await renderStocks();
        closeModal();
        showNotification("Stok berhasil ditambahkan!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal menambahkan stok', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat menambahkan stok', 'error');
    }
  });
}

async function fetchWarehouseStocks() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return [];
  }

  try {
    const response = await fetch('http://localhost:3000/api/stock', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (response.ok) {
      warehouseStocks = data.stocks || [];
      return warehouseStocks;
    } else if (response.status === 401) {
      showNotification('Token tidak valid. Silakan login ulang.', 'error');
      return [];
    } else {
      showNotification(data.error || 'Gagal mengambil data stok gudang', 'error');
      return [];
    }
  } catch (error) {
    showNotification('Terjadi kesalahan saat mengambil data stok gudang', 'error');
    return [];
  }
}

async function renderWarehouseStocks() {
  await fetchWarehouseStocks();
  const table = document.getElementById("warehouse-stocks-table");
  table.innerHTML = warehouseStocks
    .map(
      (stock) => `
        <tr class="border-b">
          <td class="p-4 font-medium">${stock.nama_barang}</td>
          <td class="p-4">${stock.color}</td>
          <td class="p-4">${stock.size}</td>
          <td class="p-4">Rp ${stock.harga.toLocaleString("id-ID")}</td>
          <td class="p-4 ${stock.quantity <= stock.min_quantity ? 'text-red-500' : ''}">${stock.quantity}</td>
          <td class="p-4">${stock.min_quantity}</td>
          <td class="p-4">
            <div class="flex space-x-2">
              <button onclick="editWarehouseStock('${stock.barang_id}', '${stock.color}', '${stock.size}')" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteWarehouseStock('${stock.barang_id}', '${stock.color}', '${stock.size}')" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function getWarehouseStockForm(stock = null) {
  const productOptions = products
    .map(
      (product) =>
        `<option value="${product.id}" ${
          stock && stock.barang_id === product.id ? "selected" : ""
        }>${product.nama_barang}</option>`
    )
    .join("");

  return `
    <form id="warehouse-stock-form" class="space-y-4">
      <div>
        <label class="block text-gray-700 mb-2">Barang</label>
        <select id="barang_id" class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
          <option value="">Pilih barang</option>
          ${productOptions}
        </select>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Harga (Rp)</label>
        <input type="number" id="harga" value="${stock ? stock.harga : ""}" min="0" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Warna</label>
        <input type="text" id="color" value="${stock ? stock.color : ""}" placeholder="Hitam" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Ukuran</label>
        <select id="size" class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
          <option value="">Pilih ukuran</option>
          <option value="XS" ${stock && stock.size === "XS" ? "selected" : ""}>XS</option>
          <option value="S" ${stock && stock.size === "S" ? "selected" : ""}>S</option>
          <option value="M" ${stock && stock.size === "M" ? "selected" : ""}>M</option>
          <option value="L" ${stock && stock.size === "L" ? "selected" : ""}>L</option>
          <option value="XL" ${stock && stock.size === "XL" ? "selected" : ""}>XL</option>
          <option value="XXL" ${stock && stock.size === "XXL" ? "selected" : ""}>XXL</option>
          <option value="One Size" ${stock && stock.size === "One Size" ? "selected" : ""}>One Size</option>
        </select>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Jumlah</label>
        <input type="number" id="quantity" value="${stock ? stock.quantity : ""}" min="1" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
      </div>
      <div>
        <label class="block text-gray-700 mb-2">Stok Minimum</label>
        <input type="number" id="min_quantity" value="${stock ? stock.min_quantity : ""}" min="0" 
          class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
      </div>
      <div class="flex justify-end space-x-2">
        <button type="button" onclick="closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Batal
        </button>
        <button type="submit" class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
          ${stock ? "Update" : "Tambah"} Stok
        </button>
      </div>
    </form>
  `;
}

async function addWarehouseStock() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  await fetchProducts(); // Ambil daftar barang untuk dropdown
  openModal("Tambah Stok Gudang", getWarehouseStockForm());

  document.getElementById("warehouse-stock-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const newStock = {
      barang_id: parseInt(document.getElementById("barang_id").value),
      harga: parseInt(document.getElementById("harga").value),
      color: document.getElementById("color").value,
      size: document.getElementById("size").value,
      quantity: parseInt(document.getElementById("quantity").value),
      min_quantity: parseInt(document.getElementById("min_quantity").value),
    };

    try {
      const response = await fetch('http://localhost:3000/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newStock),
      });
      const data = await response.json();
      if (response.ok) {
        await renderWarehouseStocks();
        closeModal();
        showNotification("Stok gudang berhasil ditambahkan!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal menambahkan stok gudang', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat menambahkan stok gudang', 'error');
    }
  });
}

async function editWarehouseStock(barang_id, color, size) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  await fetchProducts();
  const stock = warehouseStocks.find(
    (s) => s.barang_id == barang_id && s.color === color && s.size === size
  );
  if (!stock) return;

  openModal("Edit Stok Gudang", getWarehouseStockForm(stock));

  document.getElementById("warehouse-stock-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const updatedStock = {
      barang_id: parseInt(document.getElementById("barang_id").value),
      harga: parseInt(document.getElementById("harga").value),
      color: document.getElementById("color").value,
      size: document.getElementById("size").value,
      quantity: parseInt(document.getElementById("quantity").value),
      min_quantity: parseInt(document.getElementById("min_quantity").value),
    };

    try {
      const response = await fetch(`http://localhost:3000/api/stock/${barang_id}/${color}/${size}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedStock),
      });
      const data = await response.json();
      if (response.ok) {
        await renderWarehouseStocks();
        closeModal();
        showNotification("Stok gudang berhasil diupdate!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal mengupdate stok gudang', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat mengupdate stok gudang', 'error');
    }
  });
}

async function deleteWarehouseStock(barang_id, color, size) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Silakan login sebagai admin terlebih dahulu', 'error');
    return;
  }

  if (confirm("Apakah Anda yakin ingin menghapus stok ini?")) {
    try {
      const response = await fetch(`http://localhost:3000/api/stock/${barang_id}/${color}/${size}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        await renderWarehouseStocks();
        showNotification("Stok gudang berhasil dihapus!");
      } else if (response.status === 401) {
        showNotification('Token tidak valid. Silakan login ulang.', 'error');
      } else {
        showNotification(data.error || 'Gagal menghapus stok gudang', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat menghapus stok gudang', 'error');
    }
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      switchTab(this.dataset.tab);
    });
  });

  document.getElementById("menu-toggle").addEventListener("click", function () {
    document.getElementById("sidebar").classList.remove("-translate-x-full");
    document.getElementById("sidebar-overlay").classList.remove("hidden");
  });

  document.getElementById("close-sidebar").addEventListener("click", function () {
    document.getElementById("sidebar").classList.add("-translate-x-full");
    document.getElementById("sidebar-overlay").classList.add("hidden");
  });

  document.getElementById("sidebar-overlay").addEventListener("click", function () {
    document.getElementById("sidebar").classList.add("-translate-x-full");
    this.classList.add("hidden");
  });

  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("modal").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });

  document.getElementById("add-product-btn").addEventListener("click", addProduct);
  document.getElementById("add-material-btn").addEventListener("click", addMaterial);
  document.getElementById("add-stock-btn").addEventListener("click", addStock);

  document.getElementById("order-search").addEventListener("input", function () {
    const filteredOrders = getFilteredOrders();
    renderOrders(filteredOrders);
  });

  document.getElementById("status-filter").addEventListener("change", function () {
    const filteredOrders = getFilteredOrders();
    renderOrders(filteredOrders);
  });

  // Initial render
  renderProducts();
  renderMaterials();
  renderOrders();
  renderStocks();
  renderWarehouseStocks();
});