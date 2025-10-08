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

// Demo products data with discount support
const demoProducts = [
    {
        id: 'demo-1',
        name: 'Classic White Shirt',
        price: 2499.99,
        discount: 10,
        salePrice: 2249.99,
        images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop',
            'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=600&fit=crop'
        ],
        colors: ['White', 'Black', 'Blue'],
        size: 'M, L, XL',
        material: 'Cotton',
        stock: 50
    },
    {
        id: 'demo-2',
        name: 'Premium Denim Jacket',
        price: 4599.99,
        discount: 15,
        salePrice: 3909.99,
        images: [
            'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop',
            'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=500&h=600&fit=crop',
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop'
        ],
        colors: ['Blue', 'Black', 'Light Blue'],
        size: 'S, M, L, XL',
        material: 'Denim',
        stock: 30
    }
];

// Discount calculation functions
function calculateSalePrice(originalPrice, discountPercent) {
    if (discountPercent > 0) {
        return originalPrice - (originalPrice * discountPercent / 100);
    }
    return originalPrice;
}

function updateSalePrice() {
    const originalPrice = parseFloat(document.getElementById('product-price').value) || 0;
    const discountPercent = parseFloat(document.getElementById('product-discount').value) || 0;
    const salePrice = calculateSalePrice(originalPrice, discountPercent);
    document.getElementById('product-sale-price').value = salePrice.toFixed(2);
}

function setupDiscountListeners() {
    const priceInput = document.getElementById('product-price');
    const discountInput = document.getElementById('product-discount');
    
    if (priceInput && discountInput) {
        priceInput.addEventListener('input', updateSalePrice);
        discountInput.addEventListener('input', updateSalePrice);
    }
}

// Initialize the application
function initApp() {
    // Initialize products container display
    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        productsContainer.style.display = 'none';
    }

    // Setup hamburger menu
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('nav-links');
        
        if (navLinks && navLinks.classList.contains('active') && 
            !hamburger.contains(e.target) && 
            !navLinks.contains(e.target)) {
            closeMobileMenu();
        }
    });

    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            updateUserUI(user);
            loadUserData();
            checkAdminStatus(user.uid);
        } else {
            currentUser = null;
            isAdmin = false;
            adminLink.style.display = 'none';
            // Hide mobile admin link too
            const adminLinkMobile = document.getElementById('admin-link-mobile');
            if (adminLinkMobile) {
                adminLinkMobile.style.display = 'none';
            }
            userInfo.style.display = 'none';
            authText.textContent = 'Account';
            loadLocalData();
        }
        
        // Load products regardless of login status
        loadProducts();
        
        // Only load orders and users if logged in
        if (user) {
            loadOrders();
            loadUsers();
        }
    });

    // Setup event listeners
    setupEventListeners();
}

// Setup all event listeners
function setupEventListeners() {
    // Auth forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('admin-form').addEventListener('submit', handleAdminLogin);

    // Account button (login/logout)
    document.querySelector('.action-item').addEventListener('click', handleAccountClick);

    // Product form
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleProductSubmit);
    }

    // Newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletter);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function (e) {
        if (e.target === authModal) {
            closeAuthModal();
        }
    });

    // Scroll to products
    const scrollBtn = document.getElementById("scrollBtn");
    if (scrollBtn) {
        scrollBtn.addEventListener("click", function () {
            document.getElementById("products-section").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    // Close mobile menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // Setup discount listeners
    setupDiscountListeners();
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
                // Show mobile admin link too
                const adminLinkMobile = document.getElementById('admin-link-mobile');
                if (adminLinkMobile) {
                    adminLinkMobile.style.display = 'block';
                }
                // Load admin-specific data
                loadAdminData();
            } else {
                isAdmin = false;
                adminLink.style.display = 'none';
                // Hide mobile admin link too
                const adminLinkMobile = document.getElementById('admin-link-mobile');
                if (adminLinkMobile) {
                    adminLinkMobile.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error("Error checking admin status: ", error);
            isAdmin = false;
            adminLink.style.display = 'none';
            // Hide mobile admin link too
            const adminLinkMobile = document.getElementById('admin-link-mobile');
            if (adminLinkMobile) {
                adminLinkMobile.style.display = 'none';
            }
        });
}

// Load products from Firestore with fallback to demo data
function loadProducts() {
    showSkeletonLoading();
    
    db.collection('products').get()
        .then(snapshot => {
            products = [];
            snapshot.forEach(doc => {
                const productData = doc.data();
                // Ensure backward compatibility with single image
                if (productData.image && !productData.images) {
                    productData.images = [productData.image];
                }
                // Ensure backward compatibility with single color
                if (productData.color && !productData.colors) {
                    productData.colors = [productData.color];
                }
                // Calculate sale price if discount exists but salePrice doesn't
                if (productData.discount && productData.discount > 0 && !productData.salePrice) {
                    productData.salePrice = calculateSalePrice(productData.price, productData.discount);
                }
                products.push({ id: doc.id, ...productData });
            });
            
            setTimeout(() => {
                renderProducts();
                updateAdminProducts();
                hideSkeletonLoading();
            }, 500);
        })
        .catch(error => {
            console.error("Error loading products: ", error);
            
            // Use demo data as fallback
            console.log('Using demo products data');
            products = demoProducts;
            
            setTimeout(() => {
                renderProducts();
                updateAdminProducts();
                hideSkeletonLoading();
            }, 500);
        });
}

// Load orders from Firestore
function loadOrders() {
    if (!currentUser) return;
    
    let ordersQuery = db.collection('orders');
    
    if (!isAdmin) {
        ordersQuery = ordersQuery.where('customerId', '==', currentUser.uid);
    }
    
    ordersQuery.get()
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

// Load users from Firestore (admin only)
function loadUsers() {
    if (!currentUser || !isAdmin) return;
    
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

// Load admin-specific data
function loadAdminData() {
    if (!isAdmin) return;
    
    // Load users for admin panel
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
            console.error("Error loading users for admin: ", error);
        });
    
    // Load all orders for admin panel
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
            console.error("Error loading orders for admin: ", error);
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

    // Load shipping info
    loadShippingInfo();
}

// Load data from local storage (for non-logged in users)
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

// Save data to local storage (for non-logged in users)
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
    ordersPage.style.display = 'none';
    closeMobileMenu();
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
    ordersPage.style.display = 'none';
    renderWishlist();
    closeMobileMenu();
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
    ordersPage.style.display = 'none';
    renderCart();
    loadShippingInfo();
    closeMobileMenu();
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
    ordersPage.style.display = 'none';
    updateAdminStats();
    closeMobileMenu();
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
    
    // Refresh the products table when switching to products tab
    if (tabName === 'products') {
        updateAdminProducts();
    }
}

