# Global News Blog

A complete news blog website with frontend and backend built with HTML, CSS, JavaScript, and Node.js.

## Features
- 📰 View latest news articles
- 🎯 Filter by categories (Politics, Fashion, Entertainment, Technology, Sports)
- 🔍 Search functionality
- 📝 Add new articles
- 📱 Responsive design for all devices
- 🗄️ JSON database with auto-creation

## Notes about project folder
- Place the project files inside your working folder. This repository was developed in a folder named `MANYAR ORIGINAL` (the exact name is optional).

## Quick Start

### 1. Install Node.js
Download and install from: https://nodejs.org/

### 2. Setup the Project
If you already have the files in the project folder, run the commands below from that folder.

```powershell
# Install dependencies
npm install

# Start the server
npm start

# (Optional) Run with nodemon for development
npm run dev
```

Open your browser at `http://localhost:3000` after the server starts.

### 3. What the server does
- Serves the frontend files (`index.html`, `style.css`, `script.js`) and exposes a JSON-based API at `/api/news`.
- The server will auto-create `db.json` with sample articles on first run.

If you want me to rename the folder to `MANYAR ORIGINAL` on your filesystem, tell me and I can apply that change.

## Deploy to Vercel

This project uses simple Node.js serverless functions under the `api/` folder so it can deploy on Vercel. Note the filesystem is ephemeral on Vercel — writes to `db.json` will not be persisted reliably across invocations or deployments. Use an external DB for production.

Quick steps to deploy:

```powershell
# Install Vercel CLI (optional, for local dev and deploy)
npm i -g vercel

# Login and deploy (follow prompts)
vercel login
vercel
```

You can also push this repository to GitHub and connect it to Vercel (recommended). The `vercel.json` file is included to configure routes and function builds.

If you want persistent storage, I can help wire Supabase, MongoDB Atlas, Firebase, or Vercel KV.
# Global News Blog

A complete news blog website with frontend and backend built with HTML, CSS, JavaScript, and Node.js.

## Features
- 📰 View latest news articles
- 🎯 Filter by categories (Politics, Fashion, Entertainment, Technology, Sports)
- 🔍 Search functionality
- 📝 Add new articles
- 📱 Responsive design for all devices
- 🗄️ JSON database with auto-creation

## Quick Start

### 1. Install Node.js
Download and install from: https://nodejs.org/

### 2. Setup the Project
```bash
# Create project folder
mkdir news-blog
cd news-blog

# Create all 6 files in this folder:
# index.html, style.css, script.js, server.js, package.json, README.md