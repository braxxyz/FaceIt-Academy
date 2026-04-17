const TEAM_STORAGE_KEY = "academycr_teams";
const PROFILE_STORAGE_KEY = "academycr_profiles";

function readStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function fileToDataUrl(file) {
  if (!file) return Promise.resolve("");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTeams(container) {
  if (!container) return;

  const teams = readStorage(TEAM_STORAGE_KEY);

  if (!teams.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No hay equipos cargados todavía</h3>
        <p>Usa el formulario de inscripción para crear el primer equipo con su nombre, descripción, jugadores y logo.</p>
        <a class="btn btn-primary" href="crear-equipo.html">Crear equipo</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="saved-grid">
      ${teams
        .map(
          (team, index) => `
            <article class="saved-card">
              <div class="saved-card-top">
                ${
                  team.logo
                    ? `<img class="saved-logo" src="${team.logo}" alt="Logo de ${escapeHtml(team.name)}" />`
                    : `<div class="saved-logo saved-logo-placeholder">${escapeHtml(team.name.slice(0, 1) || "T")}</div>`
                }
                <div>
                  <p class="saved-kicker">Equipo ${index + 1}</p>
                  <h3>${escapeHtml(team.name || "Sin nombre")}</h3>
                </div>
              </div>
              <p>${escapeHtml(team.description || "Sin descripción todavía.")}</p>
              <div class="saved-tags">
                ${(team.players || [])
                  .filter(Boolean)
                  .map((player) => `<span>${escapeHtml(player)}</span>`)
                  .join("")}
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderProfiles(container) {
  if (!container) return;

  const profiles = readStorage(PROFILE_STORAGE_KEY);

  if (!profiles.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No hay perfiles creados todavía</h3>
        <p>Crea el primer perfil para guardar la información del jugador dentro de esta página.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="saved-grid">
      ${profiles
        .map(
          (profile) => `
            <article class="saved-card profile-card">
              <div class="saved-card-top">
                ${
                  profile.avatar
                    ? `<img class="saved-logo" src="${profile.avatar}" alt="Avatar de ${escapeHtml(profile.nickname)}" />`
                    : `<div class="saved-logo saved-logo-placeholder">${escapeHtml(profile.nickname.slice(0, 1) || "P")}</div>`
                }
                <div>
                  <p class="saved-kicker">${escapeHtml(profile.role || "Jugador")}</p>
                  <h3>${escapeHtml(profile.nickname || "Sin nickname")}</h3>
                  <p class="saved-subtitle">${escapeHtml(profile.name || "Sin nombre")}</p>
                </div>
              </div>
              <p>${escapeHtml(profile.bio || "Sin biografía todavía.")}</p>
              <div class="saved-tags">
                ${profile.battletag ? `<span>${escapeHtml(profile.battletag)}</span>` : ""}
                ${profile.team ? `<span>${escapeHtml(profile.team)}</span>` : ""}
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function initTeamForm() {
  const form = document.querySelector("[data-team-form]");
  if (!form) return;

  const list = document.querySelector("[data-team-list]");
  const message = document.querySelector("[data-team-message]");

  renderTeams(list);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const logoFile = form.querySelector('input[type="file"]')?.files?.[0];
    const logo = await fileToDataUrl(logoFile);

    const team = {
      name: String(formData.get("team-name") || "").trim(),
      description: String(formData.get("team-description") || "").trim(),
      players: [
        formData.get("player-1"),
        formData.get("player-2"),
        formData.get("player-3"),
        formData.get("player-4"),
        formData.get("player-5"),
        formData.get("player-6"),
      ].map((value) => String(value || "").trim()),
      logo,
    };

    if (!team.name) {
      if (message) message.textContent = "Escribe un nombre de equipo antes de guardar.";
      return;
    }

    const teams = readStorage(TEAM_STORAGE_KEY);
    teams.push(team);
    writeStorage(TEAM_STORAGE_KEY, teams);
    form.reset();

    if (message) message.textContent = "Equipo guardado correctamente.";
    renderTeams(list);
  });
}

function initProfileForm() {
  const form = document.querySelector("[data-profile-form]");
  if (!form) return;

  const list = document.querySelector("[data-profile-list]");
  const message = document.querySelector("[data-profile-message]");

  renderProfiles(list);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const avatarFile = form.querySelector('input[type="file"]')?.files?.[0];
    const avatar = await fileToDataUrl(avatarFile);

    const profile = {
      nickname: String(formData.get("nickname") || "").trim(),
      name: String(formData.get("name") || "").trim(),
      role: String(formData.get("role") || "").trim(),
      battletag: String(formData.get("battletag") || "").trim(),
      team: String(formData.get("team") || "").trim(),
      bio: String(formData.get("bio") || "").trim(),
      avatar,
    };

    if (!profile.nickname) {
      if (message) message.textContent = "Escribe un nickname antes de guardar.";
      return;
    }

    // Check if user is logged in
    try {
      const userResponse = await fetch('/api/user');
      const userResult = await userResponse.json();
      if (userResult.userId) {
        // Save to server
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
        const result = await response.json();
        if (result.success) {
          if (message) message.textContent = "Perfil guardado correctamente en el servidor.";
        } else {
          if (message) message.textContent = "Error al guardar perfil.";
        }
      } else {
        // Save to localStorage
        const profiles = readStorage(PROFILE_STORAGE_KEY);
        profiles.push(profile);
        writeStorage(PROFILE_STORAGE_KEY, profiles);
        if (message) message.textContent = "Perfil guardado localmente. Inicia sesión para guardar en el servidor.";
        renderProfiles(list);
      }
    } catch (error) {
      // Fallback to localStorage
      const profiles = readStorage(PROFILE_STORAGE_KEY);
      profiles.push(profile);
      writeStorage(PROFILE_STORAGE_KEY, profiles);
      if (message) message.textContent = "Perfil guardado localmente.";
      renderProfiles(list);
    }

    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTeamForm();
  initProfileForm();
  renderTeams(document.querySelector("[data-home-teams]"));
  initLogin();
});

// Login functionality
function initLogin() {
  // For login.html page
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginSection) {
    // Check if already logged in
    fetch('/api/user').then(res => res.json()).then(result => {
      if (result.userId) {
        window.location.href = 'index.html';
      }
    });
  }

  if (showRegister) {
    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginSection.style.display = 'none';
      registerSection.style.display = 'block';
    });
  }

  if (showLogin) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerSection.style.display = 'none';
      loginSection.style.display = 'block';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const data = {
        overwatchId: formData.get('overwatchId'),
        password: formData.get('password')
      };

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
          alert('Inicio de sesión exitoso');
          window.location.href = 'index.html';
        } else {
          alert(result.error);
        }
      } catch (error) {
        alert('Error al iniciar sesión');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const data = {
        overwatchId: formData.get('overwatchId'),
        password: formData.get('password')
      };

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
          alert('Registro exitoso. Ahora crea tu perfil.');
          window.location.href = 'perfil.html';
        } else {
          alert(result.error);
        }
      } catch (error) {
        alert('Error al registrarse');
      }
    });
  }

  // For index.html modals (if they exist)
  const loginBtn = document.getElementById('hero-login-btn');
  const registerBtn = document.getElementById('hero-register-btn');
  const loginModal = document.getElementById('login-modal');
  const registerModal = document.getElementById('register-modal');
  const closeBtns = document.querySelectorAll('.close');
  const registerLink = document.getElementById('register-link');

  if (loginBtn && loginBtn.tagName === 'BUTTON') {
    loginBtn.addEventListener('click', () => {
      loginModal.style.display = 'block';
    });
  }

  if (registerBtn && registerBtn.tagName === 'BUTTON') {
    registerBtn.addEventListener('click', () => {
      registerModal.style.display = 'block';
    });
  }

  if (registerLink) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginModal.style.display = 'none';
      registerModal.style.display = 'block';
    });
  }

  if (closeBtns.length) {
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
      });
    });
  }

  window.addEventListener('click', (e) => {
    if (loginModal && e.target === loginModal) {
      loginModal.style.display = 'none';
    }
    if (registerModal && e.target === registerModal) {
      registerModal.style.display = 'none';
    }
  });

  checkLoginStatus();
}

async function checkLoginStatus() {
  try {
    const response = await fetch('/api/user');
    const result = await response.json();
    const loginBtn = document.getElementById('hero-login-btn');
    const registerBtn = document.getElementById('hero-register-btn');
    if (result.userId) {
      if (loginBtn) loginBtn.textContent = `Sesión: ${result.userId}`;
      if (registerBtn) registerBtn.style.display = 'none';
      if (loginBtn) loginBtn.addEventListener('click', logout);
    } else {
      if (loginBtn) loginBtn.textContent = 'Iniciar Sesión';
      if (registerBtn) registerBtn.style.display = 'inline-block';
    }
  } catch (error) {
    console.error('Error checking login status');
  }
}

function logout() {
  fetch('/api/logout', { method: 'POST' }).then(() => {
    checkLoginStatus();
  });
}
