// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDzLwzsVFNaePJxTlYC0j49Bxs9PQswAxQ",
    authDomain: "delever-949b2.firebaseapp.com",
    projectId: "delever-949b2",
    storageBucket: "delever-949b2.firebasestorage.app",
    messagingSenderId: "605444558791",
    appId: "1:605444558791:web:374430be1c0a06170213e2",
    measurementId: "G-EXFJNWLJ0Z"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const mainContent = document.getElementById('main-content');
const wishlistPage = document.getElementById('wishlist-page');
const cartPage = document.getElementById('cart-page');
const adminPanel = document.getElementById('admin-panel');
const authModal = document.getElementById('auth-modal');
const adminLink = document.getElementById('admin-link');
const productsContainer = document.getElementById('products-container');
const wishlistContainer = document.getElementById('wishlist-container');
const cartItemsContainer = document.getElementById('cart-items-container');
const adminProductsList = document.getElementById('admin-products-list');
const adminOrdersList = document.getElementById('admin-orders-list');
const adminUsersList = document.getElementById('admin-users-list');
const adminStats = document.getElementById('admin-stats');
const addProductForm = document.getElementById('add-product-form');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const authText = document.getElementById('auth-text');

// State Management
let currentUser = null;
let isAdmin = false;
let wishlist = [];
let cart = [];
let products = [];
let orders = [];
let users = [];

// Initialize the application
function initApp() {
    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            // Update UI to show user info
            updateUserUI(user);
            loadUserData();

            // Check if user is admin
            checkAdminStatus(user.uid);
        } else {
            currentUser = null;
            isAdmin = false;
            adminLink.style.display = 'none';
            // Hide user info
            userInfo.style.display = 'none';
            authText.textContent = 'Account';
            loadLocalData();
        }
    });

    // Load products
    loadProducts();

    // Load orders and users (for admin)
    loadOrders();
    loadUsers();
}

// Update UI with user information
function updateUserUI(user) {
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        userName.textContent = displayName;
        userInfo.style.display = 'flex';
        authText.textContent = 'Logout';
    } else {
        userInfo.style.display = 'none';
        authText.textContent = 'Account';
    }
}

// Check if user is admin
function checkAdminStatus(uid) {
    db.collection('admins').doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                isAdmin = true;
                adminLink.style.display = 'flex';
            } else {
                isAdmin = false;
                adminLink.style.display = 'none';
            }
        })
        .catch(error => {
            console.error("Error checking admin status: ", error);
        });
}

// Load products from Firestore
function loadProducts() {
    db.collection('products').get()
        .then(snapshot => {
            products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            renderProducts();
            updateAdminProducts();
        })
        .catch(error => {
            console.error("Error loading products: ", error);
        });
}

// Load orders from Firestore
function loadOrders() {
    db.collection('orders').get()
        .then(snapshot => {
            orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            updateAdminOrders();
            updateAdminStats();
        })
        .catch(error => {
            console.error("Error loading orders: ", error);
        });
}

// Load users from Firestore
function loadUsers() {
    db.collection('users').get()
        .then(snapshot => {
            users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            updateAdminUsers();
            updateAdminStats();
        })
        .catch(error => {
            console.error("Error loading users: ", error);
        });
}

// Load user data from Firestore
function loadUserData() {
    if (!currentUser) return;

    // Load wishlist
    db.collection('users').doc(currentUser.uid).collection('wishlist').get()
        .then(snapshot => {
            wishlist = [];
            snapshot.forEach(doc => {
                wishlist.push(doc.id);
            });
            updateWishlistCount();
            updateWishlistIcons();
        })
        .catch(error => {
            console.error("Error loading wishlist: ", error);
        });

    // Load cart
    db.collection('users').doc(currentUser.uid).collection('cart').get()
        .then(snapshot => {
            cart = [];
            snapshot.forEach(doc => {
                cart.push({ id: doc.id, ...doc.data() });
            });
            updateCartCount();
        })
        .catch(error => {
            console.error("Error loading cart: ", error);
        });
}

// Load data from local storage (for demo when not logged in)
function loadLocalData() {
    const localWishlist = localStorage.getItem('wishlist');
    const localCart = localStorage.getItem('cart');

    if (localWishlist) {
        wishlist = JSON.parse(localWishlist);
    }

    if (localCart) {
        cart = JSON.parse(localCart);
    }

    updateWishlistCount();
    updateCartCount();
    updateWishlistIcons();
}

