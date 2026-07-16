// Clear the session cookie and bounce through WorkOS logout back to the public doc.
import { workos, COOKIE_PASSWORD, COOKIE, readCookie, clearSessionCookie } from '../../lib/workos.js';

export default async function handler(req, res) {
  const sessionData = readCookie(req, COOKIE);
  clearSessionCookie(res);
  let location = `https://${req.headers.host}/`;
  if (sessionData && COOKIE_PASSWORD) {
    try {
      const session = workos.userManagement.loadSealedSession({ sessionData, cookiePassword: COOKIE_PASSWORD });
      location = await session.getLogoutUrl();
    } catch { /* fall back to home */ }
  }
  res.writeHead(302, { Location: location });
  res.end();
}
