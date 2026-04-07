/**
 * Resend email client singleton for transactional emails.
 * Used for debate result summaries and error alerts.
 */

import { Resend } from "resend";

let resendInstance = null;

/** @returns {Resend|null} */
export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendInstance) resendInstance = new Resend(apiKey);
  return resendInstance;
}

const FROM = process.env.RESEND_FROM_EMAIL || "noreply@stancestream.app";

/**
 * Send a debate summary email.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.topic
 * @param {string} opts.summary
 */
export async function sendDebateSummary({ to, topic, summary }) {
  const client = getResend();
  if (!client) return null;

  return client.emails.send({
    from: FROM,
    to,
    subject: `Debate Summary: ${topic}`,
    html: `<h2>${topic}</h2><p>${summary}</p>`,
  });
}
