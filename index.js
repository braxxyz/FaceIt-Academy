const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const APP_DATA_FILE = path.join(DATA_DIR, 'app-data.json');

const STORAGE_KEYS = [
  'accounts',
  'profiles',
  'teams',
  'messages',
  'conversations',
  'calendar'
];

const DEFAULT_APP_DATA = {
  accounts: [],
  profiles: [],
  teams: [],
  messages: [],
  conversations: [],
  calendar: []
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(session({
  secret: 'academycr-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(express.static(PUBLIC_DIR));

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readLegacyUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeAppData(data) {
  const normalized = { ...DEFAULT_APP_DATA };
  if (data && typeof data === 'object') {
    for (const key of STORAGE_KEYS) {
      normalized[key] = normalizeArray(data[key]);
    }
  }
  return normalized;
}

function migrateLegacyData() {
  const legacyUsers = readLegacyUsers();
  const accounts = [];
  const profiles = [];

  for (const [overwatchId, user] of Object.entries(legacyUsers)) {
    if (!user || typeof user !== 'object') continue;

    accounts.push({
      name: user.name || '',
      email: user.email || '',
      overwatchId,
      password: user.password || '',
      createdAt: user.createdAt || Date.now()
    });

    if (user.profile && typeof user.profile === 'object' && Object.keys(user.profile).length) {
      profiles.push({
        userId: overwatchId,
        nickname: user.profile.nickname || overwatchId,
        name: user.profile.name || user.name || '',
        role: user.profile.role || '',
        battletag: user.profile.battletag || overwatchId,
        team: user.profile.team || '',
        bio: user.profile.bio || '',
        avatar: user.profile.avatar || '',
        createdAt: user.profile.createdAt || user.createdAt || Date.now()
      });
    }
  }

  return {
    ...DEFAULT_APP_DATA,
    accounts,
    profiles
  };
}

function readAppData() {
  ensureDataDir();

  try {
    const raw = fs.readFileSync(APP_DATA_FILE, 'utf8');
    return normalizeAppData(JSON.parse(raw));
  } catch {
    const migrated = migrateLegacyData();
    writeAppData(migrated);
    return migrated;
  }
}

function writeAppData(data) {
  ensureDataDir();
  fs.writeFileSync(APP_DATA_FILE, JSON.stringify(normalizeAppData(data), null, 2));
}

function sanitizeAccount(account) {
  if (!account) return null;
  return {
    name: account.name || '',
    email: account.email || '',
    overwatchId: account.overwatchId,
    createdAt: account.createdAt || null
  };
}

function getCurrentUserFromSession(req) {
  if (!req.session.userId) return null;
  const data = readAppData();
  const account = data.accounts.find((item) => item.overwatchId === req.session.userId);
  return sanitizeAccount(account);
}

app.get('/', (_req, res) => {
  res.sendFile(path.join(PAGES_DIR, 'index.html'));
});

[
  'index.html',
  'login.html',
  'perfil.html',
  'mi-perfil.html',
  'chat.html',
  'configuracion.html',
  'crear-equipo.html'
].forEach((page) => {
  app.get(`/${page}`, (_req, res) => {
    res.sendFile(path.join(PAGES_DIR, page));
  });
});

app.get('/api/bootstrap', (req, res) => {
  const data = readAppData();
  res.json({
    currentUser: getCurrentUserFromSession(req),
    storage: data
  });
});

app.post('/api/storage/:key', (req, res) => {
  const { key } = req.params;
  if (!STORAGE_KEYS.includes(key)) {
    return res.status(400).json({ error: 'Clave de almacenamiento no permitida.' });
  }

  const data = readAppData();
  data[key] = normalizeArray(req.body?.value);
  writeAppData(data);
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const overwatchId = String(req.body?.overwatchId || '').trim();
  const password = String(req.body?.password || '').trim();
  const data = readAppData();
  const account = data.accounts.find((item) => item.overwatchId === overwatchId);

  if (!account || account.password !== password) {
    return res.status(401).json({ error: 'ID de Overwatch o contraseña incorrecta.' });
  }

  req.session.userId = overwatchId;
  res.json({ success: true, user: sanitizeAccount(account) });
});

app.post('/api/register', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const overwatchId = String(req.body?.overwatchId || '').trim();
  const password = String(req.body?.password || '').trim();

  if (!name || !email || !overwatchId || !password) {
    return res.status(400).json({ error: 'Completa todos los campos para registrarte.' });
  }

  const data = readAppData();
  if (data.accounts.some((item) => item.overwatchId === overwatchId)) {
    return res.status(400).json({ error: 'El ID de Overwatch ya está registrado.' });
  }

  const account = {
    name,
    email,
    overwatchId,
    password,
    createdAt: Date.now()
  };

  data.accounts.push(account);
  writeAppData(data);

  req.session.userId = overwatchId;
  res.json({ success: true, user: sanitizeAccount(account) });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/user', (req, res) => {
  res.json({ user: getCurrentUserFromSession(req) });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