// Product Functions
function toggleProductDetails(productId) {
    const productCard = document.getElementById(`${productId}-card`);
    if (productCard) {
        productCard.classList.toggle('expanded');
    }
}

// Image slider functions - Manual only (no auto-slide)
function initImageSlider(productId, images) {
    const slider = document.getElementById(`image-slider-${productId}`);
    if (!slider) return;

    let currentSlide = 0;
    const totalSlides = images.length;

    function showSlide(index) {
        const slides = slider.querySelector('.slider-images');
        const dots = slider.querySelectorAll('.slider-dot');
        
        slides.style.transform = `translateX(-${index * 100}%)`;
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        currentSlide = index;
    }

    function nextSlide() {
        const nextIndex = (currentSlide + 1) % totalSlides;
        showSlide(nextIndex);
    }

    function prevSlide() {
        const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(prevIndex);
    }

    // Add event listeners for next/prev buttons
    const nextBtn = slider.querySelector('.slider-next');
    const prevBtn = slider.querySelector('.slider-prev');
    
    if (nextBtn) nextBtn.onclick = nextSlide;
    if (prevBtn) prevBtn.onclick = prevSlide;

    // Add event listeners for dots
    const dots = slider.querySelectorAll('.slider-dot');
    dots.forEach((dot, index) => {
        dot.onclick = () => showSlide(index);
    });
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
        }
    }

    updateWishlistCount();
    saveLocalData();
}

function addToCart(productId) {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Use sale price if available, otherwise use regular price
    const price = product.salePrice || product.price;

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
        }
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: price,
            image: product.images ? product.images[0] : product.image,
            quantity: 1
        });

        if (currentUser) {
            db.collection('users').doc(currentUser.uid).collection('cart').doc(productId).set({
                name: product.name,
                price: price,
                image: product.images ? product.images[0] : product.image,
                quantity: 1,
                addedAt: new Date()
            })
                .catch(error => {
                    console.error("Error adding to cart: ", error);
                });
        }
    }

    updateCartCount();
    saveLocalData();
    showNotification('Product added to cart!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);

    if (currentUser) {
        db.collection('users').doc(currentUser.uid).collection('cart').doc(productId).delete()
            .catch(error => {
                console.error("Error removing from cart: ", error);
            });
    }

    renderCart();
    updateCartCount();
    saveLocalData();
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
            }

            renderCart();
            updateCartCount();
            saveLocalData();
        }
    }
}

