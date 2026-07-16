// Kick off AuthKit login → WorkOS hosted page (Google enabled) → /api/auth/callback.
import { workos, CLIENT_ID, redirectUri } from '../../lib/workos.js';

export default async function handler(req, res) {
  if (!CLIENT_ID || !process.env.WORKOS_API_KEY) {
    res.status(500).send('Auth not configured yet.');
    return;
  }
  const url = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId: CLIENT_ID,
    redirectUri: redirectUri(req),
  });
  res.writeHead(302, { Location: url });
  res.end();
}
