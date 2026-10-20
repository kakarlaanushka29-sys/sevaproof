/*
 * checkin-guard.js  (SevaProof)
 * Challenge: "Preventing proxy check-ins"
 * Outcome:   "A check-in system recording presence and hours" + "tested for duplicates and proxy attempts"
 *
 * Works in the browser (window.CheckinGuard) and in Node (require) so the same code is unit-tested.
 *
 * Proxy defences:
 *  1. Rotating QR token  - organizer's QR changes every 30 s, so a photo/screenshot sent to a friend expires.
 *  2. Geofence           - check-in must be within the event radius (unless the event is flagged noGeofence).
 *  3. Duplicate guard    - one check-in and one check-out per member per event.
 *  4. Shared-device guard- one phone cannot check in two different members to the same event.
 *  5. Time window        - only from 15 min before start until the event ends.
 */
(function (root) {
  'use strict';
  'use strict';

  var TOKEN_WINDOW_SEC = 30;
  var EARLY_MS = 15 * 60 * 1000;

  // ---------- crypto helpers (Web Crypto: browser + Node 19+) ----------
  var subtle = (root.crypto && root.crypto.subtle) || (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle);

  function toHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  async function hmacHex(secret, message) {
    var enc = new TextEncoder();
    var key = await subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return toHex(await subtle.sign('HMAC', key, enc.encode(message)));
  }

  function windowIndex(ms) { return Math.floor(ms / 1000 / TOKEN_WINDOW_SEC); }

  // ---------- 1. rotating QR token ----------
  // Organizer screen: call makeQrToken every few seconds and render the result with qr.js.
  async function makeQrToken(eventId, secret, nowMs) {
    nowMs = nowMs == null ? Date.now() : nowMs;
    var w = windowIndex(nowMs);
    var sig = (await hmacHex(secret, eventId + ':' + w)).slice(0, 16);
    return eventId + '.' + w + '.' + sig;
  }

  // Server / Supabase side (or offline sync): pass the member's scan time as nowMs.
  async function verifyQrToken(token, eventId, secret, nowMs, drift) {
    nowMs = nowMs == null ? Date.now() : nowMs;
    drift = drift == null ? 1 : drift; // allow 1 window (30 s) of clock/scan delay
    var parts = String(token || '').split('.');
    if (parts.length !== 3) return { ok: false, reason: 'MALFORMED_TOKEN' };
    var eid = parts[0], win = Number(parts[1]), sig = parts[2];
    if (eid !== eventId) return { ok: false, reason: 'WRONG_EVENT' };
    if (!Number.isInteger(win)) return { ok: false, reason: 'MALFORMED_TOKEN' };
    if (Math.abs(windowIndex(nowMs) - win) > drift) return { ok: false, reason: 'TOKEN_EXPIRED' };
    var expected = (await hmacHex(secret, eid + ':' + win)).slice(0, 16);
    return expected === sig ? { ok: true } : { ok: false, reason: 'BAD_SIGNATURE' };
  }

  // ---------- 2. geofence ----------
  function distanceMeters(a, b) {
    var R = 6371000, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // ---------- 3-5. full decision ----------
  /*
   * input = {
   *   event:    { id, startMs, endMs, lat, lng, radiusM, noGeofence },
   *   memberId, deviceId, kind: 'in' | 'out',
   *   token, secret, nowMs,
   *   location: { lat, lng, accuracy } | null,
   *   existing: [ { eventId, memberId, deviceId, kind } ]   // check-ins already stored
   * }
   * returns { ok: boolean, reason: string }
   */
  async function evaluateCheckin(input) {
    var ev = input.event, now = input.nowMs == null ? Date.now() : input.nowMs;
    var existing = input.existing || [];
    var kind = input.kind || 'in';

    if (now < ev.startMs - EARLY_MS || now > ev.endMs) return { ok: false, reason: 'OUTSIDE_EVENT_TIME' };

    var t = await verifyQrToken(input.token, ev.id, input.secret, now);
    if (!t.ok) return t;

    if (!ev.noGeofence) {
      if (!input.location) return { ok: false, reason: 'LOCATION_REQUIRED' };
      var radius = ev.radiusM || 150;
      if (input.location.accuracy && input.location.accuracy > radius) return { ok: false, reason: 'LOCATION_TOO_VAGUE' };
      if (distanceMeters(input.location, ev) > radius) return { ok: false, reason: 'OUT_OF_RANGE' };
    }

    var mine = existing.filter(function (r) { return r.eventId === ev.id && r.memberId === input.memberId; });
    var hasIn = mine.some(function (r) { return r.kind === 'in'; });
    var hasOut = mine.some(function (r) { return r.kind === 'out'; });

    if (kind === 'in' && hasIn) return { ok: false, reason: 'DUPLICATE_CHECKIN' };
    if (kind === 'out' && !hasIn) return { ok: false, reason: 'NOT_CHECKED_IN' };
    if (kind === 'out' && hasOut) return { ok: false, reason: 'DUPLICATE_CHECKOUT' };

    var sharedDevice = existing.some(function (r) {
      return r.eventId === ev.id && r.kind === kind && r.deviceId === input.deviceId && r.memberId !== input.memberId;
    });
    if (sharedDevice) return { ok: false, reason: 'DEVICE_ALREADY_USED' };

    return { ok: true, reason: 'OK' };
  }

  // ---------- hours ----------
  function hoursBetween(inMs, outMs, capHours) {
    capHours = capHours || 24;
    if (!(outMs > inMs)) return 0;
    var h = (outMs - inMs) / 3600000;
    return Math.round(Math.min(h, capHours) * 100) / 100;
  }

  // ---------- presence checks (automatic roll call) ----------
  // After check-in, a presence check is due every `everyMs` (default 30 min). The volunteer has `windowMs`
  // (default 5 min) to scan the live QR. Round k is due at checkIn + k * everyMs.
  var ROLL_EVERY_MS = 30 * 60000, ROLL_WINDOW_MS = 5 * 60000;

  function rollState(inMs, nowMs, everyMs, windowMs) {
    everyMs = everyMs || ROLL_EVERY_MS; windowMs = windowMs || ROLL_WINDOW_MS;
    var k = Math.floor((nowMs - inMs) / everyMs);
    if (!(k >= 1)) return { round: 0, open: false, msLeft: 0 };
    var elapsed = nowMs - (inMs + k * everyMs);
    return { round: k, open: elapsed <= windowMs, msLeft: Math.max(0, windowMs - elapsed) };
  }

  function roundsDue(inMs, outMs, everyMs) {
    everyMs = everyMs || ROLL_EVERY_MS;
    var k = Math.floor((outMs - inMs) / everyMs);
    return k > 0 ? k : 0;
  }

  // Human-readable messages for the UI (plain language, tells the person what to do).
  var MESSAGES = {
    OK: 'Checked in.',
    MALFORMED_TOKEN: 'This QR code is not a SevaProof event code. Scan the organizer\'s code.',
    WRONG_EVENT: 'This code is for a different event.',
    TOKEN_EXPIRED: 'This code has expired. Scan the live code on the organizer\'s screen.',
    BAD_SIGNATURE: 'This code could not be verified. Scan the live code on the organizer\'s screen.',
    OUTSIDE_EVENT_TIME: 'The event is not open for check-in right now.',
    LOCATION_REQUIRED: 'Turn on location to check in at this event.',
    LOCATION_TOO_VAGUE: 'Your location is not accurate enough. Move outdoors and try again.',
    OUT_OF_RANGE: 'You are too far from the event location.',
    DUPLICATE_CHECKIN: 'You are already checked in to this event.',
    NOT_CHECKED_IN: 'Check in first before checking out.',
    DUPLICATE_CHECKOUT: 'You have already checked out of this event.',
    DEVICE_ALREADY_USED: 'This phone already checked in another volunteer. Each volunteer must use their own phone.'
  };

  var api = {
    TOKEN_WINDOW_SEC: TOKEN_WINDOW_SEC,
    makeQrToken: makeQrToken,
    verifyQrToken: verifyQrToken,
    distanceMeters: distanceMeters,
    evaluateCheckin: evaluateCheckin,
    hoursBetween: hoursBetween,
    rollState: rollState,
    roundsDue: roundsDue,
    MESSAGES: MESSAGES
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CheckinGuard = api;
})(typeof window !== 'undefined' ? window : globalThis);