// Render Functions
function renderProducts() {
    if (!productsContainer) return;
    
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                <i class="fas fa-box-open" style="font-size: 48px; color: var(--gray); margin-bottom: 20px;"></i>
                <p style="color: var(--gray); font-size: 16px;">No products available at the moment.</p>
            </div>
        `;
    } else {
        productsContainer.innerHTML = products.map(product => {
            const images = product.images || [product.image];
            const colors = product.colors || [product.color];
            
            // Ensure colors is always an array
            const colorArray = Array.isArray(colors) ? colors : [colors];
            const displayColors = colorArray.filter(color => color && color.trim() !== '');
            
            // Calculate display prices
            const hasDiscount = product.discount && product.discount > 0;
            const displayPrice = hasDiscount ? (product.salePrice || calculateSalePrice(product.price, product.discount)) : product.price;
            
            return `
            <div class="product-card" id="${product.id}-card">
                <div class="product-image" onclick="toggleProductDetails('${product.id}')">
                    <div class="image-slider" id="image-slider-${product.id}">
                        <div class="slider-images">
                            ${images.map(img => `
                                <div class="slide">
                                    <img src="${img}" alt="${product.name}" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                        ${images.length > 1 ? `
                            <button class="slider-btn slider-prev">‹</button>
                            <button class="slider-btn slider-next">›</button>
                            <div class="slider-dots">
                                ${images.map((_, index) => `
                                    <span class="slider-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    ${hasDiscount ? `<div class="product-badge">${product.discount}% OFF</div>` : ''}
                    ${product.badge && !hasDiscount ? `<div class="product-badge">${product.badge}</div>` : ''}
                    <div class="wishlist-btn" onclick="toggleWishlist(this, '${product.id}')">
                        <i class="${wishlist.includes(product.id) ? 'fas' : 'far'} fa-heart"></i>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title" onclick="toggleProductDetails('${product.id}')">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">₹ ${displayPrice.toFixed(2)}</span>
                        ${hasDiscount ? `
                            <span class="old-price">₹ ${product.price.toFixed(2)}</span>
                            <span class="discount">${product.discount}% OFF</span>
                        ` : ''}
                    </div>
                    ${displayColors.length > 0 ? `
                    <div class="product-colors">
                        ${displayColors.slice(0, 5).map(color => `
                            <span class="color-chip" style="background-color: ${getColorValue(color)}" title="${color}"></span>
                        `).join('')}
                        ${displayColors.length > 5 ? `<span class="color-more">+${displayColors.length - 5}</span>` : ''}
                    </div>
                    ` : ''}
                    <div class="product-actions">
                        <button class="add-to-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                    </div>
                </div>
                <div class="product-details">
                    <div class="product-specs">
                        <h4 class="specs-title">Product Details</h4>
                        <ul class="specs-list">
                            ${displayColors.length > 0 ? `<li><span>Colors:</span> <span>${displayColors.join(', ')}</span></li>` : ''}
                            <li><span>Size:</span> <span>${product.size || '-'}</span></li>
                            <li><span>Material:</span> <span>${product.material || '-'}</span></li>
                            ${hasDiscount ? `<li><span>Discount:</span> <span>${product.discount}% OFF</span></li>` : ''}
                        </ul>
                    </div>
                </div>
            </div>
        `}).join('');
        
        // Initialize sliders after rendering
        products.forEach(product => {
            const images = product.images || [product.image];
            if (images.length > 1) {
                setTimeout(() => initImageSlider(product.id, images), 100);
            }
        });
    }
    
    productsContainer.style.display = 'grid';
}

// Helper function to get color value for display
function getColorValue(colorName) {
    if (!colorName) return '#cccccc';
    
    const colorMap = {
        'white': '#ffffff',
        'black': '#000000',
        'blue': '#007bff',
        'red': '#dc3545',
        'green': '#28a745',
        'yellow': '#ffc107',
        'purple': '#6f42c1',
        'pink': '#e83e8c',
        'orange': '#fd7e14',
        'brown': '#8b4513',
        'gray': '#6c757d',
        'grey': '#6c757d',
        'navy': '#001f3f',
        'teal': '#20c997',
        'cyan': '#17a2b8',
        'beige': '#f5f5dc',
        'maroon': '#800000',
        'olive': '#808000',
        'lime': '#00ff00',
        'silver': '#c0c0c0',
        'gold': '#ffd700',
        'light blue': '#87ceeb',
        'dark blue': '#00008b',
        'light green': '#90ee90',
        'dark green': '#006400',
        'light gray': '#d3d3d3',
        'dark gray': '#a9a9a9'
    };
    
    // Convert to lowercase and trim for better matching
    const normalizedColor = colorName.toString().toLowerCase().trim();
    return colorMap[normalizedColor] || '#cccccc';
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

        const images = product.images || [product.image];
        const colors = product.colors || [product.color];
        const colorArray = Array.isArray(colors) ? colors : [colors];
        const displayColors = colorArray.filter(color => color && color.trim() !== '');
        const hasDiscount = product.discount && product.discount > 0;
        const displayPrice = hasDiscount ? (product.salePrice || calculateSalePrice(product.price, product.discount)) : product.price;

        return `
            <div class="product-card">
                <div class="product-image">
                    <div class="image-slider" id="wishlist-slider-${product.id}">
                        <div class="slider-images">
                            ${images.map((img, index) => `
                                <div class="slide">
                                    <img src="${img}" alt="${product.name}" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                        ${images.length > 1 ? `
                            <button class="slider-btn slider-prev">‹</button>
                            <button class="slider-btn slider-next">›</button>
                            <div class="slider-dots">
                                ${images.map((_, index) => `
                                    <span class="slider-dot ${index === 0 ? 'active' : ''}"></span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    ${hasDiscount ? `<div class="product-badge">${product.discount}% OFF</div>` : ''}
                    <div class="wishlist-btn" onclick="toggleWishlist(this, '${product.id}')">
                        <i class="fas fa-heart"></i>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">₹ ${displayPrice.toFixed(2)}</span>
                        ${hasDiscount ? `
                            <span class="old-price">₹ ${product.price.toFixed(2)}</span>
                            <span class="discount">${product.discount}% OFF</span>
                        ` : ''}
                    </div>
                    ${displayColors.length > 0 ? `
                    <div class="product-colors">
                        ${displayColors.slice(0, 5).map(color => `
                            <span class="color-chip" style="background-color: ${getColorValue(color)}" title="${color}"></span>
                        `).join('')}
                        ${displayColors.length > 5 ? `<span class="color-more">+${displayColors.length - 5}</span>` : ''}
                    </div>
                    ` : ''}
                    <div class="product-actions">
                        <button class="add-to-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Initialize sliders for wishlist items
    setTimeout(() => {
        wishlist.forEach(productId => {
            const product = products.find(p => p.id === productId);
            if (product) {
                const images = product.images || [product.image];
                if (images.length > 1) {
                    initImageSlider(`wishlist-slider-${product.id}`, images);
                }
            }
        });
    }, 100);
}

// Update the initImageSlider function to work with any slider ID
function initImageSlider(sliderId, images) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    let currentSlide = 0;
    const totalSlides = images.length;

    function showSlide(index) {
        const slides = slider.querySelector('.slider-images');
        const dots = slider.querySelectorAll('.slider-dot');
        
        if (slides) {
            slides.style.transform = `translateX(-${index * 100}%)`;
        }
        
        if (dots) {
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
        
        currentSlide = index;
    }

    function nextSlide() {
        const nextIndex = (currentSlide + 1) % totalSlides;
        showSlide(nextIndex);
    }

    function prevSlide() {
        const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(prevIndex);
    }

    // Add event listeners for next/prev buttons
    const nextBtn = slider.querySelector('.slider-next');
    const prevBtn = slider.querySelector('.slider-prev');
    
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            nextSlide();
        };
    }
    
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            prevSlide();
        };
    }

    // Add event listeners for dots
    const dots = slider.querySelectorAll('.slider-dot');
    dots.forEach((dot, index) => {
        dot.onclick = (e) => {
            e.stopPropagation();
            showSlide(index);
        };
    });

    // Initialize first slide
    showSlide(0);
}

