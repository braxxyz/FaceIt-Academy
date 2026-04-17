const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'academycr-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Users storage
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper functions
function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Routes
app.get('/api/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const users = readUsers();
  const user = users[req.session.userId];
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ profile: user.profile || {} });
});

app.post('/api/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const users = readUsers();
  const user = users[req.session.userId];
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  user.profile = req.body;
  writeUsers(users);
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { overwatchId, password } = req.body;
  const users = readUsers();
  const user = users[overwatchId];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'ID de Overwatch o contraseña incorrecta' });
  }
  req.session.userId = overwatchId;
  res.json({ success: true });
});

app.post('/api/register', (req, res) => {
  const { overwatchId, password } = req.body;
  const users = readUsers();
  if (users[overwatchId]) {
    return res.status(400).json({ error: 'El ID de Overwatch ya está registrado' });
  }
  users[overwatchId] = { password, profile: {} };
  writeUsers(users);
  req.session.userId = overwatchId;
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user', (req, res) => {
  res.json({ userId: req.session.userId });
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});