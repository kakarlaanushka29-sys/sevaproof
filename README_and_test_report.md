# SevaProof (FIVEVERSE) PS 18: Verified Volunteer Hours
## Setup (Tanzil: expand this into the user guide with screenshots)
1. Create Supabase project > run setup.sql > paste URL + anon key into supabase.js
2. Authentication > Email > turn off "Confirm email"
3. Run: open folder in VS Code > Live Server on index.html (or deploy with Firebase Hosting)
## Test report (fill Result column while testing)
| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | Volunteer scans live QR | Checked in | |
| 2 | Same volunteer scans again | Checked out, hours saved | |
| 3 | Scan after checkout | Rejected: already checked out | |
| 4 | Scan screenshot older than 60 s | Rejected: QR expired | |
| 5 | Scan from 500 m away | Rejected: too far | |
| 6 | Open certificate QR | Verified page shows details | |
| 7 | Open verify link with fake ID | Not verified | |
## Docs to add: system design, data-flow diagram, demo video