// Also update the product card slider initialization to use the same function
function renderProducts() {
    if (!productsContainer) return;
    
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                <i class="fas fa-box-open" style="font-size: 48px; color: var(--gray); margin-bottom: 20px;"></i>
                <p style="color: var(--gray); font-size: 16px;">No products available at the moment.</p>
            </div>
        `;
    } else {
        productsContainer.innerHTML = products.map(product => {
            const images = product.images || [product.image];
            const colors = product.colors || [product.color];
            
            const colorArray = Array.isArray(colors) ? colors : [colors];
            const displayColors = colorArray.filter(color => color && color.trim() !== '');
            
            const hasDiscount = product.discount && product.discount > 0;
            const displayPrice = hasDiscount ? (product.salePrice || calculateSalePrice(product.price, product.discount)) : product.price;
            
            return `
            <div class="product-card" id="${product.id}-card">
                <div class="product-image" onclick="toggleProductDetails('${product.id}')">
                    <div class="image-slider" id="image-slider-${product.id}">
                        <div class="slider-images">
                            ${images.map(img => `
                                <div class="slide">
                                    <img src="${img}" alt="${product.name}" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                        ${images.length > 1 ? `
                            <button class="slider-btn slider-prev">‹</button>
                            <button class="slider-btn slider-next">›</button>
                            <div class="slider-dots">
                                ${images.map((_, index) => `
                                    <span class="slider-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    ${hasDiscount ? `<div class="product-badge">${product.discount}% OFF</div>` : ''}
                    ${product.badge && !hasDiscount ? `<div class="product-badge">${product.badge}</div>` : ''}
                    <div class="wishlist-btn" onclick="toggleWishlist(this, '${product.id}')">
                        <i class="${wishlist.includes(product.id) ? 'fas' : 'far'} fa-heart"></i>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title" onclick="toggleProductDetails('${product.id}')">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">₹ ${displayPrice.toFixed(2)}</span>
                        ${hasDiscount ? `
                            <span class="old-price">₹ ${product.price.toFixed(2)}</span>
                            <span class="discount">${product.discount}% OFF</span>
                        ` : ''}
                    </div>
                    ${displayColors.length > 0 ? `
                    <div class="product-colors">
                        ${displayColors.slice(0, 5).map(color => `
                            <span class="color-chip" style="background-color: ${getColorValue(color)}" title="${color}"></span>
                        `).join('')}
                        ${displayColors.length > 5 ? `<span class="color-more">+${displayColors.length - 5}</span>` : ''}
                    </div>
                    ` : ''}
                    <div class="product-actions">
                        <button class="add-to-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                    </div>
                </div>
                <div class="product-details">
                    <div class="product-specs">
                        <h4 class="specs-title">Product Details</h4>
                        <ul class="specs-list">
                            ${displayColors.length > 0 ? `<li><span>Colors:</span> <span>${displayColors.join(', ')}</span></li>` : ''}
                            <li><span>Size:</span> <span>${product.size || '-'}</span></li>
                            <li><span>Material:</span> <span>${product.material || '-'}</span></li>
                            ${hasDiscount ? `<li><span>Discount:</span> <span>${product.discount}% OFF</span></li>` : ''}
                        </ul>
                    </div>
                </div>
            </div>
        `}).join('');
        
        // Initialize sliders after rendering
        setTimeout(() => {
            products.forEach(product => {
                const images = product.images || [product.image];
                if (images.length > 1) {
                    initImageSlider(`image-slider-${product.id}`, images);
                }
            });
        }, 100);
    }
    
    productsContainer.style.display = 'grid';
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
                    <img src="${item.image}" alt="${product.name}">
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
    const wishlistCount = document.querySelector('.wishlist-count');
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
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

// Admin Management Functions
function updateAdminProducts() {
    if (!adminProductsList) return;

    adminProductsList.innerHTML = products.map(product => {
        const colors = product.colors || [product.color];
        const images = product.images || [product.image];
        
        return `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>₹ ${product.price.toFixed(2)}</td>
            <td>${product.discount || 0}%</td>
            <td>₹ ${(product.salePrice || product.price).toFixed(2)}</td>
            <td>${product.stock || 0}</td>
            <td>${Array.isArray(colors) ? colors.join(', ') : colors}</td>
            <td>${product.size || '-'}</td>
            <td>${product.material || '-'}</td>
            <td>${images.length} images</td>
            <td>
                <button class="btn-sm btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn-sm btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        </tr>
    `}).join('');
}

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

// Admin Functions
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Populate the form with product data
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-discount').value = product.discount || 0;
    document.getElementById('product-sale-price').value = product.salePrice || product.price;
    document.getElementById('product-stock').value = product.stock || 0;
    document.getElementById('product-size').value = product.size || '';
    document.getElementById('product-material').value = product.material || '';
    
    // Handle colors - ensure it's always an array
    const colors = product.colors || [product.color];
    const colorsArray = Array.isArray(colors) ? colors : [colors];
    document.getElementById('product-colors').value = colorsArray.filter(color => color && color.trim() !== '').join(', ');
    
    // Handle images - ensure it's always an array
    const images = product.images || [product.image];
    const imagesArray = Array.isArray(images) ? images : [images];
    document.getElementById('product-images').value = imagesArray.filter(img => img && img.trim() !== '').join('\n');

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

function deleteOrder(orderId) {
    if (!confirm("Are you sure you want to delete this order?")) return;

    db.collection('orders').doc(orderId).delete()
        .then(() => {
            showNotification("Order deleted successfully!");
            loadOrders();
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

function viewUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    alert(`User Details:\nID: ${user.id}\nName: ${user.name}\nEmail: ${user.email}\nJoined: ${user.createdAt?.toDate().toLocaleDateString()}`);
}

function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let orderDetails = `Order Details:\n\n`;
    orderDetails += `Order ID: ${order.id}\n`;
    orderDetails += `Customer: ${order.customerName}\n`;
    orderDetails += `Email: ${order.customerEmail}\n`;
    orderDetails += `Phone: ${order.customerPhone}\n`;
    orderDetails += `Address: ${order.customerAddress}\n`;
    orderDetails += `Date: ${order.createdAt?.toDate().toLocaleDateString()}\n`;
    orderDetails += `Total: ₹ ${order.total?.toFixed(2)}\n`;
    orderDetails += `Status: ${order.status}\n\n`;
    orderDetails += `Items:\n`;

    order.items?.forEach((item, index) => {
        orderDetails += `${index + 1}. ${item.name}\n`;
        orderDetails += `   Quantity: ${item.quantity}\n`;
        orderDetails += `   Price: ₹ ${item.price.toFixed(2)}\n`;
        if (item.size) {
            orderDetails += `   Size: ${item.size}\n`;
        }
        if (item.color) {
            orderDetails += `   Color: ${item.color}\n`;
        }
        orderDetails += `   Subtotal: ₹ ${(item.quantity * item.price).toFixed(2)}\n\n`;
    });

    orderDetails += `Order Summary:\n`;
    orderDetails += `Subtotal: ₹ ${order.subtotal?.toFixed(2) || '0.00'}\n`;
    orderDetails += `Total: ₹ ${order.total?.toFixed(2) || '0.00'}\n`;

    alert(orderDetails);
}

// Event Handlers
function handleLogin(e) {
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
}

function handleRegister(e) {
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
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
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
}

function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
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
                loadAdminData();
                showAdminPanel();
            } else {
                auth.signOut();
                alert('You do not have admin privileges. Please use regular login.');
                switchAuthTab('login');
            }
        })
        .catch(error => {
            console.error("Admin login error: ", error);
            if (error.code === 'permission-denied') {
                alert('Admin permissions error. Please check your credentials.');
            } else {
                alert('Admin login failed: ' + error.message);
            }
        });
}

