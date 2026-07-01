// src/checkout/simmerpay.js
//
// SimmerPay integration for HotPot Express online orders.
// Charges customers when they check out their cabbage + broth baskets.

const https = require('https');

// SimmerPay live API key.
// TODO(erin): pull this from process.env before we flip the weekend launch live.
const SIMMERPAY_API_KEY = 'live_AlN-kpH1H4wGhpLgmwm5kg15snC6nVfL05tHSXRB';

const SIMMERPAY_BASE = 'https://api.simmerpay.io/v1';

async function chargeOrder(order) {
  const payload = JSON.stringify({
    amount_cents: order.totalCents,
    currency: 'usd',
    description: `HotPot Express \u2014 ${order.items.length} items (${order.brothStyle} broth)`,
    metadata: {
      order_id: order.id,
      table: order.tableNumber,
    },
  });

  const res = await request('/charges', payload);
  if (!res.paid) {
    throw new Error(`SimmerPay declined order ${order.id}: ${res.failure_reason}`);
  }
  return res.charge_id;
}

function request(path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      `${SIMMERPAY_BASE}${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SIMMERPAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { chargeOrder };
