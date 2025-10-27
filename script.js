 // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyDiCRubvpqNlkEdbiZxLNi6uvw12MM6QFI",
            authDomain: "kiswah-120c0.firebaseapp.com",
            projectId: "kiswah-120c0",
            storageBucket: "kiswah-120c0.firebasestorage.app",
            messagingSenderId: "236816406918",
            appId: "1:236816406918:web:015f026bcec53fbb9af407",
            measurementId: "G-3T9KJ1QCPJ"
        };

        // Add this to your existing script section, after Firebase configuration
        const vercelAnalytics = {
            trackPageview: function () {
                if (window.va) {
                    window.va('event', 'pageview', {
                        url: window.location.pathname
                    });
                }
            },

            trackEvent: function (eventName, data) {
                if (window.va) {
                    window.va('event', eventName, data);
                }
            }
        };

        // Track page views
        document.addEventListener('DOMContentLoaded', function () {
            vercelAnalytics.trackPageview();

            // Track route changes (for SPA-like behavior)
            const originalShowHomePage = showHomePage;
            const originalShowAdminPanel = showAdminPanel;

            showHomePage = function () {
                originalShowHomePage();
                setTimeout(() => vercelAnalytics.trackPageview(), 100);
            };

            showAdminPanel = function () {
                originalShowAdminPanel();
                setTimeout(() => vercelAnalytics.trackPageview(), 100);
            };
        });

        // Add these functions to your existing script
        function trackProductView(productId, productName) {
            vercelAnalytics.trackEvent('product_view', {
                product_id: productId,
                product_name: productName,
                category: selectedCategory
            });
        }

        function trackWhatsAppEnquiry(productId, productName) {
            vercelAnalytics.trackEvent('whatsapp_enquiry', {
                product_id: productId,
                product_name: productName,
                category: selectedCategory
            });
        }

        function trackCategoryView(categoryId, categoryName) {
            vercelAnalytics.trackEvent('category_view', {
                category_id: categoryId,
                category_name: categoryName
            });
        }

        function trackAdminAction(action, details) {
            vercelAnalytics.trackEvent('admin_action', {
                action: action,
                details: details,
                user_email: currentUser ? currentUser.email : 'anonymous'
            });
        }

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const auth = firebase.auth();

        // DOM Elements
        const mainContent = document.getElementById('main-content');
        const adminPanel = document.getElementById('admin-panel');
        const productsContainer = document.getElementById('products-container');
        const skeletonLoading = document.getElementById('skeleton-loading');
        const categoriesContent = document.getElementById('categories-content');
        const categoryDisplay = document.getElementById('category-display');
        const currentCategory = document.getElementById('current-category');
        const authModal = document.getElementById('auth-modal');
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('nav-links');
        const headerActions = document.querySelector('.header-actions');
        const adminLink = document.getElementById('admin-link');
        const adminLinkMobile = document.getElementById('admin-link-mobile');
        const scrollBtn = document.getElementById('scrollBtn');
        const adminProductsList = document.getElementById('admin-products-list');
        const adminCategoriesList = document.getElementById('admin-categories-list');
        const addProductForm = document.getElementById('add-product-form');
        const addCategoryForm = document.getElementById('add-category-form');
        const productCategorySelect = document.getElementById('product-category');
        const addProductTitle = document.getElementById('add-product-title');
        const productSubmitBtn = document.getElementById('product-submit-btn');

        // Global variables
        let currentUser = null;
        let products = [];
        let categories = [];
        let editingProductId = null;
        let selectedCategory = 'all';

        // Initialize the app
        function initApp() {
            // Check authentication state
            auth.onAuthStateChanged(user => {
                currentUser = user;
                if (user) {
                    // User is signed in
                    if (user.email === 'tosifshaikh1707@gmail.com') {
                        // Show admin link for the specific admin email
                        adminLink.style.display = 'flex';
                        adminLinkMobile.style.display = 'block';
                    }
                    // Update UI for logged in user
                    document.querySelector('.action-item span').textContent = 'Account';
                    closeAuthModal();
                } else {
                    // User is signed out
                    adminLink.style.display = 'none';
                    adminLinkMobile.style.display = 'none';
                    document.querySelector('.action-item span').textContent = 'Account';
                }
            });

            // Load initial data
            loadCategories();
            loadProducts();

            // Set up event listeners
            setupEventListeners();
        }

        // Set up event listeners
        function setupEventListeners() {
            // Scroll to products
            scrollBtn.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
            });

            // Hamburger menu
            hamburger.addEventListener('click', toggleMobileMenu);

            // Auth forms
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('register-form').addEventListener('submit', handleRegister);

            // Admin forms
            addProductForm.addEventListener('submit', handleAddProduct);
            addCategoryForm.addEventListener('submit', handleAddCategory);

            // Close modal when clicking outside
            window.addEventListener('click', function (e) {
                if (e.target === authModal) {
                    closeAuthModal();
                }
            });
        }

        // Load categories from Firestore
        function loadCategories() {
            db.collection('categories').get().then(snapshot => {
                categories = [];
                categoriesContent.innerHTML = '';
                adminCategoriesList.innerHTML = '';
                productCategorySelect.innerHTML = '<option value="">Select Category</option>';

                // Add "All Products" option
                const allProductsLink = document.createElement('a');
                allProductsLink.href = '#';
                allProductsLink.textContent = 'All Products';
                allProductsLink.onclick = () => filterProductsByCategory('all');
                categoriesContent.appendChild(allProductsLink);

                snapshot.forEach(doc => {
                    const category = { id: doc.id, ...doc.data() };
                    categories.push(category);

                    // Add to categories dropdown
                    const categoryLink = document.createElement('a');
                    categoryLink.href = '#';
                    categoryLink.textContent = category.name;
                    categoryLink.onclick = () => filterProductsByCategory(category.id);
                    categoriesContent.appendChild(categoryLink);

                    // Add to admin categories table
                    const categoryRow = document.createElement('tr');
                    categoryRow.innerHTML = `
                        <td>${category.id}</td>
                        <td>${category.name}</td>
                        <td>
                            <button class="btn-sm btn-edit">Edit</button>
                            <button class="btn-sm btn-delete" onclick="deleteCategory('${category.id}')">Delete</button>
                        </td>
                    `;
                    adminCategoriesList.appendChild(categoryRow);

                    // Add to product category select
                    const categoryOption = document.createElement('option');
                    categoryOption.value = category.id;
                    categoryOption.textContent = category.name;
                    productCategorySelect.appendChild(categoryOption);
                });
            }).catch(error => {
                console.error("Error loading categories: ", error);
                // If there's an error with security rules, use demo categories
                console.log("Using demo categories due to security rules");
                useDemoCategories();
            });
        }

        // Use demo categories if Firestore security rules prevent access
        function useDemoCategories() {
            categories = [
                { id: 'mens', name: 'Men\'s Collection' },
                { id: 'womens', name: 'Women\'s Collection' },
                { id: 'accessories', name: 'Accessories' }
            ];

            categoriesContent.innerHTML = '';
            adminCategoriesList.innerHTML = '';
            productCategorySelect.innerHTML = '<option value="">Select Category</option>';

            // Add "All Products" option
            const allProductsLink = document.createElement('a');
            allProductsLink.href = '#';
            allProductsLink.textContent = 'All Products';
            allProductsLink.onclick = () => filterProductsByCategory('all');
            categoriesContent.appendChild(allProductsLink);

            categories.forEach(category => {
                // Add to categories dropdown
                const categoryLink = document.createElement('a');
                categoryLink.href = '#';
                categoryLink.textContent = category.name;
                categoryLink.onclick = () => filterProductsByCategory(category.id);
                categoriesContent.appendChild(categoryLink);

                // Add to admin categories table
                const categoryRow = document.createElement('tr');
                categoryRow.innerHTML = `
                    <td>${category.id}</td>
                    <td>${category.name}</td>
                    <td>
                        <button class="btn-sm btn-edit">Edit</button>
                        <button class="btn-sm btn-delete">Delete</button>
                    </td>
                `;
                adminCategoriesList.appendChild(categoryRow);

                // Add to product category select
                const categoryOption = document.createElement('option');
                categoryOption.value = category.id;
                categoryOption.textContent = category.name;
                productCategorySelect.appendChild(categoryOption);
            });
        }

        // Load products from Firestore
        function loadProducts() {
            // Show skeleton loading
            skeletonLoading.style.display = 'grid';
            productsContainer.style.display = 'none';

            db.collection('products').get().then(snapshot => {
                products = [];
                productsContainer.innerHTML = '';
                adminProductsList.innerHTML = '';

                snapshot.forEach(doc => {
                    const product = { id: doc.id, ...doc.data() };
                    products.push(product);

                    // Create product card
                    createProductCard(product);

                    // Add to admin products table
                    const productRow = document.createElement('tr');
                    productRow.innerHTML = `
                        <td>${product.id}</td>
                        <td>${product.name}</td>
                        <td>${getCategoryName(product.category)}</td>
                        <td>₹${product.price || 0}</td>
                        <td>${product.discount || 0}%</td>
                        <td>${product.colors.join(', ')}</td>
                        <td>${product.size}</td>
                        <td>${product.material}</td>
                        <td>${product.images.length}</td>
                        <td>
                            <button class="btn-sm btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                            <button class="btn-sm btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
                        </td>
                    `;
                    adminProductsList.appendChild(productRow);
                });

                // Hide skeleton and show products
                setTimeout(() => {
                    skeletonLoading.style.display = 'none';
                    productsContainer.style.display = 'grid';
                }, 1000);
            }).catch(error => {
                console.error("Error loading products: ", error);
                // Hide skeleton even if there's an error
                setTimeout(() => {
                    skeletonLoading.style.display = 'none';
                    productsContainer.style.display = 'grid';
                }, 1000);
            });
        }

        // Create product card
        function createProductCard(product) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.id = `product-${product.id}`;

            // Calculate discounted price
            const price = product.price || 0;
            const discount = product.discount || 0;
            const discountedPrice = price - (price * discount / 100);

            // Generate color chips HTML
            const colorChips = product.colors.map(color => {
                return `<div class="color-chip" style="background-color: ${color.toLowerCase()};" title="${color}"></div>`;
            }).join('');

            // Generate image slider HTML
            const sliderImages = product.images.map((image, index) => {
                return `<div class="slide"><img src="${image}" alt="${product.name}" loading="lazy"></div>`;
            }).join('');

            const sliderDots = product.images.map((_, index) => {
                return `<div class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`;
            }).join('');

            productCard.innerHTML = `
                <div class="product-image">
                    <div class="image-slider">
                        <div class="slider-images">
                            ${sliderImages}
                        </div>
                        ${product.images.length > 1 ? `
                            <button class="slider-btn slider-prev"><i class="fas fa-chevron-left"></i></button>
                            <button class="slider-btn slider-next"><i class="fas fa-chevron-right"></i></button>
                            <div class="slider-dots">
                                ${sliderDots}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title" onclick="toggleProductDetails('${product.id}')">${product.name}</h3>
                    <div class="product-price">
                        ${discount > 0 ? `
                            <span class="current-price">₹${discountedPrice.toFixed(2)}</span>
                            <span class="old-price">₹${price.toFixed(2)}</span>
                            <span class="discount">${discount}% OFF</span>
                        ` : `
                            <span class="current-price">₹${price.toFixed(2)}</span>
                        `}
                    </div>
                    <div class="product-colors">
                        ${colorChips}
                        ${product.colors.length > 5 ? `<span class="color-more">+${product.colors.length - 5} more</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="add-to-cart" onclick="openWhatsApp('${product.id}')">Ask for Enquiry</button>
                    </div>
                </div>
                <div class="product-details">
                    <div class="product-specs">
                        <h4 class="specs-title">Product Details</h4>
                        <ul class="specs-list">
                            <li><span>Material:</span> <span>${product.material}</span></li>
                            <li><span>Size:</span> <span>${product.size}</span></li>
                            <li><span>Colors:</span> <span>${product.colors.join(', ')}</span></li>
                            ${price > 0 ? `<li><span>Price:</span> <span>₹${price.toFixed(2)}</span></li>` : ''}
                            ${discount > 0 ? `<li><span>Discount:</span> <span>${discount}% OFF</span></li>` : ''}
                        </ul>
                    </div>
                </div>
            `;

            productsContainer.appendChild(productCard);

            // Add event listeners for image slider if needed
            if (product.images.length > 1) {
                setupImageSlider(productCard, product.images.length);
            }
        }

        // Setup image slider functionality
        function setupImageSlider(productCard, imageCount) {
            const sliderImages = productCard.querySelector('.slider-images');
            const prevBtn = productCard.querySelector('.slider-prev');
            const nextBtn = productCard.querySelector('.slider-next');
            const dots = productCard.querySelectorAll('.slider-dot');

            let currentSlide = 0;

            function goToSlide(index) {
                if (index < 0) index = imageCount - 1;
                if (index >= imageCount) index = 0;

                currentSlide = index;
                sliderImages.style.transform = `translateX(-${currentSlide * 100}%)`;

                // Update active dot
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === currentSlide);
                });
            }

            prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
            nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

            dots.forEach((dot, i) => {
                dot.addEventListener('click', () => goToSlide(i));
            });
        }

        // Toggle product details
        function toggleProductDetails(productId) {
            const productCard = document.getElementById(`product-${productId}`);
            const isExpanded = productCard.classList.contains('expanded');

            // Track product view when expanded
            if (!isExpanded) {
                const product = products.find(p => p.id === productId);
                if (product) {
                    trackProductView(productId, product.name);
                }
            }

            // Close all expanded cards first
            document.querySelectorAll('.product-card.expanded').forEach(card => {
                if (card.id !== `product-${productId}`) {
                    card.classList.remove('expanded');
                }
            });

            // Toggle the clicked card
            productCard.classList.toggle('expanded', !isExpanded);
        }

        // Update the openWhatsApp function
        function openWhatsApp(productId) {
            const product = products.find(p => p.id === productId);
            if (product) {
                // Track WhatsApp enquiry
                trackWhatsAppEnquiry(productId, product.name);

                // Calculate discounted price
                const price = product.price || 0;
                const discount = product.discount || 0;
                const discountedPrice = price - (price * discount / 100);

                // Create a message with product details and image
                const message = `Hello, I'm interested in this product: ${product.name}.\n\nProduct Details:\n- Material: ${product.material}\n- Size: ${product.size}\n- Colors: ${product.colors.join(', ')}\n- Price: ₹${price.toFixed(2)}${discount > 0 ? `\n- Discount: ${discount}% OFF\n- Final Price: ₹${discountedPrice.toFixed(2)}` : ''}\n\nPlease provide more details and availability information.`;

                // For WhatsApp, we can't directly send images in the initial message
                // But we can include the image URL in the message
                const imageUrl = product.images[0];
                const fullMessage = `${message}\n\nProduct Image: ${imageUrl}`;

                const url = `https://wa.me 919423816556?text=${encodeURIComponent(fullMessage)}`;
                window.open(url, '_blank');
            }
        }

        // Open WhatsApp for quick enquiry
        function openQuickWhatsApp() {
            const message = "Hello, I'm interested in your products. Can you please share your catalog?";
            const url = `https://wa.me/ 919423816556?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }

        // Filter products by category
        function filterProductsByCategory(categoryId) {
            selectedCategory = categoryId;

            // Track category view
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                trackCategoryView(categoryId, category.name);
            }

            // Update category display
            categoryDisplay.style.display = 'block';
            if (categoryId === 'all') {
                currentCategory.textContent = 'All Products';
            } else {
                const category = categories.find(c => c.id === categoryId);
                currentCategory.textContent = category ? category.name : 'Unknown Category';
            }

            // Filter products
            if (categoryId === 'all') {
                // Show all products
                document.querySelectorAll('.product-card').forEach(card => {
                    card.style.display = 'block';
                });
            } else {
                // Filter by category
                document.querySelectorAll('.product-card').forEach(card => {
                    const productId = card.id.replace('product-', '');
                    const product = products.find(p => p.id === productId);
                    if (product && product.category === categoryId) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
        }

        // Get category name by ID
        function getCategoryName(categoryId) {
            const category = categories.find(c => c.id === categoryId);
            return category ? category.name : 'Unknown';
        }

        // Toggle mobile menu
        function toggleMobileMenu() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            headerActions.classList.toggle('mobile-visible');
        }

        // Close mobile menu
        function closeMobileMenu() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            headerActions.classList.remove('mobile-visible');
        }

        // Show home page
        function showHomePage() {
            mainContent.style.display = 'block';
            adminPanel.style.display = 'none';
            // Reset category display
            categoryDisplay.style.display = 'none';
            selectedCategory = 'all';
            // Show all products
            filterProductsByCategory('all');
        }

        // Show admin panel
        function showAdminPanel() {
            if (currentUser && currentUser.email === 'tosifshaikh1707@gmail.com') {
                mainContent.style.display = 'none';
                adminPanel.style.display = 'block';
            } else {
                toggleAuthModal();
            }
        }

        // Switch admin tab
        function switchAdminTab(tabName) {
            // Update active tab
            document.querySelectorAll('.admin-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(`.admin-tab:nth-child(${tabName === 'products' ? 1 : tabName === 'add-product' ? 2 : 3})`).classList.add('active');

            // Update active content
            document.querySelectorAll('.admin-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`admin-${tabName}`).classList.add('active');
        }

        // Toggle auth modal
        function toggleAuthModal() {
            if (currentUser) {
                // User is logged in, show account options or log out
                if (confirm('Do you want to log out?')) {
                    auth.signOut();
                }
            } else {
                // User is not logged in, show auth modal
                authModal.style.display = 'flex';
                switchAuthTab('login');
            }
        }

        // Close auth modal
        function closeAuthModal() {
            authModal.style.display = 'none';
        }

        // Switch auth tab
        function switchAuthTab(tabName) {
            // Update active tab
            document.querySelectorAll('.auth-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(`.auth-tab:nth-child(${tabName === 'login' ? 1 : 2})`).classList.add('active');

            // Update active form
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tabName}-form`).classList.add('active');
        }

        // Handle login
        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // Signed in successfully
                    currentUser = userCredential.user;
                    closeAuthModal();

                    if (email === 'tosifshaikh1707@gmail.com') {
                        showAdminPanel();
                    }
                })
                .catch(error => {
                    alert('Login failed: ' + error.message);
                });
        }

        // Handle register
        function handleRegister(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const phone = document.getElementById('register-phone').value;
            const password = document.getElementById('register-password').value;

            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // User created successfully
                    currentUser = userCredential.user;

                    // Save additional user data to Firestore
                    return db.collection('users').doc(userCredential.user.uid).set({
                        name: name,
                        email: email,
                        phone: phone,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    closeAuthModal();
                    if (email === 'tosifshaikh1707@gmail.com') {
                        showAdminPanel();
                    }
                })
                .catch(error => {
                    alert('Registration failed: ' + error.message);
                });
        }

        // Handle add/update product
        function handleAddProduct(e) {
            e.preventDefault();

            if (!currentUser || currentUser.email !== 'tosifshaikh1707@gmail.com') {
                alert('Only admin can add products');
                return;
            }

            const name = document.getElementById('product-name').value;
            const category = document.getElementById('product-category').value;
            const price = parseFloat(document.getElementById('product-price').value);
            const discount = parseInt(document.getElementById('product-discount').value) || 0;
            const size = document.getElementById('product-size').value;
            const material = document.getElementById('product-material').value;
            const colors = document.getElementById('product-colors').value.split(',').map(c => c.trim());
            const images = document.getElementById('product-images').value.split('\n').map(i => i.trim()).filter(i => i);

            const productData = {
                name: name,
                category: category,
                price: price,
                discount: discount,
                size: size,
                material: material,
                colors: colors,
                images: images,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (editingProductId) {
                // Update existing product
                db.collection('products').doc(editingProductId).update(productData)
                    .then(() => {
                        alert('Product updated successfully!');
                        trackAdminAction('product_update', { product_id: editingProductId, product_name: name });
                        resetProductForm();
                        loadProducts();
                    })
                    .catch(error => {
                        alert('Error updating product: ' + error.message);
                    });
            } else {
                // Add new product
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

                db.collection('products').add(productData)
                    .then((docRef) => {
                        alert('Product added successfully!');
                        trackAdminAction('product_add', { product_id: docRef.id, product_name: name });
                        resetProductForm();
                        loadProducts();
                    })
                    .catch(error => {
                        alert('Error adding product: ' + error.message);
                    });
            }
        }
        // Edit product
        // Edit product - Update this function
        function editProduct(productId) {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            // Populate form with product data
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-price').value = product.price || 0;
            document.getElementById('product-discount').value = product.discount || 0;
            document.getElementById('product-size').value = product.size;
            document.getElementById('product-material').value = product.material;

            // Set colors in the color picker
            if (product.colors && product.colors.length > 0) {
                // This will be handled by the color picker initialization
                // We'll need to store the colors temporarily and then initialize the picker
                setTimeout(() => {
                    const selectedColorsContainer = document.getElementById('selected-colors');
                    const productColorsInput = document.getElementById('product-colors');

                    // Clear existing colors
                    selectedColorsContainer.innerHTML = '';

                    // Add each color
                    product.colors.forEach(color => {
                        const colorChip = document.createElement('div');
                        colorChip.className = 'selected-color-chip';

                        const colorPreview = document.createElement('div');
                        colorPreview.className = 'selected-color-preview';
                        colorPreview.style.backgroundColor = color;

                        const colorName = document.createElement('span');
                        colorName.textContent = color;

                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-color';
                        removeBtn.innerHTML = '&times;';
                        removeBtn.onclick = () => {
                            colorChip.remove();
                            updateProductColorsInputFromChips();
                        };

                        colorChip.appendChild(colorPreview);
                        colorChip.appendChild(colorName);
                        colorChip.appendChild(removeBtn);

                        selectedColorsContainer.appendChild(colorChip);
                    });

                    // Update the hidden input
                    productColorsInput.value = product.colors.join(', ');
                }, 100);
            }

            document.getElementById('product-images').value = product.images.join('\n');

            // Update form for editing
            editingProductId = productId;
            addProductTitle.textContent = 'Edit Product';
            productSubmitBtn.textContent = 'Update Product';

            // Switch to add product tab
            switchAdminTab('add-product');
        }

        // Helper function to update colors input from chips
        function updateProductColorsInputFromChips() {
            const selectedColorsContainer = document.getElementById('selected-colors');
            const productColorsInput = document.getElementById('product-colors');
            const colorChips = selectedColorsContainer.querySelectorAll('.selected-color-chip');

            const colors = Array.from(colorChips).map(chip => {
                return chip.querySelector('span').textContent;
            });

            productColorsInput.value = colors.join(', ');
        }

        // Reset product form
        function resetProductForm() {
            addProductForm.reset();
            editingProductId = null;
            addProductTitle.textContent = 'Add New Product';
            productSubmitBtn.textContent = 'Add Product';
        }

        // Handle add category
        function handleAddCategory(e) {
            e.preventDefault();

            if (!currentUser || currentUser.email !== 'tosifshaikh1707@gmail.com') {
                alert('Only admin can add categories');
                return;
            }

            const name = document.getElementById('category-name').value;

            // Add category to Firestore
            db.collection('categories').add({
                name: name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
                .then(() => {
                    alert('Category added successfully!');
                    addCategoryForm.reset();
                    loadCategories();
                })
                .catch(error => {
                    alert('Error adding category: ' + error.message);
                });
        }

        // Delete product
        function deleteProduct(productId) {
            if (confirm('Are you sure you want to delete this product?')) {
                const product = products.find(p => p.id === productId);
                db.collection('products').doc(productId).delete()
                    .then(() => {
                        alert('Product deleted successfully!');
                        trackAdminAction('product_delete', { product_id: productId, product_name: product ? product.name : 'unknown' });
                        loadProducts();
                    })
                    .catch(error => {
                        alert('Error deleting product: ' + error.message);
                    });
            }
        }

        // Delete category
        function deleteCategory(categoryId) {
            if (confirm('Are you sure you want to delete this category?')) {
                db.collection('categories').doc(categoryId).delete()
                    .then(() => {
                        alert('Category deleted successfully!');
                        loadCategories();
                    })
                    .catch(error => {
                        alert('Error deleting category: ' + error.message);
                    });
            }
        }

        // Color Picker Functionality
        function initColorPicker() {
            const colorPalette = document.getElementById('color-palette');
            const customColorInput = document.getElementById('custom-color-input');
            const customColorPreview = document.getElementById('custom-color-preview');
            const addCustomColorBtn = document.getElementById('add-custom-color');
            const selectedColorsContainer = document.getElementById('selected-colors');
            const productColorsInput = document.getElementById('product-colors');

            let selectedColors = [];

            // Initialize color preview
            customColorPreview.style.backgroundColor = '#FFFFFF';

            // Update color preview when custom color input changes
            customColorInput.addEventListener('input', function () {
                const colorValue = this.value.trim();
                if (isValidColor(colorValue)) {
                    customColorPreview.style.backgroundColor = colorValue;
                }
            });

            // Add color from palette
            colorPalette.addEventListener('click', function (e) {
                if (e.target.classList.contains('color-option')) {
                    const color = e.target.getAttribute('data-color');
                    addColor(color);
                }
            });

            // Add custom color
            addCustomColorBtn.addEventListener('click', function () {
                const colorValue = customColorInput.value.trim();
                if (colorValue && isValidColor(colorValue)) {
                    addColor(colorValue);
                    customColorInput.value = '';
                    customColorPreview.style.backgroundColor = '#FFFFFF';
                } else {
                    alert('Please enter a valid color name or hex code');
                }
            });

            // Add color to selected colors
            function addColor(color) {
                // Check if color is already selected
                if (!selectedColors.includes(color)) {
                    selectedColors.push(color);
                    updateSelectedColorsDisplay();
                    updateProductColorsInput();
                }
            }

            // Remove color from selected colors
            function removeColor(color) {
                selectedColors = selectedColors.filter(c => c !== color);
                updateSelectedColorsDisplay();
                updateProductColorsInput();
            }

            // Update the display of selected colors
            function updateSelectedColorsDisplay() {
                selectedColorsContainer.innerHTML = '';

                if (selectedColors.length === 0) {
                    selectedColorsContainer.innerHTML = '<p style="color: #999; margin: 0;">No colors selected</p>';
                    return;
                }

                selectedColors.forEach(color => {
                    const colorChip = document.createElement('div');
                    colorChip.className = 'selected-color-chip';

                    const colorPreview = document.createElement('div');
                    colorPreview.className = 'selected-color-preview';
                    colorPreview.style.backgroundColor = getColorValue(color);

                    const colorName = document.createElement('span');
                    colorName.textContent = color;

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-color';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.onclick = () => removeColor(color);

                    colorChip.appendChild(colorPreview);
                    colorChip.appendChild(colorName);
                    colorChip.appendChild(removeBtn);

                    selectedColorsContainer.appendChild(colorChip);
                });
            }

            // Update the hidden input with selected colors
            function updateProductColorsInput() {
                productColorsInput.value = selectedColors.join(', ');
            }

            // Check if a color value is valid
            function isValidColor(color) {
                // Check if it's a valid CSS color
                const s = new Option().style;
                s.color = color;
                return s.color !== '';
            }

            // Get the actual color value for display
            function getColorValue(color) {
                const s = new Option().style;
                s.color = color;
                return s.color || color;
            }

            // Initialize with empty selected colors
            updateSelectedColorsDisplay();
        }

        // Call this function when the DOM is loaded
        document.addEventListener('DOMContentLoaded', function () {
            initColorPicker();

            // Also call it when switching to the add product tab
            const originalSwitchAdminTab = switchAdminTab;
            switchAdminTab = function (tabName) {
                originalSwitchAdminTab(tabName);
                if (tabName === 'add-product') {
                    // Reinitialize color picker when switching to add product tab
                    setTimeout(initColorPicker, 100);
                }
            };
        });

        

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);