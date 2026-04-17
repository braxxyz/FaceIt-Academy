const TEAM_STORAGE_KEY = "academycr_teams";
const PROFILE_STORAGE_KEY = "academycr_profiles";
const ACCOUNT_STORAGE_KEY = "academycr_accounts";
const SESSION_STORAGE_KEY = "academycr_session";
const LAST_LOGIN_STORAGE_KEY = "academycr_last_login";
const BACKUP_STORAGE_KEY = "academycr_backup";
const BACKUP_TIMESTAMP_KEY = "academycr_backup_timestamp";
const MESSAGES_STORAGE_KEY = "academycr_messages";
const CONVERSATIONS_STORAGE_KEY = "academycr_conversations";

function readStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    // Try to recover from backup
    return recoverFromBackup(key) || [];
  }
}

function readObjectStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    return recoverFromBackup(key) || null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Auto-backup after writing
    autoBackup();
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    alert('Error al guardar los datos. Revisa el espacio disponible en tu navegador.');
  }
}

function writeObjectStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Auto-backup after writing
    autoBackup();
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    alert('Error al guardar los datos. Revisa el espacio disponible en tu navegador.');
  }
}

function readAccounts() {
  return readStorage(ACCOUNT_STORAGE_KEY);
}

function writeAccounts(accounts) {
  writeStorage(ACCOUNT_STORAGE_KEY, accounts);
}

function autoBackup() {
  try {
    const backupData = {
      teams: readStorage(TEAM_STORAGE_KEY),
      profiles: readStorage(PROFILE_STORAGE_KEY),
      accounts: readStorage(ACCOUNT_STORAGE_KEY),
      session: readObjectStorage(SESSION_STORAGE_KEY),
      lastLogin: readObjectStorage(LAST_LOGIN_STORAGE_KEY),
      calendar: readStorage(CALENDAR_STORAGE_KEY),
      timestamp: Date.now()
    };
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backupData));
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, Date.now().toString());

    // Show notification (only if user is active)
    if (document.visibilityState === 'visible') {
      showBackupNotification();
    }
  } catch (error) {
    console.warn('Error creating auto-backup:', error);
  }
}

function showBackupNotification() {
  // Remove existing notification
  const existing = document.querySelector('.backup-notification');
  if (existing) existing.remove();

  // Create new notification
  const notification = document.createElement('div');
  notification.className = 'backup-notification';
  notification.innerHTML = `
    <div class="backup-notification-content">
      <span>💾 Datos respaldados automáticamente</span>
      <button class="backup-notification-close" aria-label="Cerrar">&times;</button>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);

  // Close button
  const closeBtn = notification.querySelector('.backup-notification-close');
  closeBtn.addEventListener('click', () => notification.remove());
}

function initPeriodicBackup() {
  // Backup every 5 minutes when page is visible
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      autoBackup();
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Backup when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      autoBackup();
    }
  });

  // Backup before page unload
  window.addEventListener('beforeunload', () => {
    autoBackup();
  });
}

function recoverFromBackup(key) {
  try {
    const backup = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!backup) return null;

    const backupData = JSON.parse(backup);
    const mapping = {
      [TEAM_STORAGE_KEY]: backupData.teams,
      [PROFILE_STORAGE_KEY]: backupData.profiles,
      [ACCOUNT_STORAGE_KEY]: backupData.accounts,
      [SESSION_STORAGE_KEY]: backupData.session,
      [LAST_LOGIN_STORAGE_KEY]: backupData.lastLogin
    };

    return mapping[key] || null;
  } catch (error) {
    console.warn('Error recovering from backup:', error);
    return null;
  }
}

function exportAllData() {
  const data = {
    teams: readStorage(TEAM_STORAGE_KEY),
    profiles: readStorage(PROFILE_STORAGE_KEY),
    accounts: readStorage(ACCOUNT_STORAGE_KEY),
    session: readObjectStorage(SESSION_STORAGE_KEY),
    lastLogin: readObjectStorage(LAST_LOGIN_STORAGE_KEY),
    calendar: readStorage(CALENDAR_STORAGE_KEY),
    exportedAt: new Date().toISOString(),
    version: "1.0"
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `academy-cr-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importAllData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (confirm('¿Estás seguro de importar estos datos? Esto reemplazará toda la información actual.')) {
          if (data.teams) writeStorage(TEAM_STORAGE_KEY, data.teams);
          if (data.profiles) writeStorage(PROFILE_STORAGE_KEY, data.profiles);
          if (data.accounts) writeStorage(ACCOUNT_STORAGE_KEY, data.accounts);
          if (data.session) writeObjectStorage(SESSION_STORAGE_KEY, data.session);
          if (data.lastLogin) writeObjectStorage(LAST_LOGIN_STORAGE_KEY, data.lastLogin);
          if (data.calendar) writeStorage(CALENDAR_STORAGE_KEY, data.calendar);

          alert('Datos importados correctamente. La página se recargará.');
          window.location.reload();
          resolve();
        }
      } catch (error) {
        alert('Error al importar los datos. Verifica que el archivo sea válido.');
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}

