const { readDB, writeDB } = require('../db');
const { URL } = require('url');

function getIdFromPath(req) {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

module.exports = async (req, res) => {
  const id = getIdFromPath(req);

  try {
    const db = await readDB();
    db.news = db.news || [];

    if (req.method === 'GET') {
      const article = db.news.find(a => a.id === id);
      if (!article) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Article not found' }));
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(article));
    }

    if (req.method === 'DELETE') {
      const idx = db.news.findIndex(a => a.id === id);
      if (idx === -1) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Article not found' }));
      }

      db.news.splice(idx, 1);

      const writeOk = await writeDB(db);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      if (!writeOk) {
        return res.end(JSON.stringify({
          message: 'Article deleted (in-memory).\nWrite to local filesystem failed (ephemeral/read-only). Changes will not persist on Vercel.',
        }));
      }

      return res.end(JSON.stringify({ message: 'Article deleted' }));
    }

    res.statusCode = 405;
    res.setHeader('Allow', 'GET, DELETE');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (err) {
    console.error('API error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};
