let products = [
  {
    id: 1,
    nama_barang: "Jaket Hoodie Premium",
    url_gambar: "/placeholder.svg?height=200&width=200",
    deskripsi: "Jaket hoodie berkualitas tinggi dengan bahan cotton fleece",
    bahan: [
      { id: 1, nama_bahan: "Cotton Fleece" },
      { id: 2, nama_bahan: "Polyester" },
    ],
  },
  {
    id: 2,
    nama_barang: "T-Shirt Custom",
    url_gambar: "/placeholder.svg?height=200&width=200",
    deskripsi: "T-shirt dengan desain custom sesuai permintaan",
    bahan: [{ id: 3, nama_bahan: "Cotton Combed" }],
  },
  {
    id: 3,
    nama_barang: "Topi Baseball",
    url_gambar: "/placeholder.svg?height=200&width=200",
    deskripsi: "Topi baseball dengan bordir custom",
    bahan: [{ id: 4, nama_bahan: "Canvas" }],
  },
];

let materials = [
  {
    id: 1,
    nama_bahan: "Cotton Fleece",
    deskripsi: "Bahan katun dengan tekstur lembut dan hangat",
  },
  {
    id: 2,
    nama_bahan: "Polyester",
    deskripsi: "Bahan sintetis yang tahan lama dan mudah perawatan",
  },
  {
    id: 3,
    nama_bahan: "Cotton Combed",
    deskripsi: "Katun berkualitas tinggi dengan serat halus",
  },
  {
    id: 4,
    nama_bahan: "Canvas",
    deskripsi: "Bahan kanvas yang kuat dan tahan lama",
  },
];

let orders = [
  {
    id: 1001,
    user_name: "John Doe",
    nama_barang: "Jaket Hoodie Premium",
    quantity: 2,
    total_price: 500000,
    status: "pending",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 1002,
    user_name: "Jane Smith",
    nama_barang: "T-Shirt Custom",
    quantity: 5,
    total_price: 375000,
    status: "processing",
    created_at: "2024-01-14T14:20:00Z",
  },
  {
    id: 1003,
    user_name: "Bob Johnson",
    nama_barang: "Topi Baseball",
    quantity: 1,
    total_price: 150000,
    status: "completed",
    created_at: "2024-01-13T09:15:00Z",
  },
];

let stocks = [
  {
    id: 1,
    nama_barang: "Jaket Hoodie Premium",
    color: "Hitam",
    size: "L",
    quantity: 25,
    description: "Restock jaket hoodie warna hitam",
    created_at: "2024-01-15T08:00:00Z",
  },
  {
    id: 2,
    nama_barang: "T-Shirt Custom",
    color: "Putih",
    size: "M",
    quantity: 50,
    description: "Stok awal t-shirt putih",
    created_at: "2024-01-14T10:30:00Z",
  },
  {
    id: 3,
    nama_barang: "Topi Baseball",
    color: "Navy",
    size: "One Size",
    quantity: 15,
    description: "Topi baseball navy blue",
    created_at: "2024-01-13T15:45:00Z",
  },
];

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
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.add("hidden");
  });

  // Remove active class from all nav buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("bg-primary");
  });

  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.remove("hidden");
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("bg-primary");

  // Update page title
  const titles = {
    products: "Manajemen Barang",
    materials: "Manajemen Bahan",
    orders: "Manajemen Pesanan",
    stocks: "Manajemen Stok",
  };
  document.getElementById("page-title").textContent = titles[tabName];
}