// Save data to local storage (for demo when not logged in)
function saveLocalData() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Page Navigation Functions
function showHomePage() {
    mainContent.style.display = 'block';
    wishlistPage.style.display = 'none';
    cartPage.style.display = 'none';
    adminPanel.style.display = 'none';
}

function showWishlistPage() {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    mainContent.style.display = 'none';
    wishlistPage.style.display = 'block';
    cartPage.style.display = 'none';
    adminPanel.style.display = 'none';
    renderWishlist();
}

function showCartPage() {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    mainContent.style.display = 'none';
    wishlistPage.style.display = 'none';
    cartPage.style.display = 'block';
    adminPanel.style.display = 'none';
    renderCart();
}

function showAdminPanel() {
    if (!isAdmin) {
        openAuthModal();
        switchAuthTab('admin');
        return;
    }
    mainContent.style.display = 'none';
    wishlistPage.style.display = 'none';
    cartPage.style.display = 'none';
    adminPanel.style.display = 'block';
    updateAdminStats();
}

// Auth Modal Functions
function openAuthModal() {
    authModal.style.display = 'flex';
}

function closeAuthModal() {
    authModal.style.display = 'none';
}

function switchAuthTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

    document.querySelector(`.auth-tab:nth-child(${tabName === 'login' ? 1 : tabName === 'register' ? 2 : 3})`).classList.add('active');
    document.getElementById(`${tabName}-form`).classList.add('active');
}

// Admin Panel Functions
function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`.admin-tab:nth-child(${tabName === 'products' ? 1 : tabName === 'orders' ? 2 : tabName === 'users' ? 3 : 4})`).classList.add('active');
    document.getElementById(`admin-${tabName}`).classList.add('active');
}

// Product Functions
function toggleProductDetails(productId) {
    const productCard = document.getElementById(`${productId}-card`);
    if (productCard) {
        productCard.classList.toggle('expanded');
    }
}

function toggleWishlist(button, productId) {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    const heartIcon = button.querySelector('i');
    const isInWishlist = heartIcon.classList.contains('fas');

    if (isInWishlist) {
        // Remove from wishlist
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far');

        const productIndex = wishlist.indexOf(productId);
        if (productIndex !== -1) {
            wishlist.splice(productIndex, 1);
        }

        if (currentUser) {
            db.collection('users').doc(currentUser.uid).collection('wishlist').doc(productId).delete()
                .catch(error => {
                    console.error("Error removing from wishlist: ", error);
                });
        } else {
            saveLocalData();
        }
    } else {
        // Add to wishlist
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        wishlist.push(productId);

        if (currentUser) {
            db.collection('users').doc(currentUser.uid).collection('wishlist').doc(productId).set({
                addedAt: new Date()
            })
                .catch(error => {
                    console.error("Error adding to wishlist: ", error);
                });
        } else {
            saveLocalData();
        }
    }

    updateWishlistCount();
}

function addToCart(productId) {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;

        if (currentUser) {
            db.collection('users').doc(currentUser.uid).collection('cart').doc(productId).update({
                quantity: existingItem.quantity
            })
                .catch(error => {
                    console.error("Error updating cart: ", error);
                });
        } else {
            saveLocalData();
        }
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });

        if (currentUser) {
            db.collection('users').doc(currentUser.uid).collection('cart').doc(productId).set({
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1,
                addedAt: new Date()
            })
                .catch(error => {
                    console.error("Error adding to cart: ", error);
                });
        } else {
            saveLocalData();
        }
    }

    updateCartCount();
    showNotification('Product added to cart!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);

    if (currentUser) {
        db.collection('users').doc(currentUser.uid).collection('cart').doc(productId).delete()
            .catch(error => {
                console.error("Error removing from cart: ", error);
            });
    } else {
        saveLocalData();
    }

    renderCart();
    updateCartCount();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;

        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            if (currentUser) {
                db.collection('users').doc(currentUser.uid).collection('cart').doc(productId).update({
                    quantity: item.quantity
                })
                    .catch(error => {
                        console.error("Error updating quantity: ", error);
                    });
            } else {
                saveLocalData();
            }

            renderCart();
            updateCartCount();
        }
    }
}

