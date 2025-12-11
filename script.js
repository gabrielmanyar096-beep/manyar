// API Base URL - use relative path so frontend works when served by the same server
const API_BASE_URL = '/api';

// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const featuredNews = document.getElementById('featuredNews');
const categoryButtons = document.querySelectorAll('.category-btn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const newsForm = document.getElementById('newsForm');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

// Categories with icons and colors
const categories = {
    politics: { icon: 'fa-landmark', color: '#1a237e' },
    fashion: { icon: 'fa-tshirt', color: '#d81b60' },
    entertainment: { icon: 'fa-film', color: '#ff9800' },
    technology: { icon: 'fa-microchip', color: '#2196f3' },
    sports: { icon: 'fa-futbol', color: '#4caf50' }
};

// Load all news on page load
document.addEventListener('DOMContentLoaded', () => {
    loadNews();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Category filter buttons
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            loadNews(category === 'all' ? '' : category);
        });
    });

    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Form submission
    newsForm.addEventListener('submit', handleFormSubmit);

    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
}

// Load news from API
async function loadNews(category = '') {
    try {
        // Show loading
        newsGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading news...</p></div>';
        
        const url = category 
            ? `${API_BASE_URL}/news?category=${category}`
            : `${API_BASE_URL}/news`;
        
        const response = await fetch(url);
        const news = await response.json();
        
        if (news.length > 0) {
            displayFeaturedNews(news[0]);
            displayNewsGrid(news.slice(1));
        } else {
            displayNoNews();
        }
    } catch (error) {
        console.error('Error loading news:', error);
        newsGrid.innerHTML = '<p class="error">Error loading news. Please try again later.</p>';
    }
}

// Display featured news
function displayFeaturedNews(news) {
    if (!news) return;

    const category = categories[news.category];
    featuredNews.innerHTML = `
        <div class="featured-card">
            <div class="news-image" style="background-image: url('${news.imageUrl || 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=1200&auto=format&fit=crop'}'); height: 400px;"></div>
            <div class="featured-content">
                <span class="category-badge" style="background-color: ${category.color}">
                    <i class="fas ${category.icon}"></i> ${news.category.charAt(0).toUpperCase() + news.category.slice(1)}
                </span>
                <h3>${news.title}</h3>
                <div class="featured-meta">
                    <span><i class="fas fa-user"></i> ${news.author}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(news.createdAt)}</span>
                </div>
                <p>${news.content}</p>
            </div>
        </div>
    `;
}

// Display news grid
function displayNewsGrid(news) {
    if (news.length === 0) {
        newsGrid.innerHTML = '<p class="no-news">No news articles found in this category.</p>';
        return;
    }

    newsGrid.innerHTML = news.map(article => {
        const category = categories[article.category];
        const truncatedContent = article.content.length > 150 
            ? article.content.substring(0, 150) + '...' 
            : article.content;

        return `
            <div class="news-card">
                <div class="news-image" style="background-image: url('${article.imageUrl || 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=600&auto=format&fit=crop'}');"></div>
                <div class="news-content">
                    <span class="category-badge" style="background-color: ${category.color}">
                        <i class="fas ${category.icon}"></i> ${article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                    </span>
                    <h3>${article.title}</h3>
                    <p>${truncatedContent}</p>
                    <div class="news-meta">
                        <span><i class="fas fa-user"></i> ${article.author}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(article.createdAt)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display no news message
function displayNoNews() {
    featuredNews.innerHTML = '<p class="no-news">No featured articles available.</p>';
    newsGrid.innerHTML = '<p class="no-news">No news articles found. Be the first to add one!</p>';
}

// Handle search
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        loadNews();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/news/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        if (results.length === 0) {
            newsGrid.innerHTML = '<p class="no-results">No articles found matching your search.</p>';
        } else {
            displayNewsGrid(results);
        }
    } catch (error) {
        console.error('Error searching news:', error);
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        imageUrl: document.getElementById('imageUrl').value || '',
        category: document.getElementById('category').value,
        author: document.getElementById('author').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/news`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Article published successfully!');
            newsForm.reset();
            loadNews();
        } else {
            throw new Error('Failed to publish article');
        }
    } catch (error) {
        console.error('Error publishing article:', error);
        alert('Error publishing article. Please try again.');
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}