// Product Functions
function renderProducts() {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = products
    .map((product) => {
      const bahanNames = product.bahan.map((b) => b.nama_bahan).join(", ");
      return `
                    <div class="border rounded-lg p-4 space-y-4">
                        <img src="${product.url_gambar}" alt="${
        product.nama_barang
      }" class="w-full h-48 object-cover rounded">
                        <div>
                            <h3 class="font-semibold text-lg">${
                              product.nama_barang
                            }</h3>
                            <p class="text-gray-600 text-sm">${
                              product.deskripsi || ""
                            }</p>
                            <div class="mt-2">
                                <span class="text-xs bg-gray-100 px-2 py-1 rounded">${bahanNames}</span>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="editProduct(${
                              product.id
                            })" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteProduct(${
                              product.id
                            })" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
    })
    .join("");
}

function getProductForm(product = null) {
  const materialCheckboxes = materials
    .map(
      (material) => `
                <div class="flex items-center space-x-2">
                    <input type="checkbox" id="bahan-${material.id}" value="${
        material.id
      }" 
                        ${
                          product &&
                          product.bahan.some((b) => b.id === material.id)
                            ? "checked"
                            : ""
                        }>
                    <label for="bahan-${material.id}" class="text-sm">${
        material.nama_bahan
      }</label>
                </div>
            `
    )
    .join("");

  return `
                <form id="product-form" class="space-y-4">
                    <div>
                        <label class="block text-gray-700 mb-2">Nama Barang</label>
                        <input type="text" id="nama_barang" value="${
                          product ? product.nama_barang : ""
                        }" 
                            class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">URL Gambar</label>
                        <input type="text" id="url_gambar" value="${
                          product ? product.url_gambar : ""
                        }" 
                            placeholder="/placeholder.svg?height=200&width=200"
                            class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Deskripsi</label>
                        <textarea id="deskripsi" rows="3" 
                            class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">${
                              product ? product.deskripsi : ""
                            }</textarea>
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

function addProduct() {
  openModal("Tambah Barang Baru", getProductForm());

  document
    .getElementById("product-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const selectedBahan = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => materials.find((m) => m.id === parseInt(cb.value)));

      const newProduct = {
        id: products.length + 1,
        nama_barang: document.getElementById("nama_barang").value,
        url_gambar:
          document.getElementById("url_gambar").value ||
          "/placeholder.svg?height=200&width=200",
        deskripsi: document.getElementById("deskripsi").value,
        bahan: selectedBahan,
      };

      products.push(newProduct);
      renderProducts();
      closeModal();
      showNotification("Barang berhasil ditambahkan!");
    });
}

function editProduct(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  openModal("Edit Barang", getProductForm(product));

  document
    .getElementById("product-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const selectedBahan = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => materials.find((m) => m.id === parseInt(cb.value)));

      const index = products.findIndex((p) => p.id === id);
      products[index] = {
        ...products[index],
        nama_barang: document.getElementById("nama_barang").value,
        url_gambar:
          document.getElementById("url_gambar").value ||
          "/placeholder.svg?height=200&width=200",
        deskripsi: document.getElementById("deskripsi").value,
        bahan: selectedBahan,
      };

      renderProducts();
      closeModal();
      showNotification("Barang berhasil diupdate!");
    });
}

function deleteProduct(id) {
  if (confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
    products = products.filter((p) => p.id !== id);
    renderProducts();
    showNotification("Barang berhasil dihapus!");
  }
}

