/**
 * Products API Dashboard - Application Logic
 */

// API Configuration
const API_BASE = window.location.origin;

// State
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';
let searchTimeout = null;

// Bootstrap Modal Instance
let productModal = null;

// Chart Instances
let trafficChart = null;
let responseChart = null;

/**
 * Initialize application on DOM ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Set base URL display
    document.getElementById('baseUrl').textContent = API_BASE;
    
    // Initialize Bootstrap modal
    productModal = new bootstrap.Modal(document.getElementById('productModal'));
    
    // Setup event listeners
    setupEventListeners();

    // Initialize Charts
    initCharts();
    
    // Load initial data
    loadProducts();
    loadHealth();
    
    // Refresh health and charts periodically
    setInterval(() => {
        loadHealth();
        updateCharts();
    }, 5000); // 5 seconds for quicker updates
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Search input with debounce
    document.getElementById('searchInput').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
            searchQuery = document.getElementById('searchInput').value;
            currentPage = 1;
            loadProducts();
        }, 300);
    });
    
    // Pagination buttons
    document.getElementById('prevBtn').addEventListener('click', function() {
        changePage(-1);
    });
    
    document.getElementById('nextBtn').addEventListener('click', function() {
        changePage(1);
    });
    
    // Form submission on Enter
    document.getElementById('productForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProduct();
    });
}

/**
 * Initialize Charts
 */
function initCharts() {
    // Traffic Chart (Line Chart)
    const trafficCtx = document.getElementById('trafficChart').getContext('2d');
    trafficChart = new Chart(trafficCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Requests/min',
                data: [],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
                x: { grid: { display: false } }
            }
        }
    });

    // Response Time Chart (Bar Chart)
    const responseCtx = document.getElementById('responseChart').getContext('2d');
    responseChart = new Chart(responseCtx, {
        type: 'bar',
        data: {
            labels: ['GET', 'POST', 'PUT', 'DELETE'],
            datasets: [{
                label: 'Avg Response Time (ms)',
                data: [45, 120, 85, 60], // Initial dummy data
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/**
 * Update Charts with simulated live data
 */
function updateCharts() {
    const now = new Date().toLocaleTimeString();
    
    // Update Traffic Chart
    const trafficData = trafficChart.data.datasets[0].data;
    const labels = trafficChart.data.labels;
    
    if (labels.length > 10) {
        labels.shift();
        trafficData.shift();
    }
    
    labels.push(now);
    // Simulate varying traffic between 10-50 requests/min
    trafficData.push(Math.floor(Math.random() * 40) + 10);
    
    trafficChart.update();

    // Update Response Time Chart
    const responseData = responseChart.data.datasets[0].data;
    // Simulate slight variations
    responseData[0] = Math.floor(Math.random() * 20) + 30; // GET
    responseData[1] = Math.floor(Math.random() * 40) + 100; // POST
    responseData[2] = Math.floor(Math.random() * 30) + 70; // PUT
    responseData[3] = Math.floor(Math.random() * 20) + 50; // DELETE
    
    responseChart.update();
}


/**
 * Load products from API
 */
async function loadProducts() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 5
        });
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }

        const response = await fetch(`${API_BASE}/api/products?${params}`);
        const data = await response.json();

        if (data.success) {
            renderProducts(data.data);
            updatePagination(data.meta.pagination);
            document.getElementById('productCount').textContent = data.meta.pagination.total;
            
            // Update rate limit display
            const rateLimit = response.headers.get('X-RateLimit-Remaining');
            const rateLimitMax = response.headers.get('X-RateLimit-Limit');
            if (rateLimit && rateLimitMax) {
                document.getElementById('rateLimit').textContent = `${rateLimit}/${rateLimitMax}`;
            }
        }
    } catch (error) {
        console.error('Failed to load products:', error);
        showToast('Failed to load products', 'error');
    }
}

/**
 * Render products in table
 */
