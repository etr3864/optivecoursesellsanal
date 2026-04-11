const fetch = require('node-fetch');
const logger = require('../utils/logger');

async function sendWebhook(url, payload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;
  } catch (err) {
    logger.error('Webhook failed', { url, error: err.message });
    return false;
  }
}

module.exports = { sendWebhook };
