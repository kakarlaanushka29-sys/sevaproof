# SevaProof: Setup and User Guide

## Part A. Setup (developer)

1. **Copy the new files** into your `Sevaproof` folder in VS Code:
   - root: `challenges.html`, `challenges.js`, `checkin-guard.js`, `offline.js`, `sw.js`, `setup_checkin_security.sql`
   - `docs/` folder and `tests/` folder
2. **Database:** in Supabase > SQL Editor, run `setup.sql`, `setup_profile.sql`, then `setup_checkin_security.sql`. If your `event_id` or `member_id` is not `uuid`, change the types in the new file first.
3. **Add the scripts** to `scan.html` and `memberscan.html`, before your own check-in code:
   ```html
   <script src="checkin-guard.js"></script>
   <script src="offline.js"></script>
   ```
4. **Organizer screen (`scan.html`):** every 5 seconds make a fresh code and draw it with `qr.js`:
   ```js
   const token = await CheckinGuard.makeQrToken(eventId, eventSecret);
   // draw `token` as a QR with your existing qr.js function
   ```
5. **Volunteer screen (`memberscan.html`):** after the camera reads a token:
   ```js
   const rec = SevaOffline.enqueue({
     eventId, memberId, deviceId, kind: 'in',   // or 'out'
     token, lat, lng
   });
   SevaOffline.autoSync(async (item) => {
     const { error } = await supabase.from('checkin_log').insert({
       id: item.id, event_id: item.eventId, member_id: item.memberId, kind: item.kind,
       device_id: item.deviceId, client_time: new Date(item.clientTime).toISOString(),
       lat: item.lat, lng: item.lng
     });
     if (!error || error.code === '23505') return { ok: true };           // saved, or already saved
     if (error.code === '23514' || error.code === '42501') return { ok: false, rejected: true, reason: error.message };
     throw error;                                                          // network problem: retry later
   });
   ```
   `deviceId`: create once and keep it, e.g. `localStorage.sevaDevice ||= crypto.randomUUID()`.
6. **Navigation:** add `<a href="challenges.html">Challenges</a>` to `dashboard.html`.
7. **Offline app:** keep `sw.js` in the site root; `challenges.html` registers it. Better, add this line to `ui.js` so every page registers it: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');`
8. **Deploy:** drag the project folder to Netlify (or push to your connected repo).
9. **Run tests:** `node --test tests/checkin-guard.test.js` (needs Node 19 or newer).

> Important: for full protection, the QR token must also be checked on the server, not only in the browser. The unique rules in `setup_checkin_security.sql` already block duplicates and shared phones on the server. To check the QR signature and location on the server too, move `CheckinGuard.verifyQrToken` into a Supabase Edge Function that runs before the insert.

## Part B. User guide

### Organizer
1. Log in and choose **I am an Organizer**.
2. Create the event with its name, date, time and location.
3. On the event day open **Scan** (`scan.html`) and keep the screen visible. The code changes every 30 seconds by design.
4. Volunteers scan in when they arrive and scan out when they leave. Check the dashboard for who is present.

### Volunteer
1. Log in and choose **I am a Volunteer**.
2. At the event, turn on location and open **Scan**. Point the camera at the organizer's live code.
3. You see "Checked in". With no internet, you see it saved on your phone; it sends by itself when you are online. Keep the app open until it syncs.
4. Scan again when you leave to check out. Your hours appear in your profile.
5. Open **Profile** to download a certificate. Share it or its QR with anyone who needs proof.

### Anyone verifying a certificate
Scan the QR on the certificate or open the link. The verify page shows the volunteer, event and hours, and says whether the record matches the original.

## Part C. Common messages

| Message | What to do |
|---|---|
| This code has expired | Scan the live code on the organizer's screen, not a photo |
| You are too far from the event location | Move to the venue and try again |
| You are already checked in | Nothing to do, you are recorded |
| This phone already checked in another volunteer | Each volunteer must use their own phone |
| Turn on location | Allow location for the site in the browser settings |