function renderProducts(products) {
    const tbody = document.getElementById('productsList');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-state">
                    <div class="empty-state-icon">
                        <i class="bi bi-inbox"></i>
                    </div>
                    <p class="text-muted mb-3">No products found</p>
                    <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#productModal" onclick="resetForm()">
                        <i class="bi bi-plus-lg me-1"></i> Add your first product
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(function(product) {
        return `
            <tr>
                <td class="ps-3">
                    <div class="product-title">${escapeHtml(product.title)}</div>
                    <p class="product-description">${escapeHtml(product.description)}</p>
                </td>
                <td>
                    <span class="price-tag">$${product.price ? product.price.toFixed(2) : '0.00'}</span>
                </td>
                <td class="text-end pe-3">
                    <div class="action-buttons" style="display:flex; justify-content: flex-end; gap: 0.5rem">
                        <button class="btn btn-outline-secondary btn-sm" onclick="editProduct('${product.id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct('${product.id}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update pagination controls
 */
function updatePagination(pagination) {
    currentPage = pagination.page;
    totalPages = pagination.totalPages;
    
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages || 1}`;
    document.getElementById('prevBtn').disabled = !pagination.hasPrev;
    document.getElementById('nextBtn').disabled = !pagination.hasNext;
}

/**
 * Change page
 */
function changePage(delta) {
    currentPage += delta;
    loadProducts();
}

/**
 * Load health information
 */
async function loadHealth() {
    try {
        const [healthRes, detailedRes, liveRes] = await Promise.all([
            fetch(`${API_BASE}/health`),
            fetch(`${API_BASE}/health/detailed`),
            fetch(`${API_BASE}/health/live`)
        ]);

        const health = await healthRes.json();
        const detailed = await detailedRes.json();
        const live = await liveRes.json();

        const isHealthy = health.status === 'healthy';
        const environment = detailed.env || 'development';
        
        // Update status displays
        document.getElementById('healthStatus').textContent = isHealthy ? 'Healthy' : 'Unhealthy';
        const healthDot = document.getElementById('healthDot');
        if (healthDot) healthDot.className = 'health-dot ' + (isHealthy ? 'healthy' : 'unhealthy');
        const healthText = document.getElementById('healthText');
        if (healthText) healthText.textContent = isHealthy ? 'System Operational' : 'System Issues';
        
        // Update details panel
        const detailsContainer = document.getElementById('healthDetails');
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div style="display: grid; gap: 0.75rem; font-size: 0.875rem;">
                    <div style="display:flex; justify-content:space-between; border-bottom: 1px dashed var(--gray-200); padding-bottom: 0.5rem;">
                        <span style="color:var(--gray-500)">Environment</span>
                        <span style="font-weight:600; text-transform:capitalize">${environment}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; border-bottom: 1px dashed var(--gray-200); padding-bottom: 0.5rem;">
                         <span style="color:var(--gray-500)">Memory Usage</span>
                         <span style="font-weight:600">${detailed.memory?.rss || '0 MB'}</span>
                    </div>
                     <div style="display:flex; justify-content:space-between; border-bottom: 1px dashed var(--gray-200); padding-bottom: 0.5rem;">
                         <span style="color:var(--gray-500)">Node Version</span>
                         <span style="font-weight:600">${detailed.node || '-'}</span>
                    </div>
                     <div style="display:flex; justify-content:space-between;">
                         <span style="color:var(--gray-500)">PID</span>
                         <span style="font-weight:600">${detailed.pid || '-'}</span>
                    </div>
                </div>
            `;
        }

        // Format uptime
        const uptime = live.uptime;
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        // Update uptime display
        const uptimeEl = document.getElementById('uptime');
        if (uptimeEl) uptimeEl.textContent = `${hours}h ${minutes}m`;
        
    } catch (error) {
        console.error('Failed to load health info:', error);
    }
}

// Function to reset form
window.resetForm = function() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModalLabel').innerHTML = '<i class="bi bi-plus-circle text-primary"></i> Add New Product';
};

// Function to edit product
window.editProduct = async function(id) {
    try {
        const response = await fetch(`${API_BASE}/api/products/${id}`);
        const result = await response.json();
        
        if (result.success) {
            const product = result.data;
            document.getElementById('productId').value = product.id;
            document.getElementById('title').value = product.title;
            document.getElementById('description').value = product.description;
            document.getElementById('price').value = product.price;
            
            document.getElementById('productModalLabel').innerHTML = '<i class="bi bi-pencil text-primary"></i> Edit Product';
            productModal.show();
        }
    } catch (error) {
        showToast('Failed to load product details', 'error');
    }
};

// Function to save product
window.saveProduct = async function() {
    const id = document.getElementById('productId').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const price = parseFloat(document.getElementById('price').value);
    
    if (!title || !description || isNaN(price)) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    const productData = { title, description, price };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/api/products/${id}` : `${API_BASE}/api/products`;
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            productModal.hide();
            showToast(id ? 'Product updated successfully' : 'Product created successfully', 'success');
            loadProducts();
        } else {
            showToast(result.error?.message || 'Operation failed', 'error');
        }
    } catch (error) {
        showToast('Failed to save product', 'error');
    }
};

// Function to delete product
window.deleteProduct = async function(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/products/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Product deleted successfully', 'success');
            loadProducts();
        } else {
            showToast(result.error?.message || 'Delete failed', 'error');
        }
    } catch (error) {
        showToast('Failed to delete product', 'error');
    }
};

// Function to show toast
window.showToast = function(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHtml;
    toastContainer.appendChild(toastElement.firstElementChild);
    
    const toast = new bootstrap.Toast(toastContainer.lastElementChild);
    toast.show();
    
    // Cleanup DOM
    toastContainer.lastElementChild.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
};

// Helper to escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
