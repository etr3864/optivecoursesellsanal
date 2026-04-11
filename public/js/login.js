(async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) window.location.href = '/course';
  } catch (_) {}
})();

const form = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');
const errorEl = document.getElementById('loginError');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  setLoading(true);

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    });

    if (res.ok) {
      window.location.href = '/course';
      return;
    }

    showError('הפרטים שהוזנו אינם נכונים');
  } catch (_) {
    showError('הפרטים שהוזנו אינם נכונים');
  } finally {
    setLoading(false);
  }
});

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.classList.toggle('loading', on);
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add('visible');
}

function clearError() {
  errorEl.textContent = '';
  errorEl.classList.remove('visible');
}
