let chapters = [];
let currentUser = null;
let activeChapterId = null;
let activeVideoChapterId = null;
let openMobileId = null;

// ─── Progress (localStorage per user+chapter) ────────────────

function progressKey(chapterId) {
  return `vp_${currentUser?.phone}_${chapterId}`;
}

function saveProgress(chapterId, seconds) {
  if (!currentUser || seconds < 3) return;
  localStorage.setItem(progressKey(chapterId), Math.floor(seconds));
}

function getProgress(chapterId) {
  if (!currentUser) return 0;
  return parseInt(localStorage.getItem(progressKey(chapterId)) || '0', 10);
}

// ─── Bunny player → parent postMessage listener ──────────────

window.addEventListener('message', (e) => {
  if (!activeVideoChapterId) return;
  try {
    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    if (data?.event === 'timeupdate') {
      const seconds = data.seconds ?? data.currentTime ?? 0;
      saveProgress(activeVideoChapterId, seconds);
    }
  } catch (_) {}
});

// ─── Init ────────────────────────────────────────────────────

(async function init() {
  const meRes = await fetch('/api/auth/me');
  if (!meRes.ok) { window.location.href = '/'; return; }

  currentUser = await meRes.json();
  document.getElementById('headerUsername').textContent = currentUser.name || '';

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  const chaptersRes = await fetch('/api/chapters');
  if (!chaptersRes.ok) { renderError(); return; }

  chapters = await chaptersRes.json();
  renderDesktop(chapters);
  renderMobile(chapters);
})();

// ─── Desktop ─────────────────────────────────────────────────

const SIDEBAR_SECTIONS = [
  { label: 'יסודות וכלים', range: [1, 4] },
  { label: 'ניתוח ויישום', range: [5, 8] },
];

function renderDesktop(chapters) {
  const sidebarList = document.getElementById('sidebarList');
  sidebarList.innerHTML = '';

  SIDEBAR_SECTIONS.forEach(({ label, range: [from, to] }) => {
    const sectionChapters = chapters.filter((ch) => ch.number >= from && ch.number <= to);
    if (!sectionChapters.length) return;

    const header = document.createElement('div');
    header.className = 'sidebar-section-label';
    header.textContent = label;
    sidebarList.appendChild(header);

    sectionChapters.forEach((chapter) => sidebarList.appendChild(buildSidebarItem(chapter)));
  });

  const sidebar = document.getElementById('chaptersSidebar');
  if (!sidebar.querySelector('.sidebar-octopus')) {
    const octopus = document.createElement('div');
    octopus.className = 'sidebar-octopus';
    sidebar.appendChild(octopus);
  }

  if (chapters.length > 0) openDesktopChapter(chapters[0]);
}

function buildSidebarItem(chapter) {
  const item = document.createElement('div');
  item.className = 'sidebar-item';
  item.dataset.id = chapter.id;

  item.innerHTML = `
    <span class="sidebar-num">${chapter.number}</span>
    <span class="sidebar-name">${escHtml(chapter.shortName)}</span>
    <span class="sidebar-check ${chapter.viewed ? 'visible' : ''}" data-check="${chapter.id}">
      ${checkIcon()}
    </span>
  `;

  item.addEventListener('click', () => openDesktopChapter(chapter, true));
  return item;
}

function openDesktopChapter(chapter, userInitiated = false) {
  if (activeChapterId === chapter.id) return;
  activeChapterId = chapter.id;
  activeVideoChapterId = chapter.id;

  document.querySelectorAll('.sidebar-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.id === chapter.id);
  });

  renderMainPanel(chapter);
  if (userInitiated) recordView(chapter);
}

function renderMainPanel(chapter) {
  const panel = document.getElementById('chapterMainPanel');

  panel.innerHTML = `
    <div style="animation: panelFadeIn 0.3s ease both;">
      <div class="panel-chapter-header">
        <div class="panel-chapter-num">${chapter.number}</div>
        <div class="panel-chapter-titles">
          <h2>${escHtml(chapter.fullName)}</h2>
          <p>${escHtml(chapter.shortName)}</p>
        </div>
      </div>
      ${chapter.videoUrl ? videoEmbed(chapter.videoUrl, chapter.id) : ''}
      <p class="chapter-description">${escHtml(chapter.description)}</p>
      ${buildAttachments(chapter.attachments)}
    </div>
  `;

  panel.scrollTop = 0;
}

// ─── Mobile ──────────────────────────────────────────────────

function renderMobile(chapters) {
  const list = document.getElementById('chaptersList');
  list.innerHTML = '';

  chapters.forEach((chapter, index) => {
    const card = buildMobileCard(chapter);
    card.style.animationDelay = `${index * 80}ms`;
    list.appendChild(card);
  });
}

