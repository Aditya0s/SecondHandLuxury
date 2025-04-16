document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.getElementById("search-button");
    const searchBox = document.getElementById("search-box");
    const productsContainer = document.getElementById("products");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    const pageNumber = document.getElementById("page-number");
    const categoryFilter = document.getElementById("category-filter");
    const brandFilter = document.getElementById("brand-filter");
    const conditionFilter = document.getElementById("condition-filter");
    const clearFiltersBtn = document.getElementById("clear-filters");

    // Constants
    const DEFAULT_IMAGE = "/static/default.jpg";
    let currentPage = 1;
    const ITEMS_PER_PAGE = 20;
    let debounceTimer;

    function fetchProducts() {
        const query = searchBox.value.trim();
        const category = categoryFilter.value;
        const brand = brandFilter.value;
        const condition = conditionFilter.value;

        if (!query && !category && !brand && !condition) {
            productsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search fa-3x"></i>
                    <p>Search for pre-owned luxury items (e.g., Rolex, Chanel) or use filters</p>
                </div>
            `;
            return;
        }

        // Show loading state
        productsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading pre-owned luxury finds...</p></div>';

        // Build query string with filters
        const params = new URLSearchParams({
            q: query,
            page: currentPage
        });
        if (category) params.append("category", category);
        if (brand) params.append("brand", brand);
        if (condition) params.append("condition", condition);

        fetch(`/search?${params.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("API Response:", data);

                // Clear previous results
                productsContainer.innerHTML = "";

                // Check if data contains products
                const products = data.itemSummaries || [];
                if (!Array.isArray(products) || products.length === 0) {
                    productsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-search fa-3x"></i>
                            <p>No pre-owned luxury items found. Try a different search or adjust filters.</p>
                        </div>
                    `;
                    return;
                }

                // Process each product
                products.forEach(product => {
                    const imageUrl = product.image?.imageUrl || DEFAULT_IMAGE;
                    const productUrl = product.itemWebUrl || '#';
                    const price = product.price
                        ? `${product.price.currency} ${product.price.value}`
                        : 'Price not available';
                    const title = product.title || 'No title';
                    const brandName = brand || product.title.split(' ')[0] || 'Luxury Brand';
                    const conditionText = condition
                        ? condition.charAt(0).toUpperCase() + condition.slice(1)
                        : product.condition || 'Unknown';

                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    productCard.innerHTML = `
                        <div class="product-image-container">
                            <img src="${imageUrl}" alt="${title}" 
                                 class="product-image"
                                 onerror="this.src='${DEFAULT_IMAGE}';this.onerror=null;"
                                 loading="lazy">
                        </div>
                        <div class="product-info">
                            <div class="product-brand">${brandName}</div>
                            <h3 class="product-title">${title}</h3>
                            <div class="product-price">${price}</div>
                            <div class="product-condition">${conditionText}</div>
                            <a href="${productUrl}" target="_blank" class="view-button">
                                View on eBay <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    `;
                    productsContainer.appendChild(productCard);
                });

                // Update pagination
                pageNumber.innerText = currentPage;
                prevPageBtn.disabled = currentPage === 1;
                nextPageBtn.disabled = products.length < ITEMS_PER_PAGE || !data.next;
            })
            .catch(error => {
                console.error("Error fetching products:", error);
                productsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Unable to load pre-owned items. Please try again or check your search.</p>
                    </div>
                `;
            });
    }

    // Clear filters and reset UI
    function clearFilters() {
        searchBox.value = "";
        categoryFilter.value = "";
        brandFilter.value = "";
        conditionFilter.value = "";
        currentPage = 1;
        pageNumber.innerText = "1";
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = false;
        productsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search fa-3x"></i>
                <p>Search for pre-owned luxury items (e.g., Rolex, Chanel) or use filters</p>
            </div>
        `;
    }

    // Debounce fetch to prevent rapid API calls
    function debounceFetch() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentPage = 1;
            fetchProducts();
        }, 300);
    }

    // Event Listeners
    searchButton.addEventListener("click", () => {
        currentPage = 1;
        fetchProducts();
    });

    searchBox.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            fetchProducts();
        }
    });

    categoryFilter.addEventListener("change", debounceFetch);
    brandFilter.addEventListener("change", debounceFetch);
    conditionFilter.addEventListener("change", debounceFetch);

    clearFiltersBtn.addEventListener("click", clearFilters);

    nextPageBtn.addEventListener("click", () => {
        currentPage++;
        fetchProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});
