const API_BASE_URL = 'http://localhost:3000/api';

// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notificationText.textContent = message;
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg transition-opacity duration-300 z-50 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white opacity-100`;
    
    setTimeout(() => {
        notification.classList.add('opacity-0');
    }, 3000);
}

function openModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

async function fetchWithAuth(url, options = {}) {
    const headers = getAuthHeaders();
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        return data;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    }
}

// Navigation Functions
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-primary');
    });
    
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('bg-primary');
    
    const titles = {
        products: 'Manajemen Barang',
        materials: 'Manajemen Bahan',
        orders: 'Manajemen Pesanan',
        stocks: 'Manajemen Stok'
    };
    document.getElementById('page-title').textContent = titles[tabName];
}

// Product Functions
async function renderProducts() {
    try {
        const data = await fetchWithAuth(`${API_BASE_URL}/barang`);
        const grid = document.getElementById('products-grid');
        grid.innerHTML = data.barang.map(product => {
            const bahanNames = product.bahan.map(b => b.nama_bahan).join(', ');
            return `
                <div class="border rounded-lg p-4 space-y-4">
                    <img src="${product.url_gambar || '/placeholder.svg?height=200&width=200'}" alt="${product.nama_barang}" class="w-full h-48 object-cover rounded">
                    <div>
                        <h3 class="font-semibold text-lg">${product.nama_barang}</h3>
                        <p class="text-gray-600 text-sm">${product.deskripsi || ''}</p>
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
        }).join('');
    } catch (error) {
        console.error('Error rendering products:', error);
    }
}

async function getProductForm(product = null) {
    try {
        const materials = await fetchWithAuth(`${API_BASE_URL}/bahan`);
        const materialCheckboxes = materials.bahan.map(material => `
            <div class="flex items-center space-x-2">
                <input type="checkbox" id="bahan-${material.id}" value="${material.id}" 
                    ${product && product.bahan.some(b => b.id === material.id) ? 'checked' : ''}>
                <label for="bahan-${material.id}" class="text-sm">${material.nama_bahan}</label>
            </div>
        `).join('');

        return `
            <form id="product-form" class="space-y-4">
                <div>
                    <label class="block text-gray-700 mb-2">Nama Barang</label>
                    <input type="text" id="nama_barang" value="${product ? product.nama_barang : ''}" 
                        class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">URL Gambar</label>
                    <input type="text" id="url_gambar" value="${product ? product.url_gambar : ''}" 
                        placeholder="/images/jaket_b.jpg"
                        class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Deskripsi</label>
                    <textarea id="deskripsi" rows="3" 
                        class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">${product ? product.deskripsi : ''}</textarea>
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
                        ${product ? 'Update' : 'Tambah'} Barang
                    </button>
                </div>
            </form>
        `;
    } catch (error) {
        showNotification('Gagal memuat daftar bahan', 'error');
        return '';
    }
}

async function addProduct() {
    openModal('Tambah Barang Baru', await getProductForm());
    
    document.getElementById('product-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            nama_barang: document.getElementById('nama_barang').value,
            url_gambar: document.getElementById('url_gambar').value || null,
            deskripsi: document.getElementById('deskripsi').value || null,
            bahan_ids: Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value))
        };
        
        try {
            await fetchWithAuth(`${API_BASE_URL}/barang`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            await renderProducts();
            closeModal();
            showNotification('Barang berhasil ditambahkan!');
        } catch (error) {
            console.error('Error adding product:', error);
        }
    });
}