function clearAllData() {
  if (confirm('¿Estás seguro de borrar TODOS los datos? Esta acción no se puede deshacer.')) {
    localStorage.clear();
    alert('Todos los datos han sido borrados. La página se recargará.');
    window.location.reload();
  }
}

function getStorageInfo() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return {
    used: (total / 1024).toFixed(2) + ' KB',
    available: '5-10 MB (depende del navegador)',
    lastBackup: localStorage.getItem(BACKUP_TIMESTAMP_KEY)
      ? new Date(parseInt(localStorage.getItem(BACKUP_TIMESTAMP_KEY))).toLocaleString()
      : 'Nunca'
  };
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

  const currentUser = getCurrentUser();
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
          (team, index) => {
            const isCreator = currentUser && team.creatorId === currentUser.overwatchId;
            return `
            <article class="saved-card team-card" data-team-id="${team.id}">
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
                  .map((player) => `<span>${escapeHtml(player)}</span>`)
                  .join("")}
              </div>
              ${isCreator ? `<div class="team-actions"><button class="btn btn-sm btn-primary" data-edit-team-btn>✏️ Editar</button></div>` : ""}
            </article>
            `;
          }
        )
        .join("")}
    </div>
  `;
  attachTeamCardHandlers(container);
}

function attachTeamCardHandlers(container) {
  if (!container) return;
  container.querySelectorAll('[data-edit-team-btn]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.team-card');
      const teamId = card?.getAttribute('data-team-id');
      if (teamId) {
        openTeamEditModal(teamId);
      }
    });
  });
}

function renderProfiles(container) {
  if (!container) return;

  const currentUser = getCurrentUser();
  const allProfiles = readStorage(PROFILE_STORAGE_KEY);
  const profiles = currentUser ? allProfiles.filter(profile => profile.userId === currentUser.overwatchId) : allProfiles;

  if (!profiles.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No hay perfiles creados todavía</h3>
        <p>${currentUser ? 'Crea el primer perfil para guardar la información del jugador.' : 'Inicia sesión para crear perfiles.'}</p>
        ${currentUser ? '<a class="btn btn-primary" href="#profile-form">Crear perfil</a>' : '<a class="btn btn-primary" href="login.html">Iniciar sesión</a>'}
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
  const currentUser = getCurrentUser();
  const allProfiles = readStorage(PROFILE_STORAGE_KEY);
  const userProfiles = currentUser ? allProfiles.filter(profile => profile.userId === currentUser.overwatchId) : allProfiles;

  container.querySelectorAll('[data-profile-index]').forEach((card) => {
    card.addEventListener('click', () => {
      const profileIndex = Number(card.dataset.profileIndex);
      openProfileModal(userProfiles[profileIndex]);
    });
  });
}

function openProfileModal(profile) {
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

function openTeamEditModal(teamId) {
  const teams = readStorage(TEAM_STORAGE_KEY);
  const teamIndex = teams.findIndex(t => t.id === teamId);
  if (teamIndex === -1) return;

  const team = teams[teamIndex];
  const modal = document.querySelector('.team-edit-modal');
  
  if (!modal) return;

  const playersContainer = modal.querySelector('.team-players-container');

  // Crear lista de jugadores
  const playersHTML = (team.players || [])
    .map((player, idx) => `
      <div class="player-item" data-player-index="${idx}">
        <input type="text" value="${escapeHtml(player)}" class="player-input" />
        <button type="button" class="btn-sm btn-icon" data-move-up aria-label="Mover arriba" ${idx === 0 ? 'disabled' : ''}>⬆️</button>
        <button type="button" class="btn-sm btn-icon" data-move-down aria-label="Mover abajo" ${idx === team.players.length - 1 ? 'disabled' : ''}>⬇️</button>
        <button type="button" class="btn-sm btn-danger-sm" data-remove-player aria-label="Eliminar">✕</button>
      </div>
    `)
    .join('');

  playersContainer.innerHTML = playersHTML;

  // Agregar listeners a los botones de jugadores
  playersContainer.querySelectorAll('[data-move-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.player-item').dataset.playerIndex);
      if (idx > 0) {
        [team.players[idx], team.players[idx - 1]] = [team.players[idx - 1], team.players[idx]];
        openTeamEditModal(teamId);
      }
    });
  });

  playersContainer.querySelectorAll('[data-move-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.player-item').dataset.playerIndex);
      if (idx < team.players.length - 1) {
        [team.players[idx], team.players[idx + 1]] = [team.players[idx + 1], team.players[idx]];
        openTeamEditModal(teamId);
      }
    });
  });

  playersContainer.querySelectorAll('[data-remove-player]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.player-item').dataset.playerIndex);
      team.players.splice(idx, 1);
      openTeamEditModal(teamId);
    });
  });

  // Listener para agregar nuevo jugador
  const addPlayerBtn = modal.querySelector('[data-add-player-btn]');
  if (addPlayerBtn) {
    addPlayerBtn.addEventListener('click', () => {
      team.players.push('');
      openTeamEditModal(teamId);
    });
  }

  // Listener para guardar cambios
  const saveBtn = modal.querySelector('[data-save-team-btn]');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // Leer valores actualizados de los inputs
      playersContainer.querySelectorAll('.player-input').forEach((input, idx) => {
        team.players[idx] = input.value.trim();
      });
      team.players = team.players.filter(p => p.length > 0);

      teams[teamIndex] = team;
      writeStorage(TEAM_STORAGE_KEY, teams);
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      renderTeams(document.querySelector('[data-team-list]'));
      alert('Equipo actualizado correctamente');
    });
  }

  // Listener para cerrar
  const closeBtns = modal.querySelectorAll('[data-close-team-modal]');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
  });

  // Listener para cerrar con backdrop
  const backdrop = modal.querySelector('.team-edit-modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  // Listener para cerrar con Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function renderUserProfile() {
  const currentUser = getCurrentUser();
  const userInfoContainer = document.getElementById('user-info');

  if (!userInfoContainer) return;

  if (!currentUser) {
    userInfoContainer.innerHTML = `
      <div class="empty-state">
        <h3>No has iniciado sesión</h3>
        <p>Debes iniciar sesión para ver tu información de perfil.</p>
        <a class="btn btn-primary" href="login.html">Iniciar Sesión</a>
      </div>
    `;
    return;
  }

  userInfoContainer.innerHTML = `
    <div class="user-info-details">
      <div class="user-info-item">
        <strong>Nombre completo:</strong> ${escapeHtml(currentUser.name || "No especificado")}
      </div>
      <div class="user-info-item">
        <strong>Correo electrónico:</strong> ${escapeHtml(currentUser.email || "No especificado")}
      </div>
      <div class="user-info-item">
        <strong>Overwatch ID:</strong> ${escapeHtml(currentUser.overwatchId)}
      </div>
      <div class="user-info-item">
        <strong>Cuenta creada:</strong> ${new Date(currentUser.loggedAt || Date.now()).toLocaleDateString('es-CR')}
      </div>
    </div>
  `;
}

function renderUserProfiles() {
  const currentUser = getCurrentUser();
  const profilesContainer = document.getElementById('user-profiles');

  if (!profilesContainer) return;

  if (!currentUser) {
    profilesContainer.innerHTML = `
      <div class="empty-state">
        <h3>No has iniciado sesión</h3>
        <p>Inicia sesión para ver tus perfiles de jugador.</p>
      </div>
    `;
    return;
  }

  const allProfiles = readStorage(PROFILE_STORAGE_KEY);
  const userProfiles = allProfiles.filter(profile => profile.userId === currentUser.overwatchId);

  if (!userProfiles.length) {
    profilesContainer.innerHTML = `
      <div class="empty-state">
        <h3>No tienes perfiles creados</h3>
        <p>Crea tu primer perfil de jugador para mostrar tu información.</p>
        <a class="btn btn-primary" href="perfil.html">Crear Perfil</a>
      </div>
    `;
    return;
  }

  profilesContainer.innerHTML = `
    <div class="user-profiles-grid">
      ${userProfiles.map(profile => `
        <div class="user-profile-card">
          <div class="user-profile-header">
            ${profile.avatar
              ? `<img class="user-profile-avatar" src="${profile.avatar}" alt="Avatar de ${escapeHtml(profile.nickname)}" />`
              : `<div class="user-profile-avatar placeholder">${escapeHtml(profile.nickname.slice(0, 1) || "P")}</div>`
            }
            <div>
              <h3>${escapeHtml(profile.nickname)}</h3>
              <p class="user-profile-role">${escapeHtml(profile.role || "Jugador")}</p>
            </div>
          </div>
          <div class="user-profile-details">
            <p><strong>Nombre:</strong> ${escapeHtml(profile.name || "No especificado")}</p>
            <p><strong>Battletag:</strong> ${escapeHtml(profile.battletag || "No especificado")}</p>
            <p><strong>Equipo:</strong> ${escapeHtml(profile.team || "No especificado")}</p>
            <p><strong>Biografía:</strong> ${escapeHtml(profile.bio || "Sin biografía")}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function initSettingsPage() {
  // Export data button
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      try {
        exportAllData();
        alert('Datos exportados correctamente. Revisa tus descargas.');
      } catch (error) {
        alert('Error al exportar los datos: ' + error.message);
      }
    });
  }

  // Import data input
  const importInput = document.getElementById('import-data-input');
  if (importInput) {
    importInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          await importAllData(file);
        } catch (error) {
          alert('Error al importar los datos: ' + error.message);
        }
      }
      // Reset input
      event.target.value = '';
    });
  }

  // Clear data button
  const clearBtn = document.getElementById('clear-data-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllData);
  }

  // Display storage info
  const storageInfo = document.getElementById('storage-info');
  if (storageInfo) {
    const info = getStorageInfo();
    storageInfo.innerHTML = `
      <div class="storage-details">
        <p><strong>Espacio usado:</strong> ${info.used}</p>
        <p><strong>Espacio disponible:</strong> ${info.available}</p>
        <p><strong>Último respaldo automático:</strong> ${info.lastBackup}</p>
      </div>
    `;
  }

  // Display browser info
  const browserInfo = document.getElementById('browser-info');
  if (browserInfo) {
    const ua = navigator.userAgent;
    let browser = 'Desconocido';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    browserInfo.textContent = browser;
  }

  // Display localStorage support
  const storageSupport = document.getElementById('storage-support');
  if (storageSupport) {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      storageSupport.textContent = '✅ Soportado';
      storageSupport.style.color = 'var(--primary)';
    } catch {
      storageSupport.textContent = '❌ No soportado';
      storageSupport.style.color = 'var(--accent)';
    }
  }
}

function initTeamForm() {
  const form = document.querySelector("[data-team-form]");
  if (!form) return;

  const list = document.querySelector("[data-team-list]");
  const message = document.querySelector("[data-team-message]");

  renderTeams(list);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentUser = getCurrentUser();
    if (!currentUser) {
      if (message) message.textContent = "Debes iniciar sesión para crear un equipo.";
      return;
    }

    const formData = new FormData(form);
    const logoFile = form.querySelector('input[type="file"]')?.files?.[0];
    const logo = await fileToDataUrl(logoFile);

    const team = {
      id: Date.now().toString(),
      name: String(formData.get("team-name") || "").trim(),
      description: String(formData.get("team-description") || "").trim(),
      players: [
        formData.get("player-1"),
        formData.get("player-2"),
        formData.get("player-3"),
        formData.get("player-4"),
        formData.get("player-5"),
        formData.get("player-6"),
      ].map((value) => String(value || "").trim()).filter(Boolean),
      logo,
      creatorId: currentUser.overwatchId,
      createdAt: Date.now()
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

    const currentUser = getCurrentUser();
    if (!currentUser) {
      if (message) message.textContent = "Debes iniciar sesión para crear un perfil.";
      return;
    }

    const formData = new FormData(form);
    const avatarFile = form.querySelector('input[type="file"]')?.files?.[0];
    const avatar = await fileToDataUrl(avatarFile);

    const profile = {
      userId: currentUser.overwatchId,
      nickname: String(formData.get("nickname") || "").trim(),
      name: String(formData.get("name") || "").trim(),
      role: String(formData.get("role") || "").trim(),
      battletag: String(formData.get("battletag") || "").trim(),
      team: String(formData.get("team") || "").trim(),
      bio: String(formData.get("bio") || "").trim(),
      avatar,
      createdAt: Date.now()
    };

    if (!profile.nickname) {
      if (message) message.textContent = "Escribe un nickname antes de guardar.";
      return;
    }

    const profiles = readStorage(PROFILE_STORAGE_KEY);
    profiles.push(profile);
    writeStorage(PROFILE_STORAGE_KEY, profiles);

    if (message) {
      message.textContent = `Perfil guardado para ${currentUser.name || currentUser.overwatchId}.`;
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
  initUserProfilePage();
  initSettingsPage();
  initPeriodicBackup();
});

function initHeaderMenu() {
  const menuButton = document.querySelector('.menu-button');
  const menuDropdown = document.querySelector('.menu-dropdown');
  if (!menuButton || !menuDropdown) return;

  // Mostrar menú al pasar el mouse
  menuButton.addEventListener('mouseenter', () => {
    menuDropdown.classList.add('open');
    menuDropdown.setAttribute('aria-hidden', 'false');
  });

  // Ocultar menú al salir del botón
  menuButton.addEventListener('mouseleave', () => {
    menuDropdown.classList.remove('open');
    menuDropdown.setAttribute('aria-hidden', 'true');
  });

  // Mantener menú abierto mientras está sobre el dropdown
  menuDropdown.addEventListener('mouseenter', () => {
    menuDropdown.classList.add('open');
    menuDropdown.setAttribute('aria-hidden', 'false');
  });

  // Ocultar al salir del dropdown
  menuDropdown.addEventListener('mouseleave', () => {
    menuDropdown.classList.remove('open');
    menuDropdown.setAttribute('aria-hidden', 'true');
  });

  // Click también funciona como respaldo
  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    menuDropdown.classList.toggle('open');
    menuDropdown.setAttribute('aria-hidden', menuDropdown.classList.contains('open') ? 'false' : 'true');
  });

  // Cerrar si se hace click en otro lugar
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

// ===== Chat System =====

function createConversation(type, data) {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const conversation = {
    id: Date.now().toString(),
    type, // 'direct', 'team', 'recruitment', 'scrims'
    createdBy: currentUser.overwatchId,
    createdAt: Date.now(),
    title: data.title || 'Conversación',
    participants: data.participants || [currentUser.overwatchId],
    metadata: data.metadata || {}
  };

  const conversations = readStorage(CONVERSATIONS_STORAGE_KEY);
  conversations.push(conversation);
  writeStorage(CONVERSATIONS_STORAGE_KEY, conversations);

  return conversation;
}

function sendMessage(conversationId, text) {
  const currentUser = getCurrentUser();
  if (!currentUser || !text.trim()) return null;

  const message = {
    id: Date.now().toString(),
    conversationId,
    senderId: currentUser.overwatchId,
    senderName: currentUser.name || currentUser.overwatchId,
    text: text.trim(),
    timestamp: Date.now()
  };

  const messages = readStorage(MESSAGES_STORAGE_KEY);
  messages.push(message);
  writeStorage(MESSAGES_STORAGE_KEY, messages);

  // Update conversation last activity
  const conversations = readStorage(CONVERSATIONS_STORAGE_KEY);
  const convIndex = conversations.findIndex(c => c.id === conversationId);
  if (convIndex !== -1) {
    conversations[convIndex].lastMessage = text.trim();
    conversations[convIndex].lastMessageTime = Date.now();
    writeStorage(CONVERSATIONS_STORAGE_KEY, conversations);
  }

  return message;
}

function getConversationMessages(conversationId) {
  const messages = readStorage(MESSAGES_STORAGE_KEY);
  return messages.filter(m => m.conversationId === conversationId).sort((a, b) => a.timestamp - b.timestamp);
}

function getUserConversations(filter = 'all') {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const conversations = readStorage(CONVERSATIONS_STORAGE_KEY);
  return conversations.filter(c => {
    const isParticipant = c.participants.includes(currentUser.overwatchId);
    if (!isParticipant) return false;

    if (filter === 'all') return true;
    return c.type === filter;
  }).sort((a, b) => (b.lastMessageTime || b.createdAt) - (a.lastMessageTime || a.createdAt));
}

function renderChatList(filter = 'direct') {
  const chatList = document.getElementById('chat-list');
  if (!chatList) return;

  const conversations = getUserConversations(filter);

  if (!conversations.length) {
    chatList.innerHTML = `
      <div class="chat-empty-state">
        <p>No hay ${filter === 'direct' ? 'mensajes directos' : 'conversaciones de ' + filter}</p>
      </div>
    `;
    return;
  }

  chatList.innerHTML = conversations.map(conv => `
    <div class="chat-item" data-conv-id="${conv.id}">
      <div class="chat-item-header">
        <h4>${escapeHtml(conv.title)}</h4>
        <span class="chat-time">${new Date(conv.lastMessageTime || conv.createdAt).toLocaleDateString('es-CR')}</span>
      </div>
      <p class="chat-preview">${escapeHtml((conv.lastMessage || 'Sin mensajes aún').substring(0, 50))}...</p>
    </div>
  `).join('');

  // Add click handlers
  chatList.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => {
      const convId = item.getAttribute('data-conv-id');
      renderChat(convId);
    });
  });
}

function renderChat(conversationId) {
  const chatContainer = document.getElementById('chat-container');
  if (!chatContainer) return;

  const conversations = readStorage(CONVERSATIONS_STORAGE_KEY);
  const conversation = conversations.find(c => c.id === conversationId);
  if (!conversation) return;

  const messages = getConversationMessages(conversationId);
  const currentUser = getCurrentUser();

  chatContainer.innerHTML = `
    <div class="chat-header">
      <h3>${escapeHtml(conversation.title)}</h3>
      <p class="chat-type">${conversation.type === 'direct' ? '💬' : conversation.type === 'recruitment' ? '👥' : conversation.type === 'scrims' ? '🎮' : '📌'}</p>
    </div>

    <div class="chat-messages">
      ${messages.map(msg => `
        <div class="chat-message ${msg.senderId === currentUser?.overwatchId ? 'own' : 'other'}">
          <div class="chat-message-content">
            <strong>${escapeHtml(msg.senderName)}</strong>
            <p>${escapeHtml(msg.text)}</p>
            <span class="chat-message-time">${new Date(msg.timestamp).toLocaleTimeString('es-CR')}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <form class="chat-input-form" data-chat-form="${conversationId}">
      <input type="text" class="chat-input" placeholder="Escribe tu mensaje..." autocomplete="off" />
      <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem;">Enviar</button>
    </form>
  `;

  // Auto scroll to bottom
  const messagesDiv = chatContainer.querySelector('.chat-messages');
  if (messagesDiv) {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Add form handler
  const form = chatContainer.querySelector('[data-chat-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('.chat-input');
      const text = input.value;
      if (text.trim()) {
        sendMessage(conversationId, text);
        input.value = '';
        renderChat(conversationId);
      }
    });
  }
}

function initChat() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.innerHTML = `
        <div class="chat-login-required">
          <h2>Inicia sesión para acceder al chat</h2>
          <p>Necesitas estar logueado para enviar y recibir mensajes.</p>
          <a class="btn btn-primary" href="login.html">Ir a Login</a>
        </div>
      `;
    }
    return;
  }

  // Initialize chat tabs
  const tabs = document.querySelectorAll('.chat-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-tab');
      renderChatList(filter);
    });
  });

  // Initialize new chat modal
  const newChatBtn = document.getElementById('new-chat-btn');
  const newChatModal = document.querySelector('.new-chat-modal');
  if (newChatBtn && newChatModal) {
    newChatBtn.addEventListener('click', () => {
      newChatModal.classList.add('open');
      newChatModal.setAttribute('aria-hidden', 'false');
    });

    // Type buttons
    const typeButtons = newChatModal.querySelectorAll('.new-chat-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.getAttribute('data-type');
        
        newChatModal.querySelectorAll('.new-chat-form').forEach(form => {
          form.style.display = 'none';
        });
        const form = newChatModal.querySelector(`#${type}-form`);
        if (form) form.style.display = 'block';
      });
    });

    // Close buttons
    const closeButtons = newChatModal.querySelectorAll('[data-close-new-chat]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        newChatModal.classList.remove('open');
        newChatModal.setAttribute('aria-hidden', 'true');
      });
    });

    // Create direct message
    const userSearch = document.getElementById('user-search');
    const userResults = document.getElementById('user-results');
    if (userSearch) {
      userSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const accounts = readAccounts();
        const filtered = accounts.filter(acc => 
          acc.overwatchId.toLowerCase().includes(query) ||
          (acc.name && acc.name.toLowerCase().includes(query))
        );

        userResults.innerHTML = filtered.map(user => `
          <div class="search-result-item" data-user="${user.overwatchId}">
            <strong>${escapeHtml(user.name || user.overwatchId)}</strong>
            <small>${escapeHtml(user.overwatchId)}</small>
          </div>
        `).join('');

        userResults.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const userId = item.getAttribute('data-user');
            const conv = createConversation('direct', {
              title: `Chat con ${userId}`,
              participants: [currentUser.overwatchId, userId]
            });
            if (conv) {
              newChatModal.classList.remove('open');
              newChatModal.setAttribute('aria-hidden', 'true');
              userSearch.value = '';
              renderChatList('direct');
              renderChat(conv.id);
            }
          });
        });
      });
    }

    // Create recruitment
    const createRecruitmentBtn = newChatModal.querySelector('[data-create-recruitment]');
    if (createRecruitmentBtn) {
      createRecruitmentBtn.addEventListener('click', () => {
        const title = document.getElementById('recruitment-title').value;
        const message = document.getElementById('recruitment-message').value;
        if (title && message) {
          const conv = createConversation('recruitment', {
            title,
            participants: [currentUser.overwatchId],
            metadata: { initialMessage: message }
          });
          if (conv) {
            sendMessage(conv.id, message);
            newChatModal.classList.remove('open');
            newChatModal.setAttribute('aria-hidden', 'true');
            document.getElementById('recruitment-title').value = '';
            document.getElementById('recruitment-message').value = '';
            renderChatList('recruitment');
            renderChat(conv.id);
          }
        }
      });
    }

    // Create scrims
    const createScrimsBtn = newChatModal.querySelector('[data-create-scrims]');
    if (createScrimsBtn) {
      createScrimsBtn.addEventListener('click', () => {
        const team = document.getElementById('scrims-team').value;
        const message = document.getElementById('scrims-message').value;
        if (team && message) {
          const conv = createConversation('scrims', {
            title: `Scrims con ${team}`,
            participants: [currentUser.overwatchId],
            metadata: { targetTeam: team }
          });
          if (conv) {
            sendMessage(conv.id, message);
            newChatModal.classList.remove('open');
            newChatModal.setAttribute('aria-hidden', 'true');
            document.getElementById('scrims-team').value = '';
            document.getElementById('scrims-message').value = '';
            renderChatList('scrims');
            renderChat(conv.id);
          }
        }
      });
    }
  }

  // Initial render
  renderChatList('direct');
}
