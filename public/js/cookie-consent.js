(function () {
  if (localStorage.getItem('cookie_consent') === 'accepted') return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'הסכמה לעוגיות');
  banner.innerHTML = `
    <p class="cookie-banner-text">
      אנו משתמשים בעוגייה אחת לצורך אימות הכניסה לאתר.
      לפרטים נוספים ראה את <a href="/terms#cookies">מדיניות העוגיות</a> שלנו.
    </p>
    <div class="cookie-banner-actions">
      <button class="cookie-accept-btn" id="cookieAcceptBtn">הבנתי, אישור</button>
    </div>
  `;

  document.body.appendChild(banner);
  requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('visible')));

  document.getElementById('cookieAcceptBtn').addEventListener('click', () => {
    localStorage.setItem('cookie_consent', 'accepted');
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
  });
})();
