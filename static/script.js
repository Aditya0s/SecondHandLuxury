document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.getElementById("search-button");
    const searchBox = document.getElementById("search-box");
    const productsContainer = document.getElementById("products");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    const pageNumber = document.getElementById("page-number");

    // Constants
    const BASE_URL = "https://www.vestiairecollective.com";
    const DEFAULT_IMAGE = "/static/default.jpg"; // Make sure this image exists in your static folder
    const IMAGE_BASE_URL = "https://cdn.vestiairecollective.com"; // The actual image CDN
    
    let currentPage = 1;

    function fetchProducts() {
        const query = searchBox.value.trim();
        if (!query) {
            alert("Please enter a search term");
            return;
        }

        // Show loading state
        productsContainer.innerHTML = '<div class="loading">Loading luxury finds...</div>';
        
        fetch(`/search?q=${encodeURIComponent(query)}&page=${currentPage}`)
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

                if (!Array.isArray(data) || data.length === 0) {
                    productsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <p>No luxury items found. Try a different search.</p>
                        </div>
                    `;
                    return;
                }

                // Process each product
                data.forEach(product => {
                    // Construct proper image URL - using the correct CDN
                    const imageUrl = product.pictures && product.pictures.length > 0 
                        ? IMAGE_BASE_URL + product.pictures[0] 
                        : DEFAULT_IMAGE;
                    
                    // Construct proper product URL
                    const productUrl = BASE_URL + product.link;
                    
                    // Format price (cents to dollars)
                    const price = product.price 
                        ? `$${(product.price.cents / 100).toFixed(2)} ${product.price.currency || ''}`
                        : 'Price not available';

                    // Create product card
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    productCard.innerHTML = `
                        <div class="product-image-container">
                            <img src="${imageUrl}" alt="${product.name}" 
                                 onerror="this.src='${DEFAULT_IMAGE}';this.onerror=null;"
                                 loading="lazy">
                        </div>
                        <div class="product-info">
                            <div class="product-brand">${product.brand?.name || 'Luxury Brand'}</div>
                            <h3 class="product-title">${product.name}</h3>
                            <div class="product-price">${price}</div>
                            <p class="product-description">${product.description || ''}</p>
                            <a href="${productUrl}" target="_blank" class="view-button">
                                View on Vestiaire <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    `;
                    productsContainer.appendChild(productCard);
                });

                // Update pagination
                pageNumber.innerText = currentPage;
                prevPageBtn.disabled = currentPage === 1;
                nextPageBtn.disabled = data.length < 20; // Assuming 20 items per page
            })
            .catch(error => {
                console.error("Error fetching products:", error);
                productsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load products. Please try again later.</p>
                    </div>
                `;
            });
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