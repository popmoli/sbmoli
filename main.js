/* ============================================================
   main.js — Photography Portfolio
   Renders all sections from data/projects.json
   ============================================================ */

async function init() {
  const res = await fetch('./data/projects.json');
  const projects = await res.json();

  renderNav(projects);
  renderHero(projects);
  renderProjects(projects);
  renderAbout();
  renderContact();
  renderFooter();
  initLightbox(projects);
}

/* ── Navigation ─────────────────────────────────────────────── */

function renderNav(projects) {
  const nav = document.getElementById('nav');
  const projectLinks = projects.map(p =>
    `<li><a href="#project-${p.id}">${p.title}</a></li>`
  ).join('');
  nav.innerHTML = `
    <span class="nav-brand">&#128247; Your Name</span>
    <ul>
      ${projectLinks}
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>`;
}

/* ── Hero ───────────────────────────────────────────────────── */

function renderHero(projects) {
  document.getElementById('hero').innerHTML = `
    <div class="hero-content">
      <h1>Your Name</h1>
      <p class="hero-tagline">Photographer &amp; Visual Storyteller</p>
      <a href="#project-${projects[0].id}" class="hero-cta">[ View Work ]</a>
    </div>`;
}

/* ── Projects ───────────────────────────────────────────────── */

function renderProjects(projects) {
  const container = document.getElementById('projects');
  container.innerHTML = projects.map(project => `
    <section class="project-section" id="project-${project.id}">
      <div class="w95-window">
        <div class="w95-titlebar">
          <span class="w95-titlebar-title">&#128444; ${project.title}</span>
          <div class="w95-titlebar-controls">
            <button class="w95-btn" aria-label="Minimize" tabindex="-1">_</button>
            <button class="w95-btn" aria-label="Maximize" tabindex="-1">&#9633;</button>
            <button class="w95-btn" aria-label="Close" tabindex="-1">&#x2715;</button>
          </div>
        </div>
        <div class="w95-window-body">
          <p class="project-description">${project.description}</p>
          <div class="gallery-grid">
            ${project.photos.map((photo, i) => `
              <figure
                class="gallery-item"
                data-project="${project.id}"
                data-index="${i}"
                data-caption="${escapeAttr(photo.caption)}"
                data-spotify="${photo.spotifyId}"
                tabindex="0"
                role="button"
                aria-label="Open photo: ${escapeAttr(photo.alt)}"
              >
                <img
                  src="images/${photo.file}"
                  alt="${escapeAttr(photo.alt)}"
                  loading="lazy"
                  onerror="this.parentElement.classList.add('gallery-item-placeholder'); this.style.display='none'; this.parentElement.innerHTML += '<span>${escapeAttr(photo.alt)}</span>';"
                />
              </figure>
            `).join('')}
          </div>
        </div>
        <div class="w95-statusbar">
          <span class="w95-statusbar-pane">${project.photos.length} object(s)</span>
          <span class="w95-statusbar-pane">${project.id}</span>
        </div>
      </div>
    </section>
  `).join('');
}

/* ── About ──────────────────────────────────────────────────── */

function renderAbout() {
  document.getElementById('about').innerHTML = `
    <div class="w95-window">
      <div class="w95-titlebar">
        <span class="w95-titlebar-title">&#128100; About</span>
        <div class="w95-titlebar-controls">
          <button class="w95-btn" tabindex="-1">_</button>
          <button class="w95-btn" tabindex="-1">&#9633;</button>
        </div>
      </div>
      <div class="w95-window-body about-body">
        <div class="about-portrait" aria-hidden="true"></div>
        <div class="about-text">
          <p>Write a short bio here — who you are, where you're based, what draws you to photography. Keep it personal and concise.</p>
          <p class="about-secondary">Available for editorial, portrait, and landscape commissions.</p>
        </div>
      </div>
    </div>`;
}

/* ── Contact ────────────────────────────────────────────────── */

function renderContact() {
  document.getElementById('contact').innerHTML = `
    <div class="w95-window">
      <div class="w95-titlebar">
        <span class="w95-titlebar-title">&#128140; Contact</span>
      </div>
      <div class="w95-window-body contact-body">
        <p>Available for commissions and collaborations.</p>
        <a href="mailto:you@example.com" class="contact-email">you@example.com</a>
        <div class="social-links">
          <a href="https://instagram.com/" target="_blank" rel="noopener">Instagram</a>
          <a href="https://linkedin.com/" target="_blank" rel="noopener">LinkedIn</a>
        </div>
      </div>
    </div>`;
}

/* ── Footer ─────────────────────────────────────────────────── */

function renderFooter() {
  document.getElementById('footer').innerHTML = `
    <div class="footer-bar w95-statusbar">
      <span class="w95-statusbar-pane">&copy; 2026 Your Name</span>
      <span class="w95-statusbar-pane">Photography Portfolio v1.0</span>
      <span class="w95-statusbar-pane">Ready</span>
    </div>`;
}

/* ── Lightbox ───────────────────────────────────────────────── */

function initLightbox(projects) {
  // Build flat index of all photos across all projects
  const allItems = [];
  projects.forEach(project => {
    project.photos.forEach((photo, localIndex) => {
      allItems.push({ photo, project, localIndex });
    });
  });

  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbSpotify = document.getElementById('lb-spotify');
  const lbStatus  = document.getElementById('lb-status');
  const lbTitle   = document.querySelector('.lb-title-text');
  let current = 0;

  function openAt(globalIndex) {
    current = globalIndex;
    const { photo, project, localIndex } = allItems[current];

    lbImg.src = `images/${photo.file}`;
    lbImg.alt = photo.alt;
    lbCaption.textContent = photo.caption || '';
    lbTitle.textContent = `${project.title} \u2014 ${photo.alt}`;
    lbStatus.textContent = `${localIndex + 1} / ${project.photos.length}  \u2502  ${project.title}`;

    // Only update Spotify src if the track changed (avoids reload mid-play)
    const newSrc = `https://open.spotify.com/embed/track/${photo.spotifyId}?utm_source=generator&theme=0`;
    if (lbSpotify.src !== newSrc) lbSpotify.src = newSrc;

    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbSpotify.src = ''; // stop playback
  }

  function prev() { openAt((current - 1 + allItems.length) % allItems.length); }
  function next() { openAt((current + 1) % allItems.length); }

  // Click on gallery item (event delegation)
  document.getElementById('projects').addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    const projectId = item.dataset.project;
    const localIndex = parseInt(item.dataset.index, 10);
    const globalIndex = allItems.findIndex(
      x => x.project.id === projectId && x.localIndex === localIndex
    );
    if (globalIndex >= 0) openAt(globalIndex);
  });

  // Keyboard activation on gallery items
  document.getElementById('projects').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.gallery-item');
      if (item) { e.preventDefault(); item.click(); }
    }
  });

  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-prev').addEventListener('click', prev);
  document.getElementById('lb-next').addEventListener('click', next);

  // Click backdrop to close
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });

  // Keyboard nav
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });
}

/* ── Utilities ──────────────────────────────────────────────── */

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ── Bootstrap ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', init);