// Material Functions
function renderMaterials() {
  const table = document.getElementById("materials-table");
  table.innerHTML = materials
    .map(
      (material) => `
                <tr class="border-b">
                    <td class="p-4 font-medium">${material.nama_bahan}</td>
                    <td class="p-4 text-gray-600">${
                      material.deskripsi || ""
                    }</td>
                    <td class="p-4">
                        <div class="flex space-x-2">
                            <button onclick="editMaterial(${
                              material.id
                            })" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteMaterial(${
                              material.id
                            })" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
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
                        <input type="text" id="nama_bahan" value="${
                          material ? material.nama_bahan : ""
                        }" 
                            class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Deskripsi</label>
                        <textarea id="deskripsi" rows="3" 
                            class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">${
                              material ? material.deskripsi : ""
                            }</textarea>
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

function addMaterial() {
  openModal("Tambah Bahan Baru", getMaterialForm());

  document
    .getElementById("material-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const newMaterial = {
        id: materials.length + 1,
        nama_bahan: document.getElementById("nama_bahan").value,
        deskripsi: document.getElementById("deskripsi").value,
      };

      materials.push(newMaterial);
      renderMaterials();
      closeModal();
      showNotification("Bahan berhasil ditambahkan!");
    });
}

function editMaterial(id) {
  const material = materials.find((m) => m.id === id);
  if (!material) return;

  openModal("Edit Bahan", getMaterialForm(material));

  document
    .getElementById("material-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const index = materials.findIndex((m) => m.id === id);
      materials[index] = {
        ...materials[index],
        nama_bahan: document.getElementById("nama_bahan").value,
        deskripsi: document.getElementById("deskripsi").value,
      };

      renderMaterials();
      closeModal();
      showNotification("Bahan berhasil diupdate!");
    });
}

function deleteMaterial(id) {
  if (confirm("Apakah Anda yakin ingin menghapus bahan ini?")) {
    materials = materials.filter((m) => m.id !== id);
    renderMaterials();
    showNotification("Bahan berhasil dihapus!");
  }
}

// Order Functions
function renderOrders(filteredOrders = null) {
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
                        <td class="p-4">${order.user_name}</td>
                        <td class="p-4">${order.nama_barang} (${
        order.quantity
      })</td>
                        <td class="p-4">Rp ${order.total_price.toLocaleString(
                          "id-ID"
                        )}</td>
                        <td class="p-4">
                            <select onchange="updateOrderStatus(${
                              order.id
                            }, this.value)" 
                                class="border rounded px-2 py-1 text-xs ${
                                  statusColors[order.status] || "bg-gray-100"
                                }">
                                <option value="pending" ${
                                  order.status === "pending" ? "selected" : ""
                                }>Menunggu</option>
                                <option value="processing" ${
                                  order.status === "processing"
                                    ? "selected"
                                    : ""
                                }>Diproses</option>
                                <option value="shipped" ${
                                  order.status === "shipped" ? "selected" : ""
                                }>Dikirim</option>
                                <option value="completed" ${
                                  order.status === "completed" ? "selected" : ""
                                }>Selesai</option>
                                <option value="cancelled" ${
                                  order.status === "cancelled" ? "selected" : ""
                                }>Dibatalkan</option>
                            </select>
                        </td>
                        <td class="p-4">${new Date(
                          order.created_at
                        ).toLocaleDateString("id-ID")}</td>
                        <td class="p-4">
                            <button onclick="viewOrder(${
                              order.id
                            })" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
    })
    .join("");
}

function updateOrderStatus(orderId, newStatus) {
  const index = orders.findIndex((o) => o.id === orderId);
  if (index !== -1) {
    orders[index].status = newStatus;
    renderOrders();
    showNotification("Status pesanan berhasil diupdate!");
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
                            <p class="text-gray-900">Rp ${order.total_price.toLocaleString(
                              "id-ID"
                            )}</p>
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
  const searchTerm = document
    .getElementById("order-search")
    .value.toLowerCase();
  const statusFilter = document.getElementById("status-filter").value;

  return orders.filter((order) => {
    const matchesSearch =
      order.id.toString().includes(searchTerm) ||
      order.user_name.toLowerCase().includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

// Stock Functions
function renderStocks() {
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
                    <td class="p-4">${new Date(
                      stock.created_at
                    ).toLocaleDateString("id-ID")}</td>
                    <td class="p-4">
                        <div class="flex space-x-2">
                            <button onclick="editStock(${
                              stock.id
                            })" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteStock(${
                              stock.id
                            })" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `
    )
    .join("");
}

