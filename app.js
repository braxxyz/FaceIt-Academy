const TEAM_STORAGE_KEY = "academycr_teams";
const PROFILE_STORAGE_KEY = "academycr_profiles";
const ACCOUNT_STORAGE_KEY = "academycr_accounts";
const SESSION_STORAGE_KEY = "academycr_session";
const LAST_LOGIN_STORAGE_KEY = "academycr_last_login";

function readStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function readObjectStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeObjectStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function writeAccounts(accounts) {
  writeStorage(ACCOUNT_STORAGE_KEY, accounts);
}

function readAccounts() {
  return readStorage(ACCOUNT_STORAGE_KEY);
}

function getCurrentUser() {
  try {
    const session = localStorage.getItem(SESSION_STORAGE_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
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
          (profile, index) => `
            <article class="saved-card profile-card" data-profile-index="${index}">
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
  attachProfileCardHandlers(container);
}

function attachProfileCardHandlers(container) {
  if (!container) return;
  container.querySelectorAll('[data-profile-index]').forEach((card) => {
    card.addEventListener('click', () => {
      const profileIndex = Number(card.dataset.profileIndex);
      openProfileModal(profileIndex);
    });
  });
}

function openProfileModal(index) {
  const profiles = readStorage(PROFILE_STORAGE_KEY);
  const profile = profiles[index];
  if (!profile) return;

  const modal = document.querySelector('.profile-modal');
  const content = modal.querySelector('.profile-modal-content');
  content.innerHTML = `
    <div class="profile-detail-header">
      ${
        profile.avatar
          ? `<img class="profile-detail-avatar" src="${profile.avatar}" alt="Avatar de ${escapeHtml(profile.nickname)}" />`
          : `<div class="profile-detail-avatar placeholder">${escapeHtml(profile.nickname.slice(0, 1) || "P")}</div>`
      }
      <div>
        <h2>${escapeHtml(profile.nickname || "Sin nickname")}</h2>
        <p>${escapeHtml(profile.role || "Jugador")}</p>
        <p class="profile-detail-subtitle">${escapeHtml(profile.name || "Sin nombre")}</p>
      </div>
    </div>
    <div class="profile-detail-body">
      <p><strong>Battletag:</strong> ${escapeHtml(profile.battletag || "No disponible")}</p>
      <p><strong>Equipo:</strong> ${escapeHtml(profile.team || "No disponible")}</p>
      <p><strong>Biografía:</strong></p>
      <p>${escapeHtml(profile.bio || "Sin biografía todavía.")}</p>
    </div>
  `;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function initProfileModal() {
  const modal = document.querySelector('.profile-modal');
  if (!modal) return;
  const close = modal.querySelector('.modal-close');
  const backdrop = modal.querySelector('.profile-modal-backdrop');

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  if (close) close.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
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

    const currentUser = getCurrentUser();
    const profiles = readStorage(PROFILE_STORAGE_KEY);
    profiles.push(profile);
    writeStorage(PROFILE_STORAGE_KEY, profiles);

    if (message) {
      message.textContent = currentUser
        ? `Perfil guardado localmente como ${currentUser.overwatchId}.`
        : "Perfil guardado localmente.";
    }

    renderProfiles(list);
    form.reset();
  });
}

const CALENDAR_STORAGE_KEY = "academycr_calendar_events";
const CALENDAR_WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function readCalendarEvents() {
  return readStorage(CALENDAR_STORAGE_KEY);
}

function writeCalendarEvents(events) {
  writeStorage(CALENDAR_STORAGE_KEY, events);
}

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

function formatDateLabel(date) {
  return date.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function initCalendar() {
  const container = document.getElementById("calendar-container");
  if (!container) return;

  container.innerHTML = `
    <div class="calendar-panel">
      <div class="calendar-header">
        <button type="button" id="calendar-prev" class="calendar-nav" aria-label="Mes anterior">&lt;</button>
        <div class="calendar-title" id="calendar-title"></div>
        <button type="button" id="calendar-next" class="calendar-nav" aria-label="Mes siguiente">&gt;</button>
      </div>
      <div class="calendar-grid" id="calendar-grid"></div>
      <div class="calendar-footer">
        <div class="calendar-day-info">
          <h3 id="calendar-selected-date"></h3>
          <div id="calendar-events"></div>
        </div>
        <form id="calendar-event-form" class="calendar-event-form">
          <label for="calendar-event-text">Agregar evento para esta fecha</label>
          <input id="calendar-event-text" type="text" placeholder="Ejemplo: Partido vs Golden Kings" required />
          <button type="submit" class="btn btn-primary">Guardar evento</button>
        </form>
      </div>
    </div>
  `;

  const state = {
    currentDate: new Date(),
    selectedDate: new Date(),
    events: readCalendarEvents(),
  };

  const title = document.getElementById("calendar-title");
  const calendarGrid = document.getElementById("calendar-grid");
  const selectedDateTitle = document.getElementById("calendar-selected-date");
  const eventsList = document.getElementById("calendar-events");
  const eventForm = document.getElementById("calendar-event-form");
  const eventInput = document.getElementById("calendar-event-text");

  const render = () => {
    renderCalendar(state, title, calendarGrid);
    renderCalendarDetails(state, selectedDateTitle, eventsList);
  };

  document.getElementById("calendar-prev")?.addEventListener("click", () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    render();
  });

  document.getElementById("calendar-next")?.addEventListener("click", () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    render();
  });

  eventForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = eventInput.value.trim();
    if (!text) return;

    const events = readCalendarEvents();
    events.push({
      date: formatDateKey(state.selectedDate),
      text,
    });

    writeCalendarEvents(events);
    state.events = events;
    eventInput.value = "";
    render();
  });

  render();
}

function renderCalendar(state, titleEl, gridEl) {
  if (!titleEl || !gridEl) return;

  const currentMonth = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1);
  titleEl.textContent = currentMonth.toLocaleDateString("es-CR", {
    month: "long",
    year: "numeric",
  });

  gridEl.innerHTML = "";

  CALENDAR_WEEKDAYS.forEach((weekday) => {
    const weekdayCell = document.createElement("div");
    weekdayCell.className = "calendar-weekday";
    weekdayCell.textContent = weekday;
    gridEl.appendChild(weekdayCell);
  });

  const firstDayIndex = currentMonth.getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  for (let index = 0; index < firstDayIndex; index += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day empty";
    gridEl.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = formatDateKey(dayDate);
    const dayEvents = state.events.filter((event) => event.date === dateKey);

    const dayButton = document.createElement("button");
    dayButton.type = "button";
    dayButton.className = "calendar-day";
    if (formatDateKey(state.selectedDate) === dateKey) {
      dayButton.classList.add("selected");
    }
    if (dayEvents.length) {
      dayButton.classList.add("has-events");
    }

    dayButton.innerHTML = `<span class="day-number">${day}</span>`;
    dayButton.addEventListener("click", () => {
      state.selectedDate = dayDate;
      render();
    });

    gridEl.appendChild(dayButton);
  }
}

function renderCalendarDetails(state, selectedDateEl, eventsContainer) {
  if (!selectedDateEl || !eventsContainer) return;

  selectedDateEl.textContent = formatDateLabel(state.selectedDate);
  const selectedKey = formatDateKey(state.selectedDate);
  const eventsForDay = state.events.filter((event) => event.date === selectedKey);

  if (!eventsForDay.length) {
    eventsContainer.innerHTML = `<p class="calendar-empty">No hay eventos programados para este día.</p>`;
    return;
  }

  eventsContainer.innerHTML = eventsForDay
    .map(
      (event) => `
        <div class="calendar-event">
          <span class="calendar-event-time"></span>
          <span>${escapeHtml(event.text)}</span>
        </div>
      `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  initTeamForm();
  initProfileForm();
  renderTeams(document.querySelector("[data-home-teams]"));
  initLogin();
  initCalendar();
  initHeaderMenu();
  initPasswordToggle();
  initProfileButton();
  initProfileModal();
});

function initHeaderMenu() {
  const menuButton = document.querySelector('.menu-button');
  const menuDropdown = document.querySelector('.menu-dropdown');
  if (!menuButton || !menuDropdown) return;

  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    menuDropdown.classList.toggle('open');
    menuDropdown.setAttribute('aria-hidden', menuDropdown.classList.contains('open') ? 'false' : 'true');
  });

  document.addEventListener('click', (event) => {
    if (!menuDropdown.contains(event.target) && !menuButton.contains(event.target)) {
      menuDropdown.classList.remove('open');
      menuDropdown.setAttribute('aria-hidden', 'true');
    }
  });
}

function initProfileButton() {
  const profileLink = document.querySelector('.profile-link');
  if (!profileLink) return;
  const currentUser = getCurrentUser();
  if (!currentUser) {
    profileLink.style.display = 'none';
    return;
  }

  profileLink.style.display = 'inline-flex';
  const avatar = profileLink.querySelector('.profile-avatar');
  if (avatar) {
    const label = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : (currentUser.overwatchId || 'P').charAt(0).toUpperCase();
    avatar.textContent = label;
    profileLink.setAttribute('title', `Ver perfil de ${currentUser.name || currentUser.overwatchId}`);
  }
}

function initPasswordToggle() {
  document.querySelectorAll('.password-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const fieldWrapper = button.closest('.password-field');
      if (!fieldWrapper) return;
      const input = fieldWrapper.querySelector('input');
      if (!input) return;
      const isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      button.textContent = isVisible ? 'Ver' : 'Ocultar';
      button.setAttribute('aria-label', isVisible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
  });
}


// Login functionality
function initLogin() {
  // For login.html page
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginSection && getCurrentUser()) {
    window.location.href = 'index.html';
    return;
  }

  const lastLogin = readObjectStorage(LAST_LOGIN_STORAGE_KEY);
  if (!getCurrentUser() && lastLogin) {
    const loginInput = document.querySelector('#login-form [name="overwatchId"]');
    const passwordInput = document.querySelector('#login-form [name="password"]');
    if (loginInput) loginInput.value = lastLogin.overwatchId || '';
    if (passwordInput) passwordInput.value = lastLogin.password || '';
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
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const overwatchId = String(formData.get('overwatchId') || '').trim();
      const password = String(formData.get('password') || '').trim();
      const accounts = readAccounts();
      const account = accounts.find((item) => item.overwatchId === overwatchId);

      if (!account || account.password !== password) {
        alert('Usuario/Tag de OW o contraseña incorrectos.');
        return;
      }

      setCurrentUser({
        name: account.name,
        email: account.email,
        overwatchId: account.overwatchId,
        loggedAt: Date.now()
      });
      writeObjectStorage(LAST_LOGIN_STORAGE_KEY, { overwatchId, password });
      alert('Inicio de sesión exitoso');
      window.location.href = 'index.html';
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const name = String(formData.get('name') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const overwatchId = String(formData.get('overwatchId') || '').trim();
      const password = String(formData.get('password') || '').trim();
      const accounts = readAccounts();

      if (!name || !email || !overwatchId || !password) {
        alert('Completa todos los campos para registrarte.');
        return;
      }

      if (accounts.some((item) => item.overwatchId === overwatchId)) {
        alert('Ya existe una cuenta con ese Tag de OW.');
        return;
      }

      const newAccount = {
        name,
        email,
        overwatchId,
        password,
        createdAt: Date.now()
      };

      accounts.push(newAccount);
      writeAccounts(accounts);
      writeObjectStorage(LAST_LOGIN_STORAGE_KEY, { overwatchId, password });
      setCurrentUser({ name, email, overwatchId, loggedAt: Date.now() });
      alert('Registro exitoso. Ya estás conectado.');
      window.location.href = 'index.html';
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
  const currentUser = getCurrentUser();
  const loginBtn = document.getElementById('hero-login-btn');
  const registerBtn = document.getElementById('hero-register-btn');

  if (currentUser) {
    if (loginBtn) {
      loginBtn.textContent = `Sesión: ${currentUser.name || currentUser.overwatchId}`;
      loginBtn.addEventListener('click', logout);
    }
    if (registerBtn) registerBtn.style.display = 'none';
  } else {
    if (loginBtn) loginBtn.textContent = 'Iniciar Sesión';
    if (registerBtn) registerBtn.style.display = 'inline-block';
  }
}

function logout() {
  clearCurrentUser();
  checkLoginStatus();
}