// Render Functions
function renderProducts() {
    productsContainer.innerHTML = products.map(product => `
                <div class="product-card" id="${product.id}-card">
                    <div class="product-image" onclick="toggleProductDetails('${product.id}')">
                        <img src="${product.image}" alt="${product.name}">
                        ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                        <div class="wishlist-btn" onclick="toggleWishlist(this, '${product.id}')">
                            <i class="${wishlist.includes(product.id) ? 'fas' : 'far'} fa-heart"></i>
                        </div>
                    </div>
                    <div class="product-info">
                        <h3 class="product-title" onclick="toggleProductDetails('${product.id}')">${product.name}</h3>
                        <div class="product-price">
                            <span class="current-price">₹ ${product.price.toFixed(2)}</span>
                            ${product.oldPrice ? `<span class="old-price">₹ ${product.oldPrice.toFixed(2)}</span>` : ''}
                        </div>
                        <div class="product-actions">
                            <button class="add-to-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                        </div>
                    </div>
                   <div class="product-details">
    <div class="product-specs">
        <h4 class="specs-title">Product Details</h4>
        <ul class="specs-list">
            <li><span>Color:</span> <span>${product.color || '-'}</span></li>
            <li><span>Size:</span> <span>${product.size || '-'}</span></li>
            <li><span>Material:</span> <span>${product.material || '-'}</span></li>
        </ul>
    </div>
</div>

                </div>
            `).join('');
}

function renderWishlist() {
    const emptyWishlist = document.getElementById('empty-wishlist');

    if (wishlist.length === 0) {
        emptyWishlist.style.display = 'block';
        wishlistContainer.innerHTML = '';
        return;
    }

    emptyWishlist.style.display = 'none';
    wishlistContainer.innerHTML = wishlist.map(productId => {
        const product = products.find(p => p.id === productId);
        if (!product) return '';

        return `
                    <div class="product-card">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}">
                            <div class="wishlist-btn" onclick="toggleWishlist(this, '${product.id}')">
                                <i class="fas fa-heart"></i>
                            </div>
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${product.name}</h3>
                            <div class="product-price">
                                <span class="current-price">₹ ${product.price.toFixed(2)}</span>
                            </div>
                            <div class="product-actions">
                                <button class="add-to-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                            </div>
                        </div>
                    </div>
                `;
    }).join('');
}

function renderCart() {
    const emptyCart = document.getElementById('empty-cart');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');

    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        cartSubtotal.textContent = '₹ 0.00';
        cartTotal.textContent = '₹ 0.00';
        return;
    }

    emptyCart.style.display = 'none';
    cartItemsContainer.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return '';

        const subtotal = item.quantity * item.price;
        return `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">${product.name}</h3>
                        <div class="cart-item-price">₹ ${item.price.toFixed(2)}</div>
                        <div class="cart-item-actions">
                            <div class="quantity-control">
                                <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                                <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                                <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                            </div>
                            <button class="remove-from-cart" onclick="removeFromCart('${item.id}')">Remove</button>
                        </div>
                    </div>
                </div>
            `;
    }).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartSubtotal.textContent = `₹ ${total.toFixed(2)}`;
    cartTotal.textContent = `₹ ${total.toFixed(2)}`;
}

function updateWishlistCount() {
    document.querySelector('.wishlist-count').textContent = wishlist.length;
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = totalItems;
}

function updateWishlistIcons() {
    products.forEach(product => {
        const wishlistBtn = document.querySelector(`.wishlist-btn[onclick*="${product.id}"]`);
        if (wishlistBtn) {
            const heartIcon = wishlistBtn.querySelector('i');
            if (wishlist.includes(product.id)) {
                heartIcon.classList.remove('far');
                heartIcon.classList.add('fas');
            } else {
                heartIcon.classList.remove('fas');
                heartIcon.classList.add('far');
            }
        }
    });
}

