# SevaProof: Test Report

**Scope:** check-in rules for duplicates, proxy attempts and offline sync (`checkin-guard.js`).
**How to run:** `node --test tests/checkin-guard.test.js` (Node 22.22.2 used for this run)
**Result:** 16 tests, 16 passed, 0 failed.

## Automated tests

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Valid live QR token | Accepted | Pass |
| 2 | Proxy: screenshot of QR sent to a friend 2 minutes later | Rejected, TOKEN_EXPIRED | Pass |
| 3 | QR from a different event | Rejected, WRONG_EVENT | Pass |
| 4 | Proxy: forged token without the secret | Rejected, BAD_SIGNATURE | Pass |
| 5 | Random text instead of a QR token | Rejected, MALFORMED_TOKEN | Pass |
| 6 | Proxy: check-in from far away | Rejected, OUT_OF_RANGE | Pass |
| 7 | No location while geofence is on | Rejected, LOCATION_REQUIRED | Pass |
| 8 | Remote event (no geofence), no location | Accepted | Pass |
| 9 | Check-in after the event ended | Rejected, OUTSIDE_EVENT_TIME | Pass |
| 10 | Duplicate: same volunteer checks in twice | Rejected, DUPLICATE_CHECKIN | Pass |
| 11 | Check-out without check-in | Rejected, NOT_CHECKED_IN | Pass |
| 12 | Duplicate: second check-out | Rejected, DUPLICATE_CHECKOUT | Pass |
| 13 | Proxy: one phone checks in a second volunteer | Rejected, DEVICE_ALREADY_USED | Pass |
| 14 | Two volunteers on their own phones | Both accepted | Pass |
| 15 | Offline: token scanned offline, verified later using scan time | Accepted | Pass |
| 16 | Hours: 90 min = 1.5 h, negative = 0, over 24 h capped at 24 | Correct values | Pass |

## Manual tests to run on the live site

Tick these after you test on two phones.

- [ ] Organizer screen shows a QR that changes about every 30 seconds
- [ ] Volunteer phone in airplane mode: scan is saved, then sent after turning internet back on
- [ ] Sending the same saved scan twice creates only one row in `checkin_log`
- [ ] Second phone tries to check in another account: refused
- [ ] Certificate downloads and its QR opens `verify.html` with correct details
- [ ] Changing a stored hours value in the database makes `verify.html` report a mismatch

## Known limits

- The automated tests cover the rule logic. Server-side checking of the QR signature needs an Edge Function (see the setup guide); duplicates and shared phones are already enforced by database constraints.
- GPS accuracy indoors can be poor; the app asks the volunteer to move outdoors when accuracy is worse than the event radius.
-