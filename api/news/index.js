const { readDB, writeDB } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { URL } = require('url');

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const q = url.searchParams.get('q');
  const category = url.searchParams.get('category');

  try {
    if (req.method === 'GET') {
      const db = await readDB();
      let news = db.news || [];

      if (q) {
        const searchTerm = q.toLowerCase();
        news = news.filter(a =>
          a.title.toLowerCase().includes(searchTerm) ||
          a.content.toLowerCase().includes(searchTerm) ||
          a.author.toLowerCase().includes(searchTerm) ||
          a.category.toLowerCase().includes(searchTerm)
        );
      }

      if (category) {
        news = news.filter(a => a.category === category);
      }

      news.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(news));
    }

    if (req.method === 'POST') {
      const body = await parseJSONBody(req);
      const { title, content, category: cat, author, imageUrl } = body;

      if (!title || !content || !cat || !author) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Missing required fields' }));
      }

      const db = await readDB();
      const newArticle = {
        id: uuidv4(),
        title,
        content,
        category: cat,
        author,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=600&auto=format&fit=crop',
        createdAt: new Date().toISOString()
      };

      db.news = db.news || [];
      db.news.unshift(newArticle);

      // Attempt to persist. On Vercel this may fail due to read-only filesystem.
      const writeOk = await writeDB(db);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      if (!writeOk) {
        // Return created object but include a warning about ephemeral storage.
        return res.end(JSON.stringify({
          ...newArticle,
          warning: 'Write to local filesystem failed (ephemeral/read-only). Changes will not persist on Vercel. Use external DB for persistence.'
        }));
      }

      return res.end(JSON.stringify(newArticle));
    }

    res.statusCode = 405;
    res.setHeader('Allow', 'GET, POST');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (err) {
    console.error('API error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};
