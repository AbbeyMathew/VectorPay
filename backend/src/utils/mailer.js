const nodemailer = require('nodemailer');
const env = require('../config/env');

const outbox = [];

let transporter;
function getTransporter() {
  if (!env.mail.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  if (env.isTest) {
    outbox.push({ to, subject, text, html });
    return;
  }

  const smtp = env.mail.transport === 'console' ? null : getTransporter();
  if (smtp) {
    await smtp.sendMail({ from: env.mail.from, to, subject, text, html });
    return;
  }

  if (env.isProd && env.mail.transport !== 'console') {
    throw new Error('SMTP is not configured (set SMTP_HOST, or MAIL_TRANSPORT=console for demos)');
  }
  console.log(`\n[mail] to: ${to}\n[mail] subject: ${subject}\n[mail] ${text}\n`);
}

module.exports = { sendMail, outbox };