function handleAccountClick(e) {
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
}

function handleProductSubmit(e) {
    e.preventDefault();

    if (!isAdmin) {
        showNotification('Admin privileges required to manage products');
        return;
    }

    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const discount = parseFloat(document.getElementById('product-discount').value) || 0;
    const stock = parseInt(document.getElementById('product-stock').value);
    const size = document.getElementById('product-size').value;
    const material = document.getElementById('product-material').value;
    
    // Handle multiple colors - split by comma and clean up
    const colorsInput = document.getElementById('product-colors').value;
    const colors = colorsInput.split(',')
        .map(color => color.trim())
        .filter(color => color && color !== '');
    
    // Handle multiple images - split by newline and clean up
    const imagesInput = document.getElementById('product-images').value;
    const images = imagesInput.split('\n')
        .map(img => img.trim())
        .filter(img => img && img !== '');

    const productData = {
        name,
        price,
        discount,
        salePrice: calculateSalePrice(price, discount),
        stock,
        size,
        material,
        colors: colors.length > 0 ? colors : ['Default'],
        images: images.length > 0 ? images : ['https://via.placeholder.com/500x600?text=No+Image'],
        createdAt: new Date()
    };

    if (addProductForm.dataset.mode === 'edit') {
        const productId = addProductForm.dataset.productId;
        db.collection('products').doc(productId).update(productData)
            .then(() => {
                showNotification('Product updated successfully!');
                loadProducts();
                switchAdminTab('products');
                addProductForm.reset();
                addProductForm.dataset.mode = '';
                addProductForm.querySelector('.form-submit').textContent = 'Add Product';
            })
            .catch(error => {
                console.error("Error updating product: ", error);
                showNotification('Error updating product!');
            });
    } else {
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
}


function handleNewsletter(e) {
    e.preventDefault();
    const email = this.querySelector('input').value;
    if (email) {
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
}

// Checkout Functions
function placeOrder() {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    // Get current user data for shipping info
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('User data not found');
            }

            const userData = doc.data();
            
            // Validate shipping information
            if (!userData.phone || !userData.address) {
                alert('Please complete your shipping information before placing an order');
                document.getElementById('edit-shipping-form').style.display = 'block';
                document.getElementById('shipping-info').style.display = 'none';
                return;
            }

            const orderData = {
                customerId: currentUser.uid,
                customerName: currentUser.displayName || currentUser.email,
                customerEmail: currentUser.email,
                customerPhone: userData.phone,
                customerAddress: userData.address,
                items: cart,
                subtotal: cart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
                total: cart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
                status: 'pending',
                createdAt: new Date()
            };

            console.log('Placing order with data:', orderData);

            // Save order to Firestore
            return db.collection('orders').add(orderData);
        })
        .then((docRef) => {
            console.log('Order placed successfully with ID:', docRef.id);
            
            // Clear cart after successful order
            const deletePromises = cart.map(item => {
                return db.collection('users').doc(currentUser.uid).collection('cart').doc(item.id).delete();
            });

            return Promise.all(deletePromises);
        })
        .then(() => {
            // Clear local cart
            cart = [];
            updateCartCount();
            saveLocalData();

            showNotification('Order placed successfully!');
            renderCart();
            
            // Reload orders to show the new order
            loadOrders();
            
            // Go to orders page
            showOrdersPage();
        })
        .catch(error => {
            console.error("Error placing order: ", error);
            
            if (error.message === 'User data not found') {
                showNotification('Please complete your profile information');
            } else if (error.code === 'permission-denied') {
                showNotification('Permission denied. Please check Firestore security rules.');
            } else {
                showNotification('Error placing order: ' + error.message);
            }
        });
}