function updateAdminProducts() {
    if (!adminProductsList) return;

    adminProductsList.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>₹ ${product.price.toFixed(2)}</td>
            <td>${product.stock || 0}</td>
            <td>${product.color || '-'}</td>
            <td>${product.size || '-'}</td>
            <td>${product.material || '-'}</td>
            <td>
                <button class="btn-sm btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn-sm btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}


function updateAdminUsers() {
    if (!adminUsersList) return;

    adminUsersList.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name || 'Unknown'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                    <td>${user.orders || 0}</td>
                    <td>
                        <button class="btn-sm btn-view" onclick="viewUser('${user.id}')">View</button>
                    </td>
                </tr>
            `).join('');
}

function updateAdminStats() {
    if (!adminStats) return;

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalUsers = users.length;
    const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    adminStats.innerHTML = `
                <div class="stat-card">
                    <i class="fas fa-shopping-bag stat-products"></i>
                    <div class="number">${totalProducts}</div>
                    <div class="label">Total Products</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-shopping-cart stat-orders"></i>
                    <div class="number">${totalOrders}</div>
                    <div class="label">Total Orders</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-users stat-users"></i>
                    <div class="number">${totalUsers}</div>
                    <div class="label">Registered Users</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-dollar-sign stat-sales"></i>
                    <div class="number">₹ ${totalSales.toFixed(2)}</div>
                    <div class="label">Total Sales</div>
                </div>
            `;
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'var(--accent)';
    notification.style.color = 'white';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '1000';
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Admin Functions
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Populate the form with product data
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock || 0;
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-color').value = product.color || '';
    document.getElementById('product-size').value = product.size || '';
    document.getElementById('product-material').value = product.material || '';


    // Switch to the add product tab
    switchAdminTab('add-product');

    // Change the form to update mode
    addProductForm.dataset.mode = 'edit';
    addProductForm.dataset.productId = productId;
    addProductForm.querySelector('.form-submit').textContent = 'Update Product';
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        db.collection('products').doc(productId).delete()
            .then(() => {
                showNotification('Product deleted successfully!');
                loadProducts();
            })
            .catch(error => {
                console.error("Error deleting product: ", error);
                showNotification('Error deleting product!');
            });
    }
}

function viewUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    alert(`User Details:\nID: ${user.id}\nName: ${user.name}\nEmail: ${user.email}\nJoined: ${user.createdAt?.toDate().toLocaleDateString()}`);
}

// Event Listeners
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            currentUser = userCredential.user;
            closeAuthModal();
            showNotification('Logged in successfully!');
            updateUserUI(currentUser);
            loadUserData();
        })
        .catch(error => {
            alert('Login failed: ' + error.message);
        });
});

document.getElementById('admin-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Check if user is admin
            return db.collection('admins').doc(userCredential.user.uid).get();
        })
        .then(doc => {
            if (doc.exists) {
                currentUser = auth.currentUser;
                isAdmin = true;
                adminLink.style.display = 'flex';
                closeAuthModal();
                showNotification('Admin access granted!');
                updateUserUI(currentUser);
                showAdminPanel();
            } else {
                auth.signOut();
                alert('You do not have admin privileges');
            }
        })
        .catch(error => {
            alert('Admin login failed: ' + error.message);
        });
});

// Handle account button click (login/logout)
document.querySelector('.action-item').addEventListener('click', function (e) {
    // If user is logged in, log them out when clicking account button
    if (currentUser) {
        e.preventDefault();
        auth.signOut().then(() => {
            showNotification('Logged out successfully!');
        }).catch(error => {
            console.error('Sign out error:', error);
        });
    } else {
        openAuthModal();
    }
});

addProductForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const color = document.getElementById('product-color').value;
    const size = document.getElementById('product-size').value;
    const material = document.getElementById('product-material').value;
    const image = document.getElementById('product-image').value;

    const productData = {
        name,
        price,
        stock,
        color,
        size,
        material,
        image,
        createdAt: new Date()
    };

    if (addProductForm.dataset.mode === 'edit') {
        // update product
        const productId = addProductForm.dataset.productId;
        db.collection('products').doc(productId).update(productData)
            .then(() => {
                showNotification('Product updated successfully!');
                loadProducts();
                switchAdminTab('products');
                addProductForm.reset();
                addProductForm.dataset.mode = '';
            })
            .catch(error => {
                console.error("Error updating product: ", error);
                showNotification('Error updating product!');
            });
    } else {
        // add new product
        db.collection('products').add(productData)
            .then(() => {
                showNotification('Product added successfully!');
                loadProducts();
                addProductForm.reset();
            })
            .catch(error => {
                console.error("Error adding product: ", error);
                showNotification('Error adding product!');
            });
    }
});


document.querySelector('.newsletter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = this.querySelector('input').value;
    if (email) {
        // Add to newsletter collection
        db.collection('newsletter').add({
            email: email,
            subscribedAt: new Date()
        })
            .then(() => {
                showNotification('Thank you for subscribing to our newsletter!');
                this.querySelector('input').value = '';
            })
            .catch(error => {
                console.error("Error subscribing to newsletter: ", error);
            });
    }
});

// Initialize
initApp();

// Close modal when clicking outside
window.addEventListener('click', function (e) {
    if (e.target === authModal) {
        closeAuthModal();
    }
});

document.getElementById("scrollBtn").addEventListener("click", function () {
    document.getElementById("products-section").scrollIntoView({
        behavior: "smooth", // enables transition
        block: "start"
    });
});

// Add this function to show the checkout form
function showCheckoutForm() {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    document.getElementById('checkout-form').style.display = 'block';
    document.querySelector('.checkout-btn').textContent = 'Place Order';
    document.querySelector('.checkout-btn').onclick = placeOrder;
}

// Update the placeOrder function
function placeOrder() {
    const phone = document.getElementById('checkout-phone').value;
    const address = document.getElementById('checkout-address').value;

    if (!phone || !address) {
        alert('Please fill in all required fields');
        return;
    }

    const orderData = {
        customerId: currentUser.uid,
        customerName: currentUser.displayName || currentUser.email,
        customerEmail: currentUser.email,
        customerPhone: phone,
        customerAddress: address,
        items: cart,
        subtotal: cart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
        total: cart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
        status: 'pending',
        createdAt: new Date()

    };

    // Save order to Firestore
    db.collection('orders').add(orderData)
        .then(() => {
            // Clear cart
            cart.forEach(item => {
                db.collection('users').doc(currentUser.uid).collection('cart').doc(item.id).delete();
            });
            cart = [];
            updateCartCount();

            // Reset checkout form
            document.getElementById('checkout-form').style.display = 'none';
            document.querySelector('.checkout-btn').textContent = 'Proceed to Checkout';
            document.querySelector('.checkout-btn').onclick = showCheckoutForm;

            showNotification('Order placed successfully!');
            renderCart();
        })
        .catch(error => {
            console.error("Error placing order: ", error);
            showNotification('Error placing order!');
        });
}

// Update the registration process to save address and phone
document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const address = document.getElementById('register-address').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    if (password !== confirm) {
        alert('Passwords do not match!');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Update user profile with name
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                // Add user data to Firestore
                return db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    createdAt: new Date()
                });
            });
        })
        .then(() => {
            currentUser = auth.currentUser;
            closeAuthModal();
            showNotification('Account created successfully!');
            updateUserUI(currentUser);
        })
        .catch(error => {
            alert('Registration failed: ' + error.message);
        });
});

// Update the admin orders table to show customer details
function updateAdminOrders() {
    if (!adminOrdersList) return;

    adminOrdersList.innerHTML = orders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customerName || 'Unknown'}</td>
            <td>${order.customerEmail || '-'}</td>
            <td>${order.customerPhone || '-'}</td>
            <td>${order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
            <td>₹ ${order.total?.toFixed(2) || '0.00'}</td>
            <td>
                <span class="status-badge status-${order.status?.toLowerCase()}">${order.status || 'Pending'}</span>
            </td>
            <td>
                <button class="btn-sm btn-view" onclick="viewOrder('${order.id}')">View</button>
                <select onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button class="btn-sm btn-delete" onclick="deleteOrder('${order.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteOrder(orderId) {
    if (!confirm("Are you sure you want to delete this order?")) return;

    db.collection('orders').doc(orderId).delete()
        .then(() => {
            showNotification("Order deleted successfully!");
            loadOrders(); // reload updated list
        })
        .catch(error => {
            console.error("Error deleting order: ", error);
            showNotification("Failed to delete order!");
        });
}



function updateOrderStatus(orderId, newStatus) {
    db.collection('orders').doc(orderId).update({ status: newStatus })
        .then(() => {
            showNotification(`Order ${orderId} updated to ${newStatus}`);
            loadOrders();
        })
        .catch(error => {
            console.error("Error updating order: ", error);
            showNotification("Failed to update order!");
        });
}


// Update the viewOrder function to show all details
function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let orderDetails = `Order Details:
ID: ${order.id}
Customer: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.customerPhone}
Address: ${order.customerAddress}
Date: ${order.createdAt?.toDate().toLocaleDateString()}
Total: ₹ ${order.total?.toFixed(2)}
Status: ${order.status}

Items:`;

    order.items.forEach(item => {
        orderDetails += `\n- ${item.name} (Qty: ${item.quantity}, Price: ₹ ${item.price.toFixed(2)})`;
    });

    alert(orderDetails);
}