function buildMobileCard(chapter) {
  const card = document.createElement('div');
  card.className = 'chapter-card';
  card.dataset.id = chapter.id;

  card.innerHTML = `
    <div class="chapter-header">
      <div class="chapter-number">${chapter.number}</div>
      <div class="chapter-titles">
        <div class="chapter-short-name">${escHtml(chapter.shortName)}</div>
        <div class="chapter-full-name">${escHtml(chapter.fullName)}</div>
      </div>
      <div class="chapter-status">
        ${chapter.viewed
          ? viewedBadge()
          : `<span class="viewed-badge" data-mobile-badge="${chapter.id}" style="display:none">${viewedBadge()}</span>`
        }
        ${arrowIcon()}
      </div>
    </div>
    <div class="chapter-body">
      <div class="chapter-body-inner">
        ${chapter.videoUrl ? videoEmbed(chapter.videoUrl, chapter.id) : ''}
        <p class="chapter-description" style="padding-top:16px">${escHtml(chapter.description)}</p>
        ${buildAttachments(chapter.attachments)}
      </div>
    </div>
  `;

  card.querySelector('.chapter-header').addEventListener('click', () => toggleMobileCard(card, chapter));
  return card;
}

function toggleMobileCard(card, chapter) {
  const isOpen = card.classList.contains('open');

  if (openMobileId && openMobileId !== chapter.id) {
    const prev = document.querySelector(`.chapter-card[data-id="${openMobileId}"]`);
    if (prev) {
      stopCardVideo(prev);
      prev.classList.remove('open');
    }
  }

  if (isOpen) {
    stopCardVideo(card);
    card.classList.remove('open');
    openMobileId = null;
    activeVideoChapterId = null;
    return;
  }

  card.classList.add('open');
  openMobileId = chapter.id;
  activeVideoChapterId = chapter.id;
  resumeCardVideo(card, chapter.id);
  scrollToCard(card);
  recordView(chapter);
}

function stopCardVideo(card) {
  const iframe = card.querySelector('.chapter-video');
  if (!iframe) return;
  // progress is already saved continuously by the message listener
  try { iframe.contentWindow.postMessage(JSON.stringify({ event: 'pause' }), '*'); } catch (_) {}
  iframe.src = '';
}

function resumeCardVideo(card, chapterId) {
  const iframe = card.querySelector('.chapter-video');
  if (!iframe?.dataset.baseUrl) return;
  const saved = getProgress(chapterId);
  iframe.src = saved > 3
    ? `${iframe.dataset.baseUrl}&t=${saved}`
    : iframe.dataset.baseUrl;
}

function scrollToCard(card) {
  setTimeout(() => {
    const headerH = document.querySelector('.course-header')?.offsetHeight || 60;
    const top = card.getBoundingClientRect().top + window.scrollY - headerH - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 370);
}

// ─── Shared ──────────────────────────────────────────────────

async function recordView(chapter) {
  if (chapter.viewed) return;
  try {
    const res = await fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId: chapter.id }),
    });
    const data = await res.json();
    if (data.success && !data.alreadyViewed) {
      chapter.viewed = true;
      markViewed(chapter.id);
    }
  } catch (_) {}
}

function markViewed(chapterId) {
  const check = document.querySelector(`[data-check="${chapterId}"]`);
  if (check) check.classList.add('visible');

  const badge = document.querySelector(`[data-mobile-badge="${chapterId}"]`);
  if (badge) badge.style.display = 'flex';
}

// ─── Templates ───────────────────────────────────────────────

function videoEmbed(url, chapterId) {
  const saved = getProgress(chapterId);
  const src = saved > 3 ? `${url}&t=${saved}` : url;
  return `
    <div class="video-wrapper">
      <iframe
        class="chapter-video"
        data-chapter-id="${chapterId}"
        data-base-url="${url}"
        src="${src}"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowfullscreen
      ></iframe>
    </div>
  `;
}

function buildAttachments(attachments) {
  if (!attachments?.length) return '';
  const links = attachments.map((a) => `
    <a href="${escHtml(a.url)}" target="_blank" rel="noopener noreferrer" class="attachment-btn">
      ${fileIcon(a.type)} ${escHtml(a.name)}
    </a>
  `).join('');
  return `<div class="attachments-list">${links}</div>`;
}

function fileIcon(type) {
  if (type === 'pdf') return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`;
}

function checkIcon() {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
}

function viewedBadge() {
  return `
    <span class="viewed-badge">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      נצפה
    </span>
  `;
}

function arrowIcon() {
  return `
    <span class="chapter-arrow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </span>
  `;
}

function renderError() {
  document.getElementById('chapterMainPanel').innerHTML =
    '<p style="color:var(--gray);text-align:center;padding:40px">שגיאה בטעינת הפרקים</p>';
  document.getElementById('chaptersList').innerHTML =
    '<p style="color:var(--gray);text-align:center;padding:40px">שגיאה בטעינת הפרקים</p>';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