function getStockForm(stock = null) {
  const productOptions = products
    .map(
      (product) =>
        `<option value="${product.nama_barang}" ${
          stock && stock.nama_barang === product.nama_barang ? "selected" : ""
        }>${product.nama_barang}</option>`
    )
    .join("");

  return `
                <form id="stock-form" class="space-y-4">
                    <div>
                        <label class="block text-gray-700 mb-2">Barang</label>
                        <select id="nama_barang" class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                            <option value="">Pilih barang</option>
                            ${productOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Warna</label>
                        <input type="text" id="color" value="${
                          stock ? stock.color : ""
                        }" placeholder="Hitam" 
                            class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Ukuran</label>
                        <select id="size" class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                            <option value="">Pilih ukuran</option>
                            <option value="XS" ${
                              stock && stock.size === "XS" ? "selected" : ""
                            }>XS</option>
                            <option value="S" ${
                              stock && stock.size === "S" ? "selected" : ""
                            }>S</option>
                            <option value="M" ${
                              stock && stock.size === "M" ? "selected" : ""
                            }>M</option>
                            <option value="L" ${
                              stock && stock.size === "L" ? "selected" : ""
                            }>L</option>
                            <option value="XL" ${
                              stock && stock.size === "XL" ? "selected" : ""
                            }>XL</option>
                            <option value="XXL" ${
                              stock && stock.size === "XXL" ? "selected" : ""
                            }>XXL</option>
                            <option value="One Size" ${
                              stock && stock.size === "One Size"
                                ? "selected"
                                : ""
                            }>One Size</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Jumlah</label>
                        <input type="number" id="quantity" value="${
                          stock ? stock.quantity : ""
                        }" min="1" 
                            class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Keterangan</label>
                        <textarea id="description" rows="3" placeholder="Restock Jaket B" 
                            class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">${
                              stock ? stock.description : ""
                            }</textarea>
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

function addStock() {
  openModal("Tambah Stok Barang", getStockForm());

  document
    .getElementById("stock-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const newStock = {
        id: stocks.length + 1,
        nama_barang: document.getElementById("nama_barang").value,
        color: document.getElementById("color").value,
        size: document.getElementById("size").value,
        quantity: parseInt(document.getElementById("quantity").value),
        description: document.getElementById("description").value,
        created_at: new Date().toISOString(),
      };

      stocks.push(newStock);
      renderStocks();
      closeModal();
      showNotification("Stok berhasil ditambahkan!");
    });
}

function editStock(id) {
  const stock = stocks.find((s) => s.id === id);
  if (!stock) return;

  openModal("Edit Stok", getStockForm(stock));

  document
    .getElementById("stock-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const index = stocks.findIndex((s) => s.id === id);
      stocks[index] = {
        ...stocks[index],
        nama_barang: document.getElementById("nama_barang").value,
        color: document.getElementById("color").value,
        size: document.getElementById("size").value,
        quantity: parseInt(document.getElementById("quantity").value),
        description: document.getElementById("description").value,
      };

      renderStocks();
      closeModal();
      showNotification("Stok berhasil diupdate!");
    });
}

function deleteStock(id) {
  if (confirm("Apakah Anda yakin ingin menghapus stok ini?")) {
    stocks = stocks.filter((s) => s.id !== id);
    renderStocks();
    showNotification("Stok berhasil dihapus!");
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  // Navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      switchTab(this.dataset.tab);
    });
  });

  // Mobile menu
  document.getElementById("menu-toggle").addEventListener("click", function () {
    document.getElementById("sidebar").classList.remove("-translate-x-full");
    document.getElementById("sidebar-overlay").classList.remove("hidden");
  });

  document
    .getElementById("close-sidebar")
    .addEventListener("click", function () {
      document.getElementById("sidebar").classList.add("-translate-x-full");
      document.getElementById("sidebar-overlay").classList.add("hidden");
    });

  document
    .getElementById("sidebar-overlay")
    .addEventListener("click", function () {
      document.getElementById("sidebar").classList.add("-translate-x-full");
      this.classList.add("hidden");
    });

  // Modal
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("modal").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });

  // Add buttons
  document
    .getElementById("add-product-btn")
    .addEventListener("click", addProduct);
  document
    .getElementById("add-material-btn")
    .addEventListener("click", addMaterial);
  document.getElementById("add-stock-btn").addEventListener("click", addStock);

  // Order filters
  document
    .getElementById("order-search")
    .addEventListener("input", function () {
      const filteredOrders = getFilteredOrders();
      renderOrders(filteredOrders);
    });

  document
    .getElementById("status-filter")
    .addEventListener("change", function () {
      const filteredOrders = getFilteredOrders();
      renderOrders(filteredOrders);
    });

  // Initial render
  renderProducts();
  renderMaterials();
  renderOrders();
  renderStocks();
});