// Utility Functions
function showNotification(message) {
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

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Skeleton Loading Functions
function showSkeletonLoading() {
    const skeleton = document.getElementById('skeleton-loading');
    const productsContainer = document.getElementById('products-container');
    
    if (skeleton) {
        skeleton.style.display = 'grid';
    }
    if (productsContainer) {
        productsContainer.style.display = 'none';
    }
}

function hideSkeletonLoading() {
    const skeleton = document.getElementById('skeleton-loading');
    const productsContainer = document.getElementById('products-container');
    
    if (skeleton) {
        skeleton.style.display = 'none';
    }
    if (productsContainer) {
        productsContainer.style.display = 'grid';
    }
}

// Hamburger Menu Functions
function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const headerActions = document.querySelector('.header-actions');
    const userInfo = document.getElementById('user-info');

    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    
    // Toggle header actions on mobile
    if (window.innerWidth <= 768) {
        headerActions.classList.toggle('mobile-visible');
        if (currentUser) {
            userInfo.classList.toggle('mobile-visible');
        }
    }
}

function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const headerActions = document.querySelector('.header-actions');
    const userInfo = document.getElementById('user-info');

    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    headerActions.classList.remove('mobile-visible');
    userInfo.classList.remove('mobile-visible');
}

// Orders Page Functions
function showOrdersPage() {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    mainContent.style.display = 'none';
    wishlistPage.style.display = 'none';
    cartPage.style.display = 'none';
    adminPanel.style.display = 'none';
    ordersPage.style.display = 'block';
    
    renderOrders();
}

function renderOrders() {
    const ordersContainer = document.getElementById('orders-container');
    const emptyOrders = document.getElementById('empty-orders');

    if (!ordersContainer) return;

    // Filter orders for current user
    const userOrders = orders.filter(order => order.customerId === currentUser.uid);

    if (userOrders.length === 0) {
        emptyOrders.style.display = 'block';
        ordersContainer.innerHTML = '';
        return;
    }

    emptyOrders.style.display = 'none';
    
    // Sort orders by date (newest first)
    userOrders.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
    });

    ordersContainer.innerHTML = userOrders.map(order => {
        const orderDate = order.createdAt?.toDate() || new Date();
        const formattedDate = orderDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = orderDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order #${order.id.slice(-8).toUpperCase()}</h3>
                        <div class="order-meta">
                            <span>Placed on: ${formattedDate}</span>
                            <span>Time: ${formattedTime}</span>
                            <span>Items: ${order.items?.length || 0}</span>
                        </div>
                    </div>
                    <div class="order-status status-${order.status?.toLowerCase() || 'pending'}">
                        ${order.status || 'Pending'}
                    </div>
                </div>
                
                <div class="order-items">
                    ${order.items?.map(item => `
                        <div class="order-item">
                            <div class="order-item-image">
                                <img src="${item.image}" alt="${item.name}">
                            </div>
                            <div class="order-item-details">
                                <div class="order-item-name">${item.name}</div>
                                <div class="order-item-price">₹ ${item.price.toFixed(2)}</div>
                                <div class="order-item-quantity">Quantity: ${item.quantity}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        Total: ₹ ${order.total?.toFixed(2) || '0.00'}
                    </div>
                    <div class="order-actions">
                        <button class="btn-outline" onclick="viewOrderDetails('${order.id}')">
                            View Details
                        </button>
                        ${order.status === 'delivered' ? `
                            <button class="btn-outline" onclick="reorder('${order.id}')">
                                Reorder
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const orderDate = order.createdAt?.toDate() || new Date();
    const formattedDate = orderDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let orderDetails = `Order Details:\n\n`;
    orderDetails += `Order ID: ${order.id}\n`;
    orderDetails += `Order Date: ${formattedDate}\n`;
    orderDetails += `Status: ${order.status || 'Pending'}\n\n`;
    orderDetails += `Shipping Information:\n`;
    orderDetails += `Name: ${order.customerName}\n`;
    orderDetails += `Email: ${order.customerEmail}\n`;
    orderDetails += `Phone: ${order.customerPhone}\n`;
    orderDetails += `Address: ${order.customerAddress}\n\n`;
    orderDetails += `Items:\n`;

    order.items?.forEach((item, index) => {
        orderDetails += `${index + 1}. ${item.name}\n`;
        orderDetails += `   Quantity: ${item.quantity}\n`;
        orderDetails += `   Price: ₹ ${item.price.toFixed(2)}\n`;
        orderDetails += `   Subtotal: ₹ ${(item.quantity * item.price).toFixed(2)}\n\n`;
    });

    orderDetails += `Order Summary:\n`;
    orderDetails += `Subtotal: ₹ ${order.subtotal?.toFixed(2) || '0.00'}\n`;
    orderDetails += `Total: ₹ ${order.total?.toFixed(2) || '0.00'}\n`;

    alert(orderDetails);
}

function reorder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.items) return;

    // Add all items from the order to cart
    order.items.forEach(item => {
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            existingItem.quantity += item.quantity;
            if (currentUser) {
                db.collection('users').doc(currentUser.uid).collection('cart').doc(item.id).update({
                    quantity: existingItem.quantity
                }).catch(error => {
                    console.error("Error updating cart: ", error);
                });
            }
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity
            });

            if (currentUser) {
                db.collection('users').doc(currentUser.uid).collection('cart').doc(item.id).set({
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    quantity: item.quantity,
                    addedAt: new Date()
                }).catch(error => {
                    console.error("Error adding to cart: ", error);
                });
            }
        }
    });

    updateCartCount();
    saveLocalData();
    showNotification('Items added to cart!');
    showCartPage();
}

