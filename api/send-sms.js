// ============================================
// VERCEL SERVERLESS FUNCTION: Send SMS via Twilio
// POST /api/send-sms
// Body: { to, message }
// ============================================
const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '+18449253219';

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, message, subject } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing "to" or "message"' });
  }

  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    console.error('Twilio not configured — missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    return res.status(500).json({ error: 'Twilio not configured on server' });
  }

  // Format phone to E.164
  let phone = to.replace(/\D/g, '');
  if (phone.length === 10) phone = '1' + phone;
  if (!phone.startsWith('+')) phone = '+' + phone;

  // Compose SMS body (Twilio doesn't have subject lines, so prepend it)
  const smsBody = subject ? `${subject}: ${message}` : message;

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const result = await client.messages.create({
      body: smsBody.substring(0, 1600), // Twilio max ~1600 chars
      from: FROM_NUMBER,
      to: phone
    });
    console.log('Twilio SMS sent:', result.sid, 'to:', phone);
    return res.status(200).json({ success: true, sid: result.sid });
  } catch (error) {
    console.error('Twilio send error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
