
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Allow config via ENV, default to local folder for dev, /app/data for Docker
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request Logger: Helps debug if the phone is actually reaching the laptop
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} from ${ip}`);
    next();
});

// Healthcheck endpoint for Docker/Traefik
app.get('/', (req, res) => {
    res.status(200).send('Longevity Server OK');
});

// Simple in-memory DB backed by file
let db = {
  users: {}, // username -> { password, data }
};

// Ensure directory exists
async function ensureDir() {
  const dir = path.dirname(DB_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Load DB on start
async function loadDb() {
  await ensureDir();
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    db = JSON.parse(data);
    console.log(`Database loaded from ${DB_PATH}`);
  } catch (e) {
    console.log("No existing DB, starting fresh.");
    await saveDb();
  }
}

async function saveDb() {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: ${username}`);
  
  if (!db.users[username]) {
    // Auto-register for prototype simplicity
    db.users[username] = { password, data: null };
    await saveDb();
    console.log(`New user created: ${username}`);
    return res.json({ token: username, message: "Account created" });
  }

  if (db.users[username].password === password) {
    console.log(`User authenticated: ${username}`);
    return res.json({ token: username });
  }

  res.status(401).json({ error: "Invalid credentials" });
});

app.post('/api/sync', async (req, res) => {
  const token = req.headers.authorization; // Simple username as token for prototype
  if (!token || !db.users[token]) return res.status(401).json({ error: "Unauthorized" });

  const clientData = req.body; 
  console.log(`Syncing data for ${token} (${clientData.entries?.length || 0} entries)`);

  // Default state structure
  const serverData = db.users[token].data || { 
    entries: [], 
    metrics: [], 
    categories: [], 
    regimen: "", 
    settings: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' } 
  };

  // --- MERGE LOGIC ---
  const mergedEntriesMap = new Map();
  serverData.entries?.forEach(e => mergedEntriesMap.set(e.id, e));
  clientData.entries?.forEach(e => mergedEntriesMap.set(e.id, e)); 
  const mergedEntries = Array.from(mergedEntriesMap.values());

  const mergedMetrics = clientData.metrics && clientData.metrics.length > 0 ? clientData.metrics : serverData.metrics;
  const mergedCategories = clientData.categories && clientData.categories.length > 0 ? clientData.categories : serverData.categories;
  const mergedRegimen = clientData.regimen || serverData.regimen;
  
  // Shallow merge settings, preferring client's most recent choice
  const mergedSettings = { ...serverData.settings, ...clientData.settings };

  const finalState = {
    entries: mergedEntries,
    metrics: mergedMetrics,
    categories: mergedCategories,
    regimen: mergedRegimen,
    settings: mergedSettings
  };

  db.users[token].data = finalState;
  await saveDb();

  res.json(finalState);
});

// Start server immediately
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local Access: http://localhost:${PORT}`);
  
  // Load DB after server starts
  loadDb().catch(err => {
    console.error('Failed to load database:', err);
  });
});