async function editProduct(id) {
    try {
        const product = await fetchWithAuth(`${API_BASE_URL}/barang/${id}`);
        openModal('Edit Barang', await getProductForm(product));
        
        document.getElementById('product-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                nama_barang: document.getElementById('nama_barang').value,
                url_gambar: document.getElementById('url_gambar').value || null,
                deskripsi: document.getElementById('deskripsi').value || null,
                bahan_ids: Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value))
            };
            
            try {
                await fetchWithAuth(`${API_BASE_URL}/barang/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(formData)
                });
                await renderProducts();
                closeModal();
                showNotification('Barang berhasil diupdate!');
            } catch (error) {
                console.error('Error updating product:', error);
            }
        });
    } catch (error) {
        console.error('Error fetching product:', error);
    }
}

async function deleteProduct(id) {
    if (confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
        try {
            await fetchWithAuth(`${API_BASE_URL}/barang/${id}`, {
                method: 'DELETE'
            });
            await renderProducts();
            showNotification('Barang berhasil dihapus!');
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }
}

// Material Functions
async function renderMaterials() {
    try {
        const data = await fetchWithAuth(`${API_BASE_URL}/bahan`);
        const table = document.getElementById('materials-table');
        table.innerHTML = data.bahan.map(material => `
            <tr class="border-b">
                <td class="p-4 font-medium">${material.nama_bahan}</td>
                <td class="p-4 text-gray-600">${material.deskripsi || ''}</td>
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
        `).join('');
    } catch (error) {
        console.error('Error rendering materials:', error);
    }
}

function getMaterialForm(material = null) {
    return `
        <form id="material-form" class="space-y-4">
            <div>
                <label class="block text-gray-700 mb-2">Nama Bahan</label>
                <input type="text" id="nama_bahan" value="${material ? material.nama_bahan : ''}" 
                    class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
            </div>
            <div>
                <label class="block text-gray-700 mb-2">Deskripsi</label>
                <textarea id="deskripsi" rows="3" 
                    class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">${material ? material.deskripsi : ''}</textarea>
            </div>
            <div class="flex justify-end space-x-2">
                <button type="button" onclick="closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                    Batal
                </button>
                <button type="submit" class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
                    ${material ? 'Update' : 'Tambah'} Bahan
                </button>
            </div>
        </form>
    `;
}

async function addMaterial() {
    openModal('Tambah Bahan Baru', getMaterialForm());
    
    document.getElementById('material-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            nama_bahan: document.getElementById('nama_bahan').value,
            deskripsi: document.getElementById('deskripsi').value || null
        };
        
        try {
            await fetchWithAuth(`${API_BASE_URL}/bahan`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            await renderMaterials();
            await renderProducts(); // Re-render products to update bahan references
            closeModal();
            showNotification('Bahan berhasil ditambahkan!');
        } catch (error) {
            console.error('Error adding material:', error);
        }
    });
}

async function editMaterial(id) {
    try {
        const material = await fetchWithAuth(`${API_BASE_URL}/bahan/${id}`);
        openModal('Edit Bahan', getMaterialForm(material));
        
        document.getElementById('material-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                nama_bahan: document.getElementById('nama_bahan').value,
                deskripsi: document.getElementById('deskripsi').value || null
            };
            
            try {
                await fetchWithAuth(`${API_BASE_URL}/bahan/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(formData)
                });
                await renderMaterials();
                await renderProducts(); // Re-render products to update bahan references
                closeModal();
                showNotification('Bahan berhasil diupdate!');
            } catch (error) {
                console.error('Error updating material:', error);
            }
        });
    } catch (error) {
        console.error('Error fetching material:', error);
    }
}

async function deleteMaterial(id) {
    if (confirm('Apakah Anda yakin ingin menghapus bahan ini?')) {
        try {
            await fetchWithAuth(`${API_BASE_URL}/bahan/${id}`, {
                method: 'DELETE'
            });
            await renderMaterials();
            await renderProducts(); // Re-render products to update bahan references
            showNotification('Bahan berhasil dihapus!');
        } catch (error) {
            console.error('Error deleting material:', error);
        }
    }
}

