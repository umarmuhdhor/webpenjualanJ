/**
 * API Service untuk Graha Advertising
 * File ini berisi semua fungsi yang berhubungan dengan API calls
 */

// Base URL untuk API
const API_BASE_URL = "http://localhost:3000/api"
/**
 * Fungsi untuk melakukan request ke API
 * @param {string} endpoint - Endpoint API
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - Data yang akan dikirim (untuk POST/PUT)
 * @returns {Promise} - Promise yang berisi response dari API
 */
async function apiRequest(endpoint, method = "GET", data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Tambahkan token auth jika ada
  const token = localStorage.getItem("authToken");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  // Tambahkan body jika method bukan GET
  if (method !== "GET" && data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`API Request: ${method} ${url}`, data ? { data } : {});
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error("API request timed out");
    }, 5000); // Timeout setelah 5 detik

    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    const responseData = await response.json();
    console.log(`API Response: ${response.status}`, responseData);

    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || `Server error: ${response.status}`);
    }

    return responseData;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please check your network or server status.");
    }
    console.error("API Request Error:", error.message, error.stack);
    throw error;
  }
}

// Auth API
const authAPI = {
  /**
   * Login user
   * @param {string} email - Email user
   * @param {string} password - Password user
   * @returns {Promise} - Promise yang berisi data user dan token
   */
  login: async (email, password) => {
    return await apiRequest("/auth/login", "POST", { email, password })
  },

  /**
   * Register user
   * @param {object} userData - Data user (name, email, password, phone_number)
   * @returns {Promise} - Promise yang berisi data user
   */
  register: async (userData) => {
    return await apiRequest("/auth/register", "POST", userData)
  },

  /**
   * Logout user
   * @returns {Promise} - Promise yang berisi status logout
   */
  logout: async () => {
    return await apiRequest("/auth/logout", "POST")
  },
}

// Product API
const productAPI = {
  /**
   * Get all products
   * @returns {Promise} - Promise yang berisi list product
   */
  getProducts: async () => {
    return await apiRequest("/products")
  },

  /**
   * Get product by ID
   * @param {string} id - ID product
   * @returns {Promise} - Promise yang berisi detail product
   */
  getProductById: async (id) => {
    return await apiRequest(`/products/${id}`)
  },
}

// Order API
const orderAPI = {
  /**
   * Create new order
   * @param {object} orderData - Data order
   * @returns {Promise} - Promise yang berisi data order
   */
  createOrder: async (orderData) => {
    return await apiRequest("/orders", "POST", orderData)
  },

  /**
   * Get user orders
   * @returns {Promise} - Promise yang berisi list order user
   */
  getUserOrders: async () => {
    return await apiRequest("/orders/user")
  },
}

// Export semua API
export { authAPI, productAPI, orderAPI }
