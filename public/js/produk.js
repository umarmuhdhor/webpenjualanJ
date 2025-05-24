let stockData = []; // akan diisi dari fetch

// Ambil ID dari URL
const barangId = new URLSearchParams(window.location.search).get("id");

async function initStockSelection() {
const res = await fetch("http://localhost:3000/api/stok");
stockData = await res.json();

// Filter hanya untuk barang ini
const filtered = stockData.filter(item => item.barang_id === parseInt(barangId));

// Ambil semua warna unik
const colors = [...new Set(filtered.map(item => item.color))];

const colorSelect = document.getElementById("color");
colorSelect.innerHTML = '<option value="">-- Pilih Warna --</option>';

colors.forEach(color => {
    const hasStock = filtered.some(item => item.color === color && item.quantity > 0);
    if (hasStock) {
    const option = document.createElement("option");
    option.value = color;
    option.textContent = color;
    colorSelect.appendChild(option);
    }
});

colorSelect.addEventListener("change", function () {
    populateSizeOptions(this.value);
});

document.getElementById("size").addEventListener("change", function () {
    handleQuantityEnable(colorSelect.value, this.value);
});
}

function populateSizeOptions(selectedColor) {
const sizeSelect = document.getElementById("size");
sizeSelect.disabled = false;
sizeSelect.innerHTML = '<option value="">-- Pilih Ukuran --</option>';

const sizes = stockData
    .filter(item => item.color === selectedColor && item.barang_id === parseInt(barangId))
    .filter(item => item.quantity > 0)
    .map(item => item.size);

// Unikkan
const uniqueSizes = [...new Set(sizes)];

uniqueSizes.forEach(size => {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size;
    sizeSelect.appendChild(option);
});

// Reset quantity input
document.getElementById("quantity").value = "";
document.getElementById("quantity").disabled = true;
}

function handleQuantityEnable(color, size) {
const stockItem = stockData.find(item =>
    item.barang_id === parseInt(barangId) &&
    item.color === color &&
    item.size === size
);

const qtyInput = document.getElementById("quantity");
if (stockItem && stockItem.quantity > 0) {
    qtyInput.disabled = false;
    qtyInput.max = stockItem.quantity;
    qtyInput.min = stockItem.min_quantity || 0;
    qtyInput.placeholder = `Max: ${stockItem.quantity}`;
} else {
    qtyInput.disabled = true;
    qtyInput.placeholder = "Stok tidak tersedia";
}
}

// Jalankan saat page siap
window.addEventListener("DOMContentLoaded", initStockSelection);

