/* ============================================================
   main.js — Photography Portfolio (Bold + Wonky Win95)
   ============================================================ */

import { initCornerGif } from './corner-gif.js';

const ACCENTS = ['#FF2D78', '#FFE600', '#00E5FF', '#B4FF3C', '#FF6B00'];

async function init() {
  const res = await fetch('./data/projects.json');
  const projects = await res.json();

  renderNav(projects);
  renderProjects(projects);
  renderAbout();
  renderContact();
  renderFooter();
  initLightbox(projects);
  initCornerGif();
}

/* ── Navigation ─────────────────────────────────────────────── */

function renderNav(projects) {
  const nav = document.getElementById('nav');
  const projectLinks = projects.map(p =>
    `<li><a href="#project-${p.id}">${p.title}</a></li>`
  ).join('');
  nav.innerHTML = `
    <span class="nav-brand">Your Name</span>
    <ul>
      ${projectLinks}
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>`;
}

/* ── Projects ───────────────────────────────────────────────── */

function renderProjects(projects) {
  const container = document.getElementById('projects');
  container.innerHTML = projects.map((project, pi) => {
    const accent = ACCENTS[pi % ACCENTS.length];
    const index  = String(pi + 1).padStart(2, '0');
    return `
    <section class="project-section" id="project-${project.id}" style="--project-accent:${accent}">
      <span class="project-index" aria-hidden="true">${index}</span>
      <div class="project-header">
        <span class="project-label">${project.title}</span>
        <span class="project-counter">${index} / ${String(projects.length).padStart(2,'0')} &mdash; ${project.photos.length} frames</span>
      </div>
      <div class="w95-window" style="--window-accent:${accent}66">
        <div class="w95-titlebar">
          <span class="w95-titlebar-title">&#128444;&nbsp;${project.title}.exe</span>
          <div class="w95-titlebar-controls">
            <button class="w95-btn" aria-label="Minimize" tabindex="-1">_</button>
            <button class="w95-btn" aria-label="Maximize" tabindex="-1">&#9633;</button>
            <button class="w95-btn" aria-label="Close" tabindex="-1" style="color:${accent}">&#x2715;</button>
          </div>
        </div>
        <div class="w95-window-body">
<div class="gallery-grid">
            ${project.photos.map((photo, i) => `
              <figure
                class="gallery-item"
                data-project="${project.id}"
                data-index="${i}"
                data-caption="${escapeAttr(photo.caption)}"
                tabindex="0"
                role="button"
                aria-label="Open: ${escapeAttr(photo.alt)}"
              >
                <img
                  src="images/thumbs/${photo.file}"
                  alt="${escapeAttr(photo.alt)}"
                  loading="lazy"
                  onerror="this.parentElement.classList.add('gallery-item-placeholder'); this.style.display='none'; this.parentElement.dataset.label='${escapeAttr(photo.alt)}';"
                />
              </figure>
            `).join('')}
          </div>
        </div>
        <div class="w95-statusbar">
          <span class="w95-statusbar-pane">${project.photos.length} object(s)</span>
          <span class="w95-statusbar-pane" style="color:${accent}">${project.id}</span>
          <span class="w95-statusbar-pane">Ready</span>
        </div>
      </div>
    </section>`;
  }).join('');
}

/* ── About ──────────────────────────────────────────────────── */

function renderAbout() {
  document.getElementById('about').innerHTML = `
    <div class="w95-window" style="--window-accent:#444466; --tilt:0deg">
      <div class="w95-titlebar">
        <span class="w95-titlebar-title">&#128100;&nbsp;About.txt</span>
        <div class="w95-titlebar-controls">
          <button class="w95-btn" tabindex="-1">_</button>
          <button class="w95-btn" tabindex="-1">&#9633;</button>
        </div>
      </div>
      <div class="w95-window-body about-body">
        <img class="about-portrait" src="images/about.jpg" alt="Portrait">
        <div class="about-text">
          <p>Based in Paris. This site is a record of an ongoing interest in computational structures and simulated worlds, where everything seems real until it isn't.</p>
          <p class="about-secondary">Available for editorial, portrait, and new ideas.</p>
        </div>
      </div>
    </div>`;
}

/* ── Contact ────────────────────────────────────────────────── */

function renderContact() {
  document.getElementById('contact').innerHTML = `
    <div class="w95-window" style="--window-accent:#444466">
      <div class="w95-titlebar">
        <span class="w95-titlebar-title">&#128140;&nbsp;Contact.exe</span>
      </div>
      <div class="w95-window-body contact-body">
        <p>// Available for commissions and collaborations</p>
        <a href="https://instagram.com/_shotbymoli" class="contact-email" target="_blank" rel="noopener">@_shotbymoli</a>
        <div class="social-links">
          <a href="https://instagram.com/_shotbymoli" target="_blank" rel="noopener">Instagram</a>
        </div>
      </div>
    </div>`;
}

/* ── Footer ─────────────────────────────────────────────────── */

function renderFooter() {
  document.getElementById('footer').innerHTML = `
    <div class="footer-bar w95-statusbar">
      <span class="w95-statusbar-pane">&copy; 2026 Your Name</span>
      <span class="w95-statusbar-pane">Photography Portfolio v2.0</span>
      <span class="w95-statusbar-pane" id="footer-status">Ready</span>
    </div>`;
}

/* ── Lightbox ───────────────────────────────────────────────── */

function initLightbox(projects) {
  const allItems = [];
  projects.forEach(project => {
    project.photos.forEach((photo, localIndex) => {
      allItems.push({ photo, project, localIndex });
    });
  });

  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbStatus  = document.getElementById('lb-status');
  const lbTitle   = document.querySelector('.lb-title-text');
  let current = 0;

  function openAt(globalIndex) {
    current = globalIndex;
    const { photo, project, localIndex } = allItems[current];
    const accent = ACCENTS[projects.indexOf(project) % ACCENTS.length];

    lbImg.src = `images/${photo.file}`;
    lbImg.alt = photo.alt;
    lbCaption.textContent = photo.caption || '';
    lbTitle.textContent = `${project.title} \u2014 ${photo.alt}`;
    lbStatus.textContent = `${localIndex + 1} / ${project.photos.length}  |  ${project.title}`;

    // Tint title bar to project accent
    document.querySelector('.lb-titlebar').style.setProperty('--window-accent', accent + '99');

    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function prev() { openAt((current - 1 + allItems.length) % allItems.length); }
  function next() { openAt((current + 1) % allItems.length); }

  document.getElementById('projects').addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    const globalIndex = allItems.findIndex(
      x => x.project.id === item.dataset.project && x.localIndex === parseInt(item.dataset.index, 10)
    );
    if (globalIndex >= 0) openAt(globalIndex);
  });

  document.getElementById('projects').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.gallery-item');
      if (item) { e.preventDefault(); item.click(); }
    }
  });

  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-prev').addEventListener('click', prev);
  document.getElementById('lb-next').addEventListener('click', next);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });

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
