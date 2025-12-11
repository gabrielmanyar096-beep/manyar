const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve files from current directory

// Initialize database if it doesn't exist
async function initializeDatabase() {
    try {
        await fs.access(DB_FILE);
        console.log('Database file exists');
    } catch {
        console.log('Creating new database file...');
        const initialData = {
            news: [
                {
                    id: uuidv4(),
                    title: "Global Climate Summit Reaches Historic Agreement",
                    content: "World leaders have reached a groundbreaking agreement at the Global Climate Summit, committing to reduce carbon emissions by 50% by 2030. The deal includes significant funding for developing nations to transition to renewable energy sources.",
                    category: "politics",
                    author: "Sarah Johnson",
                    imageUrl: "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=1200&auto=format&fit=crop",
                    createdAt: new Date().toISOString()
                },
                {
                    id: uuidv4(),
                    title: "Paris Fashion Week 2024: The Future of Sustainable Fashion",
                    content: "Designers showcased innovative sustainable collections at Paris Fashion Week, featuring recycled materials and zero-waste patterns. The event highlighted the industry's shift towards eco-friendly practices.",
                    category: "fashion",
                    author: "Michael Chen",
                    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop",
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: uuidv4(),
                    title: "New Streaming Platform Challenges Netflix Dominance",
                    content: "A new streaming service has launched with exclusive content partnerships, offering competitive pricing and unique features. Industry analysts predict significant market disruption.",
                    category: "entertainment",
                    author: "Emma Wilson",
                    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop",
                    createdAt: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    id: uuidv4(),
                    title: "AI Breakthrough Revolutionizes Healthcare Diagnostics",
                    content: "Researchers have developed an AI system that can diagnose diseases with 99% accuracy, potentially transforming healthcare delivery and reducing diagnostic errors worldwide.",
                    category: "technology",
                    author: "Dr. James Wilson",
                    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&auto=format&fit=crop",
                    createdAt: new Date(Date.now() - 259200000).toISOString()
                },
                {
                    id: uuidv4(),
                    title: "World Cup 2026: Stadiums Near Completion",
                    content: "Construction of stadiums for the 2026 FIFA World Cup is 80% complete, with organizers promising the most technologically advanced tournament in history.",
                    category: "sports",
                    author: "Robert Martinez",
                    imageUrl: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1200&auto=format&fit=crop",
                    createdAt: new Date(Date.now() - 345600000).toISOString()
                }
            ]
        };
        await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
        console.log('Database initialized with sample data');
    }
}

// Read database
async function readDatabase() {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
}

// Write to database
async function writeDatabase(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Routes
// Get all news or filter by category
app.get('/api/news', async (req, res) => {
    try {
        const { category } = req.query;
        const db = await readDatabase();
        
        let news = db.news;
        
        if (category) {
            news = news.filter(article => article.category === category);
        }
        
        // Sort by date (newest first)
        news.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(news);
    } catch (error) {
        console.error('Error reading database:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search news
app.get('/api/news/search', async (req, res) => {
    try {
        const { q } = req.query;
        const db = await readDatabase();
        
        if (!q) {
            return res.json(db.news);
        }
        
        const searchTerm = q.toLowerCase();
        const results = db.news.filter(article => 
            article.title.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.author.toLowerCase().includes(searchTerm) ||
            article.category.toLowerCase().includes(searchTerm)
        );
        
        res.json(results);
    } catch (error) {
        console.error('Error searching news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new article
app.post('/api/news', async (req, res) => {
    try {
        const { title, content, category, author, imageUrl } = req.body;
        
        if (!title || !content || !category || !author) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const db = await readDatabase();
        
        const newArticle = {
            id: uuidv4(),
            title,
            content,
            category,
            author,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=600&auto=format&fit=crop',
            createdAt: new Date().toISOString()
        };
        
        db.news.unshift(newArticle); // Add to beginning
        await writeDatabase(db);
        
        res.status(201).json(newArticle);
    } catch (error) {
        console.error('Error adding news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get article by ID
app.get('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await readDatabase();
        
        const article = db.news.find(a => a.id === id);
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        res.json(article);
    } catch (error) {
        console.error('Error getting article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete article
app.delete('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await readDatabase();
        
        const index = db.news.findIndex(a => a.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        db.news.splice(index, 1);
        await writeDatabase(db);
        
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize and start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📰 API available at http://localhost:${PORT}/api/news`);
        console.log(`🌍 Website available at http://localhost:${PORT}`);
        console.log(`📁 Database file: ${DB_FILE}`);
    });
}

startServer().catch(console.error);