// Order Functions
async function renderOrders(filteredOrders = null) {
    try {
        const orders = filteredOrders || (await fetchWithAuth(`${API_BASE_URL}/orders`));
        const table = document.getElementById('orders-table');
        table.innerHTML = orders.map(order => {
            const statusColors = {
                diterima: 'bg-yellow-100 text-yellow-800',
                diproses: 'bg-blue-100 text-blue-800',
                selesai: 'bg-green-100 text-green-800',
                dibatalkan: 'bg-red-100 text-red-800'
            };
            
            const statusTexts = {
                diterima: 'Diterima',
                diproses: 'Diproses',
                selesai: 'Selesai',
                dibatalkan: 'Dibatalkan'
            };
            
            return `
                <tr class="border-b">
                    <td class="p-4 font-medium">${order.id}</td>
                    <td class="p-4">${order.user_name || 'Unknown'}</td>
                    <td class="p-4">${order.nama_barang} (${order.quantity})</td>
                    <td class="p-4">Rp ${order.total_price.toLocaleString('id-ID')}</td>
                    <td class="p-4">
                        <select onchange="updateOrderStatus(${order.id}, this.value)" 
                            class="border rounded px-2 py-1 text-xs ${statusColors[order.status] || 'bg-gray-100'}">
                            <option value="diterima" ${order.status === 'diterima' ? 'selected' : ''}>Diterima</option>
                            <option value="diproses" ${order.status === 'diproses' ? 'selected' : ''}>Diproses</option>
                            <option value="selesai" ${order.status === 'selesai' ? 'selected' : ''}>Selesai</option>
                            <option value="dibatalkan" ${order.status === 'dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
                        </select>
                    </td>
                    <td class="p-4">${new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                    <td class="p-4">
                        <button class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering orders:', error);
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });
        await renderOrders();
        showNotification('Status pesanan berhasil diupdate!');
    } catch (error) {
        console.error('Error updating order status:', error);
    }
}

async function getFilteredOrders() {
    const searchTerm = document.getElementById('order-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    
    try {
        const orders = await fetchWithAuth(`${API_BASE_URL}/orders`);
        return orders.filter(order => {
            const matchesSearch = order.id.toString().includes(searchTerm) || 
                                (order.user_name || '').toLowerCase().includes(searchTerm);
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    } catch (error) {
        console.error('Error filtering orders:', error);
        return [];
    }
}

// Stock Functions
async function renderStocks() {
    try {
        const data = await fetchWithAuth(`${API_BASE_URL}/stock`);
        const table = document.getElementById('stocks-table');
        table.innerHTML = data.stocks.map(stock => `
            <tr class="border-b">
                <td class="p-4 font-medium">${stock.nama_barang}</td>
                <td class="p-4">${stock.color}</td>
                <td class="p-4">${stock.size}</td>
                <td class="p-4">${stock.quantity}</td>
                <td class="p-4">${stock.description || ''}</td>
                <td class="p-4">${new Date(stock.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error rendering stocks:', error);
    }
}

async function getStockForm() {
    try {
        const products = await fetchWithAuth(`${API_BASE_URL}/barang`);
        const productOptions = products.barang.map(product => 
            `<option value="${product.id}">${product.nama_barang}</option>`
        ).join('');
        
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
                    <input type="text" id="color" placeholder="Hitam" 
                        class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Ukuran</label>
                    <select id="size" class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                        <option value="">Pilih ukuran</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Jumlah</label>
                    <input type="number" id="quantity" min="1" 
                        class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required>
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Keterangan</label>
                    <textarea id="description" rows="3" placeholder="Restock Jaket B" 
                        class="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                        Batal
                    </button>
                    <button type="submit" class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
                        Tambah Stok
                    </button>
                </div>
            </form>
        `;
    } catch (error) {
        showNotification('Gagal memuat daftar barang', 'error');
        return '';
    }
}

async function addStock() {
    openModal('Tambah Stok Barang', await getStockForm());
    
    document.getElementById('stock-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            barang_id: parseInt(document.getElementById('barang_id').value),
            color: document.getElementById('color').value,
            size: document.getElementById('size').value,
            quantity: parseInt(document.getElementById('quantity').value),
            description: document.getElementById('description').value || null
        };
        
        try {
            await fetchWithAuth(`${API_BASE_URL}/stock`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            await renderStocks();
            closeModal();
            showNotification('Stok berhasil ditambahkan!');
        } catch (error) {
            console.error('Error adding stock:', error);
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check for token
    if (!localStorage.getItem('token')) {
        showNotification('Silakan login terlebih dahulu', 'error');
        // Optionally redirect to login page
        // window.location.href = '/login.html';
        return;
    }
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // Mobile menu
    document.getElementById('menu-toggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.remove('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.remove('hidden');
    });
    
    document.getElementById('close-sidebar').addEventListener('click', function() {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.add('hidden');
    });
    
    document.getElementById('sidebar-overlay').addEventListener('click', function() {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        this.classList.add('hidden');
    });
    
    // Modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Add buttons
    document.getElementById('add-product-btn').addEventListener('click', addProduct);
    document.getElementById('add-material-btn').addEventListener('click', addMaterial);
    document.getElementById('add-stock-btn').addEventListener('click', addStock);
    
    // Order filters
    document.getElementById('order-search').addEventListener('input', async function() {
        const filteredOrders = await getFilteredOrders();
        renderOrders(filteredOrders);
    });
    
    document.getElementById('status-filter').addEventListener('change', async function() {
        const filteredOrders = await getFilteredOrders();
        renderOrders(filteredOrders);
    });
    
    // Initial render
    renderProducts();
    renderMaterials();
    renderOrders();
    renderStocks();
});

// Simple login function (for testing, implement a proper login form)
async function loginAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123'
            })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            showNotification('Login berhasil!');
            // Reload to initialize with token
            window.location.reload();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Gagal login', 'error');
    }
}