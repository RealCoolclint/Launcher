const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const ADMIN_EMAIL = 'martin.pavloff@letudiant.fr';
const FROM_EMAIL = 'Launcher <noreply@letudiant.fr>';

// ─── Signalement de problème ──────────────────────────────────────────────────

async function sendBugReport({ profileName, message }) {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Clé Resend non configurée.' };
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[Launcher] Signalement — ${profileName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Signalement de problème</h2>
          <p><strong>Profil :</strong> ${profileName}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0;" />
          <p style="white-space: pre-wrap;">${message}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            Envoyé automatiquement par Launcher v2 — Tranquility Suite
          </p>
        </div>
      `
    });

    return { success: true };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Notification admin (usage futur) ────────────────────────────────────────

async function sendAdminNotification({ subject, message }) {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Clé Resend non configurée.' };
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[Launcher] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <p style="white-space: pre-wrap;">${message}</p>
          <p style="color: #94a3b8; font-size: 12px;">
            Envoyé automatiquement par Launcher v2 — Tranquility Suite
          </p>
        </div>
      `
    });

    return { success: true };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { sendBugReport, sendAdminNotification };
