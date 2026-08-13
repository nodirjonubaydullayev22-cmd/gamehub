/* ==========================================================================
   Full-Stack Native Node.js REST API Server - Free Gaming Hub
   Features: Zero-dependency native Node.js HTTP server, User Auth, High Score DB,
   Cloud Leaderboard, Achievement Sync & Static File Server
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Database Helpers
function loadDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialData = { users: [], scores: [], achievements: {} };
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return { users: [], scores: [], achievements: {} };
  }
}

function saveDB(dbData) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving database:', err);
    return false;
  }
}

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP Server Listener
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = req.url.split('?')[0];

  // Helper to parse JSON body
  const parseJSON = (callback) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        callback(null, parsed);
      } catch (err) {
        callback(err, null);
      }
    });
  };

  // REST API Routes
  if (reqUrl.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    // GET /api/health
    if (reqUrl === '/api/health' && req.method === 'GET') {
      const db = loadDB();
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'online',
        version: '2.0.0',
        totalUsers: db.users.length,
        totalScores: db.scores.length,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // POST /api/auth/login
    if (reqUrl === '/api/auth/login' && req.method === 'POST') {
      parseJSON((err, body) => {
        const name = body ? body.name : null;
        if (!name || name.trim() === '') {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Gamer name is required' }));
          return;
        }

        const db = loadDB();
        const gamerName = name.trim();
        let user = db.users.find(u => u.name.toLowerCase() === gamerName.toLowerCase());

        if (!user) {
          user = { name: gamerName, totalScore: 0, gamesPlayed: 0, wins: 0, losses: 0, favoriteGame: 'Snake' };
          db.users.push(user);
          saveDB(db);
        }

        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Login successful', user }));
      });
      return;
    }

    // GET /api/leaderboard
    if (reqUrl === '/api/leaderboard' && req.method === 'GET') {
      const db = loadDB();
      const sorted = [...db.scores].sort((a, b) => b.score - a.score).slice(0, 20);
      const ranked = sorted.map((item, index) => ({ ...item, rank: index + 1 }));

      res.writeHead(200);
      res.end(JSON.stringify({ leaderboard: ranked }));
      return;
    }

    // POST /api/scores
    if (reqUrl === '/api/scores' && req.method === 'POST') {
      parseJSON((err, body) => {
        const { name, game, score, isWin } = body || {};
        if (!name || !game || score === undefined) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing required parameters' }));
          return;
        }

        const db = loadDB();
        const gamerName = name.trim();
        let user = db.users.find(u => u.name.toLowerCase() === gamerName.toLowerCase());

        if (!user) {
          user = { name: gamerName, totalScore: 0, gamesPlayed: 0, wins: 0, losses: 0, favoriteGame: game };
          db.users.push(user);
        }

        user.gamesPlayed += 1;
        user.totalScore += Math.max(0, score);
        if (isWin) user.wins += 1; else user.losses += 1;

        const existingIdx = db.scores.findIndex(s => s.name.toLowerCase() === gamerName.toLowerCase() && s.game === game);
        if (existingIdx !== -1) {
          if (score > db.scores[existingIdx].score) {
            db.scores[existingIdx].score = score;
            db.scores[existingIdx].date = new Date().toISOString().split('T')[0];
          }
        } else {
          db.scores.push({
            name: gamerName,
            game: game,
            score: score,
            date: new Date().toISOString().split('T')[0]
          });
        }

        saveDB(db);
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Score saved successfully', user, bestScore: score }));
      });
      return;
    }

    // POST /api/achievements/unlock
    if (reqUrl === '/api/achievements/unlock' && req.method === 'POST') {
      parseJSON((err, body) => {
        const { name, achievementId } = body || {};
        if (!name || !achievementId) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing name or achievementId' }));
          return;
        }

        const db = loadDB();
        const gamerName = name.trim();

        if (!db.achievements[gamerName]) db.achievements[gamerName] = [];
        if (!db.achievements[gamerName].includes(achievementId)) {
          db.achievements[gamerName].push(achievementId);
          saveDB(db);
        }

        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Achievement unlocked', achievements: db.achievements[gamerName] }));
      });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);
  let extname = String(path.extname(filePath)).toLowerCase();

  if (!extname) {
    filePath += '.html';
    extname = '.html';
  }

  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Page Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎮 FREE GAMING HUB REST API SERVER IS ONLINE!`);
  console.log(`🚀 Serving Full-Stack Apps & API at: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
