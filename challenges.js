/*
 * challenges.js (SevaProof)
 * Problem Statement 18 (TH2-PS-OI-018): every challenge and expected outcome, with the feature
 * and files that cover it. status: 'built' = added in this update, 'confirm' = relies on your existing files.
 */
window.SEVA_PS = {
  id: 'TH2-PS-OI-018',
  track: 'Open Innovation',
  title: 'Problem Statement 18',
  subtitle: 'Verified Volunteer Service Hours and Digital Certificates',
  description:
    'Volunteer hours are recorded on paper, so hours are easy to inflate, certificates are disputed and volunteers lack portable proof of service.',

  challenges: [
    {
      id: 'C1',
      text: 'Preventing proxy check-ins',
      how: 'The organizer\'s QR changes every 30 seconds, so a forwarded screenshot expires. Check-in also needs the volunteer to be at the event location, allows one check-in and one check-out per volunteer, and blocks one phone from checking in two people.',
      files: ['checkin-guard.js', 'scan.html', 'memberscan.html', 'qr.js', 'setup_checkin_security.sql'],
      open: 'scan.html',
      status: 'confirm'
    },
    {
      id: 'C2',
      text: 'Working at remote events with weak internet',
      how: 'The app opens offline. Check-ins are saved on the phone and sent automatically when internet returns. Each record has its own id, so a retry never creates a duplicate, and the QR is checked against the scan time, not the sync time.',
      files: ['offline.js', 'sw.js', 'manifest.json'],
      open: 'memberscan.html',
      status: 'built'
    },
    {
      id: 'C3',
      text: 'Issuing credible records',
      how: 'Each service record gets a tamper-evident hash and a QR. Anyone can open the verify page and confirm a record without logging in.',
      files: ['hash.js', 'qr.js', 'verify.html', 'certificate.js'],
      open: 'verify.html',
      status: 'confirm'
    }
  ],

  outcomes: [
    {
      id: 'O1',
      text: 'Working prototype of the proposed system',
      how: 'Live on Netlify with Volunteer and Organizer sign-in.',
      files: ['index.html', 'login.js', 'supabase.js', 'dashboard.html', 'member.html'],
      open: 'index.html',
      status: 'confirm'
    },
    {
      id: 'O2',
      text: 'A check-in system recording presence and hours',
      how: 'Scan in, scan out, and hours are calculated from the two times (capped at 24 h per event).',
      files: ['scan.html', 'memberscan.html', 'checkin-guard.js'],
      open: 'scan.html',
      status: 'built'
    },
    {
      id: 'O3',
      text: 'Verifiable digital service records',
      how: 'Every record has a hash and a public verify link.',
      files: ['hash.js', 'verify.html', 'qr.js'],
      open: 'verify.html',
      status: 'confirm'
    },
    {
      id: 'O4',
      text: 'Exportable certificates',
      how: 'Volunteers download a certificate with a QR that opens its verify page.',
      files: ['certificate.js', 'profile.html', 'member.html'],
      open: 'profile.html',
      status: 'confirm'
    },
    {
      id: 'O5',
      text: 'Reliable operation: check-in records tested for duplicates and proxy attempts',
      how: '16 automated tests cover duplicate check-ins and check-outs, expired and forged QR codes, out-of-range location, shared phones and offline sync.',
      files: ['tests/checkin-guard.test.js', 'docs/TEST_REPORT.md'],
      open: 'docs/TEST_REPORT.md',
      status: 'built'
    },
    {
      id: 'O6',
      text: 'Proper documentation: system design and data-flow diagram, wiring / circuit diagram, source code, setup and user guide, and test report',
      how: 'All five documents are in the docs folder; source code is the project itself.',
      files: [
        'docs/SYSTEM_DESIGN.md (design + data-flow diagram)',
        'docs/WIRING_DIAGRAM.md',
        'docs/SETUP_AND_USER_GUIDE.md',
        'docs/TEST_REPORT.md',
        'README_and_test_report.md'
      ],
      open: 'docs/SYSTEM_DESIGN.md',
      status: 'built'
    }
  ]
};