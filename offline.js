/*
 * offline.js  (SevaProof)
 * Challenge: "Working at remote events with weak internet"
 *
 * Check-ins are saved on the phone first, then sent when internet is available.
 * Every record has a client-made id, so sending it twice never creates a duplicate
 * (make `id` the primary key / unique key in your Supabase table).
 *
 * Usage (in scan.html / memberscan.html):
 *   const rec = SevaOffline.enqueue({ eventId, memberId, deviceId, kind: 'in', token, lat, lng });
 *   SevaOffline.autoSync(sendToSupabase);
 *
 * sendToSupabase(item) must:
 *   - resolve { ok: true }                               -> saved (also use this if the id already exists)
 *   - resolve { ok: false, rejected: true, reason }      -> server refused it for good (expired token, proxy...)
 *   - throw / reject                                     -> network problem, keep it and retry later
 */
(function (root) {
  'use strict';

  var KEY = 'sevaproof_checkin_queue_v1';
  var timer = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  function save(q) { localStorage.setItem(KEY, JSON.stringify(q)); }

  function newId() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function enqueue(rec) {
    var q = load();
    var item = Object.assign({}, rec, {
      id: rec.id || newId(),
      clientTime: rec.clientTime || Date.now(), // scan time: the server checks the QR token against THIS time
      attempts: 0
    });
    if (!q.some(function (x) { return x.id === item.id; })) { q.push(item); save(q); }
    return item;
  }

  function pending() { return load(); }

  var flushing = false;
  async function flush(sendFn) {
    var result = { sent: 0, failed: 0, rejected: [] };
    if (flushing || (root.navigator && root.navigator.onLine === false)) return result;
    flushing = true;
    try {
      var q = load(), keep = [];
      for (var i = 0; i < q.length; i++) {
        var item = q[i];
        try {
          var res = await sendFn(item);
          if (res && res.rejected) result.rejected.push({ id: item.id, reason: res.reason });
          else result.sent++;
        } catch (e) {
          item.attempts = (item.attempts || 0) + 1;
          keep.push(item);
          result.failed++;
        }
      }
      save(keep);
    } finally { flushing = false; }
    if (root.dispatchEvent) root.dispatchEvent(new CustomEvent('seva-sync', { detail: result }));
    return result;
  }

  function autoSync(sendFn, everyMs) {
    root.addEventListener('online', function () { flush(sendFn); });
    if (timer) clearInterval(timer);
    timer = setInterval(function () { flush(sendFn); }, everyMs || 30000);
    flush(sendFn);
  }

  root.SevaOffline = { enqueue: enqueue, pending: pending, flush: flush, autoSync: autoSync };
})(window);