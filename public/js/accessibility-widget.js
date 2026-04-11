(function () {
  let fontLevel = parseInt(localStorage.getItem('a11y_font') || '0', 10);
  let highContrast = localStorage.getItem('a11y_contrast') === '1';

  // ─── Build widget ─────────────────────────────────────────────

  const btn = document.createElement('button');
  btn.className = 'a11y-btn';
  btn.setAttribute('aria-label', 'פתח תפריט נגישות');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
    <polyline points="10,12 12,17 14,12"/>
  </svg>`;

  const panel = document.createElement('div');
  panel.className = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'אפשרויות נגישות');
  panel.innerHTML = `
    <span class="a11y-panel-title">נגישות</span>
    <div class="a11y-row">
      <span class="a11y-row-label">גודל טקסט</span>
      <div class="a11y-controls">
        <button class="a11y-control-btn" id="a11yFontDown" aria-label="הקטן טקסט">א-</button>
        <button class="a11y-control-btn" id="a11yFontReset" aria-label="אפס גודל טקסט">↺</button>
        <button class="a11y-control-btn" id="a11yFontUp" aria-label="הגדל טקסט">א+</button>
      </div>
    </div>
    <div class="a11y-row">
      <span class="a11y-row-label">ניגודיות גבוהה</span>
      <button class="a11y-toggle" id="a11yContrast" aria-label="ניגודיות גבוהה" aria-pressed="false"></button>
    </div>
    <hr class="a11y-divider" />
    <a href="/accessibility" class="a11y-link">הצהרת נגישות</a>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  // ─── Toggle panel ─────────────────────────────────────────────

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target)) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  panel.addEventListener('click', (e) => e.stopPropagation());

  // ─── Font size (zoom — works on all modern browsers) ──────────

  const ZOOM_STEPS = [0.85, 1, 1.15, 1.3];

  function applyFontSize() {
    const zoom = ZOOM_STEPS[fontLevel] ?? 1;
    document.body.style.zoom = zoom;
    localStorage.setItem('a11y_font', fontLevel);
  }

  document.getElementById('a11yFontUp').addEventListener('click', () => {
    if (fontLevel < ZOOM_STEPS.length - 1) { fontLevel++; applyFontSize(); }
  });

  document.getElementById('a11yFontDown').addEventListener('click', () => {
    if (fontLevel > 0) { fontLevel--; applyFontSize(); }
  });

  document.getElementById('a11yFontReset').addEventListener('click', () => {
    fontLevel = 1;
    applyFontSize();
  });

  // ─── High contrast ────────────────────────────────────────────

  const contrastToggle = document.getElementById('a11yContrast');

  function applyContrast() {
    document.body.classList.toggle('high-contrast', highContrast);
    contrastToggle.classList.toggle('on', highContrast);
    contrastToggle.setAttribute('aria-pressed', String(highContrast));
    localStorage.setItem('a11y_contrast', highContrast ? '1' : '0');
  }

  contrastToggle.addEventListener('click', () => {
    highContrast = !highContrast;
    applyContrast();
  });

  // ─── Restore saved preferences ────────────────────────────────

  if (fontLevel !== 0) applyFontSize();
  if (highContrast) applyContrast();
})();
