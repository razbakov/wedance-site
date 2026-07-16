// Shared WorkOS AuthKit helpers for the protected /team layer.
// Session is a WorkOS "sealed session" stored in an HttpOnly cookie; we validate
// (and transparently refresh) it on every protected request.
import { WorkOS } from '@workos-inc/node';

// Constructing WorkOS with no key throws; stay null until keys are set so the
// site doesn't 500 before configuration. clientId must be passed here — sealed-
// session authenticate() reads it off the client, not the method args.
export const workos = process.env.WORKOS_API_KEY
  ? new WorkOS(process.env.WORKOS_API_KEY, { clientId: process.env.WORKOS_CLIENT_ID })
  : null;
export const configured = Boolean(workos && process.env.WORKOS_CLIENT_ID && process.env.WORKOS_COOKIE_PASSWORD);
export const CLIENT_ID = process.env.WORKOS_CLIENT_ID;
export const COOKIE_PASSWORD = process.env.WORKOS_COOKIE_PASSWORD;
export const COOKIE = 'wos-session';

// Optional team allowlist. Comma-separated emails in TEAM_ALLOWED_EMAILS.
// If unset, any Google-authenticated user is allowed in (flagged to lock down).
const ALLOW = (process.env.TEAM_ALLOWED_EMAILS || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export const allowlistActive = ALLOW.length > 0;

export function isAllowed(user) {
  if (!ALLOW.length) return true;
  return ALLOW.includes((user?.email || '').toLowerCase());
}

export function redirectUri(req) {
  return process.env.WORKOS_REDIRECT_URI
    || `https://${req.headers.host}/api/auth/callback`;
}

function cookieHeader(value, maxAge) {
  const parts = [`${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (maxAge != null) parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

export function setSessionCookie(res, sealed, maxAge = 60 * 60 * 24 * 7) {
  res.setHeader('Set-Cookie', cookieHeader(encodeURIComponent(sealed), maxAge));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', cookieHeader('', 0));
}

export function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const hit = raw.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

// Validate the sealed session; refresh + re-seal if the access token expired.
// Returns { authenticated, user, ... }.
export async function getSession(req, res) {
  const sessionData = readCookie(req, COOKIE);
  if (!workos || !sessionData || !COOKIE_PASSWORD) return { authenticated: false };
  const session = workos.userManagement.loadSealedSession({ sessionData, cookiePassword: COOKIE_PASSWORD });
  try {
    const r = await session.authenticate();
    if (r.authenticated) return r;
    if (r.reason === 'no_session_cookie') return { authenticated: false };
    // access token expired → refresh
    const rr = await session.refresh();
    if (rr.authenticated && rr.sealedSession && res) {
      setSessionCookie(res, rr.sealedSession);
      return rr;
    }
    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}