// Shipping Information Functions
function loadShippingInfo() {
    if (!currentUser) return;

    // Load user data to get address and phone
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                displayShippingInfo(userData);
            }
        })
        .catch(error => {
            console.error("Error loading user data: ", error);
        });
}

function displayShippingInfo(userData) {
    const phoneElement = document.getElementById('display-phone');
    const addressElement = document.getElementById('display-address');
    
    if (phoneElement) {
        phoneElement.textContent = userData.phone || 'Not provided';
    }
    
    if (addressElement) {
        addressElement.textContent = userData.address || 'Not provided';
    }
}

function editField(fieldType) {
    // Load current values
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Populate edit form
                document.getElementById('edit-phone').value = userData.phone || '';
                document.getElementById('edit-address').value = userData.address || '';
                
                // Show edit form, hide display
                document.getElementById('shipping-info').style.display = 'none';
                document.getElementById('edit-shipping-form').style.display = 'block';
            }
        })
        .catch(error => {
            console.error("Error loading user data for edit: ", error);
        });
}

function cancelEdit() {
    // Show display, hide edit form
    document.getElementById('shipping-info').style.display = 'block';
    document.getElementById('edit-shipping-form').style.display = 'none';
}

function saveShippingInfo() {
    const newPhone = document.getElementById('edit-phone').value;
    const newAddress = document.getElementById('edit-address').value;

    if (!newPhone || !newAddress) {
        alert('Please fill in all fields');
        return;
    }

    // Update user data in Firestore
    db.collection('users').doc(currentUser.uid).update({
        phone: newPhone,
        address: newAddress
    })
    .then(() => {
        // Update display
        const phoneElement = document.getElementById('display-phone');
        const addressElement = document.getElementById('display-address');
        
        if (phoneElement) phoneElement.textContent = newPhone;
        if (addressElement) addressElement.textContent = newAddress;
        
        // Show display, hide edit form
        document.getElementById('shipping-info').style.display = 'block';
        document.getElementById('edit-shipping-form').style.display = 'none';
        
        showNotification('Shipping information updated successfully!');
    })
    .catch(error => {
        console.error("Error updating shipping info: ", error);
        showNotification('Error updating shipping information');
    });
}

// Add DOM element for orders page
const ordersPage = document.getElementById('orders-page');

// Initialize the application
initApp();

// Add to the State Management section
let productSelections = {};

// Add this function to handle size and color selection
function updateProductSelection(productId, size, color) {
    if (!productSelections[productId]) {
        productSelections[productId] = {};
    }
    productSelections[productId] = { size, color };
}

// Modify the addToCart function to include size and color selection
function addToCart(productId) {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if product requires size/color selection
    const hasSizes = product.size && product.size.split(',').length > 0;
    const hasColors = product.colors && product.colors.length > 0;

    if (hasSizes || hasColors) {
        showProductSelectionModal(product);
        return;
    }

    // If no size/color selection needed, add directly to cart
    addToCartWithSelection(productId, null, null);
}

// New function to show product selection modal
function showProductSelectionModal(product) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Select Options for ${product.name}</h3>
            
            ${product.size ? `
            <div class="form-group">
                <label>Size</label>
                <div class="size-options">
                    ${product.size.split(',').map(s => s.trim()).map(size => `
                        <button class="size-option" onclick="selectSize(this, '${size}')">${size}</button>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${product.colors && product.colors.length > 0 ? `
            <div class="form-group">
                <label>Color</label>
                <div class="color-options">
                    ${product.colors.map(color => `
                        <div class="color-option" onclick="selectColor(this, '${color}')" 
                             style="background-color: ${getColorValue(color)}" 
                             title="${color}">
                            <span class="color-name">${color}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="selection-actions">
                <button class="btn btn-outline" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
                <button class="btn" onclick="addSelectedToCart('${product.id}')">Add to Cart</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Function to handle size selection
function selectSize(button, size) {
    const buttons = button.parentElement.querySelectorAll('.size-option');
    buttons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    button.dataset.selectedSize = size;
}

// Function to handle color selection
function selectColor(button, color) {
    const buttons = button.parentElement.querySelectorAll('.color-option');
    buttons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    button.dataset.selectedColor = color;
}

// Function to add product to cart with selections
function addSelectedToCart(productId) {
    const modal = document.querySelector('.modal:last-child');
    const selectedSize = modal.querySelector('.size-option.selected')?.dataset.selectedSize || null;
    const selectedColor = modal.querySelector('.color-option.selected')?.dataset.selectedColor || null;
    
    // Validate selection if required
    const product = products.find(p => p.id === productId);
    if (product.size && !selectedSize) {
        alert('Please select a size');
        return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
        alert('Please select a color');
        return;
    }
    
    modal.remove();
    addToCartWithSelection(productId, selectedSize, selectedColor);
}

// Modified function to add to cart with size and color
function addToCartWithSelection(productId, size, color) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Use sale price if available, otherwise use regular price
    const price = product.salePrice || product.price;

    // Create a unique key for cart items with same product but different size/color
    const cartItemKey = `${productId}-${size || 'nosize'}-${color || 'nocolor'}`;
    
    const existingItem = cart.find(item => item.cartKey === cartItemKey);

    if (existingItem) {
        existingItem.quantity += 1;

        if (currentUser) {
            db.collection('users').doc(currentUser.uid).collection('cart').doc(existingItem.id).update({
                quantity: existingItem.quantity
            })
            .catch(error => {
                console.error("Error updating cart: ", error);
            });
        }
    } else {
        const cartItem = {
            id: productId,
            cartKey: cartItemKey,
            name: product.name,
            price: price,
            image: product.images ? product.images[0] : product.image,
            quantity: 1,
            size: size,
            color: color
        };

        cart.push(cartItem);

        if (currentUser) {
            db.collection('users').doc(currentUser.uid).collection('cart').doc(cartItemKey).set({
                ...cartItem,
                addedAt: new Date()
            })
            .catch(error => {
                console.error("Error adding to cart: ", error);
            });
        }
    }

    updateCartCount();
    saveLocalData();
    showNotification('Product added to cart!');
}

// Modify the renderCart function to show size and color
function renderCart() {
    const emptyCart = document.getElementById('empty-cart');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    const selectionItems = document.getElementById('selection-items');

    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        cartSubtotal.textContent = '₹ 0.00';
        cartTotal.textContent = '₹ 0.00';
        if (selectionItems) selectionItems.innerHTML = '';
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
                    <img src="${item.image}" alt="${product.name}">
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${product.name}</h3>
                    ${item.size ? `<div class="cart-item-size">Size: ${item.size}</div>` : ''}
                    ${item.color ? `<div class="cart-item-color">Color: ${item.color}</div>` : ''}
                    <div class="cart-item-price">₹ ${item.price.toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="updateQuantity('${item.cartKey}', -1)">-</button>
                            <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                            <button class="quantity-btn" onclick="updateQuantity('${item.cartKey}', 1)">+</button>
                        </div>
                        <button class="remove-from-cart" onclick="removeFromCart('${item.cartKey}')">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartSubtotal.textContent = `₹ ${total.toFixed(2)}`;
    cartTotal.textContent = `₹ ${total.toFixed(2)}`;
}

// Modify the updateQuantity function to use cartKey
function updateQuantity(cartKey, change) {
    const item = cart.find(item => item.cartKey === cartKey);
    if (item) {
        item.quantity += change;

        if (item.quantity <= 0) {
            removeFromCart(cartKey);
        } else {
            if (currentUser) {
                db.collection('users').doc(currentUser.uid).collection('cart').doc(cartKey).update({
                    quantity: item.quantity
                })
                .catch(error => {
                    console.error("Error updating quantity: ", error);
                });
            }

            renderCart();
            updateCartCount();
            saveLocalData();
        }
    }
}

// Modify the removeFromCart function to use cartKey
function removeFromCart(cartKey) {
    cart = cart.filter(item => item.cartKey !== cartKey);

    if (currentUser) {
        db.collection('users').doc(currentUser.uid).collection('cart').doc(cartKey).delete()
            .catch(error => {
                console.error("Error removing from cart: ", error);
            });
    }

    renderCart();
    updateCartCount();
    saveLocalData();
}

// Modify the placeOrder function to include size and color in order data
function placeOrder() {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    // Get current user data for shipping info
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('User data not found');
            }

            const userData = doc.data();
            
            // Validate shipping information
            if (!userData.phone || !userData.address) {
                alert('Please complete your shipping information before placing an order');
                document.getElementById('edit-shipping-form').style.display = 'block';
                document.getElementById('shipping-info').style.display = 'none';
                return;
            }

            const orderData = {
                customerId: currentUser.uid,
                customerName: currentUser.displayName || currentUser.email,
                customerEmail: currentUser.email,
                customerPhone: userData.phone,
                customerAddress: userData.address,
                items: cart.map(item => ({
                    ...item,
                    // Include size and color in order items
                    size: item.size || null,
                    color: item.color || null
                })),
                subtotal: cart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
                total: cart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
                status: 'pending',
                createdAt: new Date()
            };

            console.log('Placing order with data:', orderData);

            // Save order to Firestore
            return db.collection('orders').add(orderData);
        })
        .then((docRef) => {
            console.log('Order placed successfully with ID:', docRef.id);
            
            // Clear cart after successful order
            const deletePromises = cart.map(item => {
                return db.collection('users').doc(currentUser.uid).collection('cart').doc(item.cartKey).delete();
            });

            return Promise.all(deletePromises);
        })
        .then(() => {
            // Clear local cart
            cart = [];
            productSelections = {};
            updateCartCount();
            saveLocalData();

            showNotification('Order placed successfully!');
            renderCart();
            
            // Reload orders to show the new order
            loadOrders();
            
            // Go to orders page
            showOrdersPage();
        })
        .catch(error => {
            console.error("Error placing order: ", error);
            
            if (error.message === 'User data not found') {
                showNotification('Please complete your profile information');
            } else if (error.code === 'permission-denied') {
                showNotification('Permission denied. Please check Firestore security rules.');
            } else {
                showNotification('Error placing order: ' + error.message);
            }
        });
}

