# Device testing: Nothing Phone (Android, Chrome)

Automated tests run in desktop Chromium. They do not replace these checks on the phone.
Record the date, Android version, Chrome version and result for each step.

## Results

| Date | Device | Method | Check | Result |
|---|---|---|---|---|
| 2026-10-23 | Nothing Phone, model A059P, Android 16 (Chrome version not recorded) | Wi-Fi, plain `http://192.168.68.51:4173` | D: camera | Camera unavailable: not a secure context. Expected; led to the fix in commit 689e689 |
| 2026-10-23 | Nothing Phone, model A059P, Android 16 | Wi-Fi, plain `http://192.168.68.51:4173` | B: record screen | Finish row hidden behind the thumb dock. Fixed in commit 689e689 |
| 2026-10-23 | Nothing Phone, model A059P, Android 16 | Method A: Wireless debugging + `adb reverse`, `http://localhost:4173` | D1: rear camera opens | **Pass** (reported by owner) |
| 2026-10-23 | Nothing Phone, model A059P, Android 16 | Method A, `http://localhost:4173` | B6: Finish row stays visible above the dock | **Pass** (reported by owner) |
| 2026-10-23 | Nothing Phone, model A059P, Android 16, Chrome 155 | Method A, installed app | Journal cards with a saved label photo | Frames blank. Photos were stored and valid (1200×1600 JPEG); the photo layer was an inline element that collapsed to zero size. Entry detail was unaffected. Fixed in commit c4f5526 |
| 2026-10-26 | Nothing Phone, model A059P, Android 16 | Method A, installed app | Journal cards show the saved label photos | **Pass** (reported by owner, with screenshot of the journal showing photos on all visible cards, including an uploaded/typed-in bottle) |

| 2026-10-26 | Nothing Phone A059P, Android 16, Chrome (installed web app, WebAPK) | Method A, build `index-DbI8Zus0.js` confirmed on the phone | Recording: one-thumb dock, auto-advance (~420 ms), double-tap guard, Finish visible above dock, search and notes keyboards | **Pass** (scripted taps and DevTools reads) |
| 2026-10-26 | same | same | Edit wine details: Edit pill, sheet, save, journal and detail update, persists across close/reopen, Cancel keeps original | **Pass**. Defect found: with the keyboard open the fields were squashed to ~21 px; fixed (`flexShrink: 0`), re-verified at 54 px fields and 48 px chips |
| 2026-10-26 | same | same, real rear camera | Photographs: add, replace (camera), remove with confirmation, cancel at every step, journal cards and comparison selection, survive reopen and offline | **Pass** |
| 2026-10-26 | same | same | Gallery picker (*Choose photo*) | NOT TESTED: the native picker would show personal photos |
| 2026-10-26 | same | same | Historical integrity: sensations, rating, notes and date are read-only; edits leave them byte-identical; "Taste it again" makes a separate, later record | **Pass** |
| 2026-10-26 | same | same | Comparison selection and guided blind A/B, blind hiding (leak scans) | **Pass** |
| 2026-10-26 | same | same | Offline: launch, record and persist with the Mac server stopped | **Pass** |
| 2026-10-26 | same | same | Installed, standalone display, manifest, icons, theme colour | **Pass** (`display-mode: standalone`, WebAPK installed). Safe-area insets are 0 on this phone, so they were not exercised |
| 2026-10-26 | same | same | Layout of welcome, find, record, summary: no sideways scroll, nothing clipped; Type it in keyboard keeps field and button in view | **Pass** |
| 2026-10-26 | same | same | Android Back from a saved tasting | Leaves the app to the launcher; reopening resumes on the same tasting. Works, but Back does not step back through screens |
| 2026-10-26 | same | same | Insecure-HTTP camera message; camera permission prompt or denial; camera busy; landscape; phone restart; clear site data; fresh install; force-stop; two-person blind handoff; subjective one-thumb comfort | NOT TESTED in this pass |

The owner's saved journal was not modified: test records were deleted by id afterwards and the journal (13 tastings, 12 photos, 0 sessions) matched a pre-test fingerprint; the owner's unfinished A/B draft was backed up and restored byte-for-byte.

## Setup

The camera, installation and offline use need a **secure context**: `https://`, or `localhost`.
Plain `http://192.168.x.x:4173` over Wi-Fi is not one. Chrome then removes the camera API entirely, so
the app explains that the camera needs a secure connection and offers *Choose photo* instead.
(Confirmed in Chromium: on such an address `isSecureContext` is false and `navigator.mediaDevices`
is undefined.) Use one of the two methods below. Neither weakens Chrome's security or exposes the
app beyond your own devices.

Start the app on the Mac first:
```bash
npm run build
npx vite preview --port 4173 --host 127.0.0.1
```

### Method A (recommended): Wireless debugging, no cable or certificates

The phone opens `http://localhost:4173`, which Chrome treats as secure. Phone and Mac must be on the same Wi-Fi.

1. On the phone: Settings → About phone → tap **Build number** seven times. Then System → Developer options → turn on **Wireless debugging**.
2. Tap **Wireless debugging** → **Pair device with pairing code**. Note the IP:port and the six-digit code.
3. On the Mac (`adb` is in `~/Library/Android/sdk/platform-tools`):
   ```bash
   adb pair <phone-ip>:<pairing-port>
   ```
   Enter the code. Then connect, using the IP:port shown on the Wireless debugging screen itself (not the pairing one):
   ```bash
   adb connect <phone-ip>:<port>
   adb reverse tcp:4173 tcp:4173
   ```
4. On the phone, open Chrome at `http://localhost:4173`.

(A USB cable with USB debugging works the same way: skip pairing and run `adb reverse tcp:4173 tcp:4173`.)

### Method B: real HTTPS on the Mac's Wi-Fi address

This uses a local certificate authority from [mkcert](https://github.com/FiloSottile/mkcert).
**Security:** while installed, that authority's private key (on your Mac) could be used to impersonate
any website to the phone. Never copy `rootCA-key.pem` anywhere, and remove the authority from the phone
when testing is done.

1. On the Mac:
   ```bash
   brew install mkcert
   mkcert -install
   ```
   The second command adds the authority to the Mac's keychain and asks for your password.
2. Make a certificate for the Mac's address. `private/` is git-ignored:
   ```bash
   mkdir -p private/certs
   mkcert -cert-file private/certs/lan.pem -key-file private/certs/lan-key.pem 192.168.68.51 localhost
   ```
3. Copy **only** `rootCA.pem` from `mkcert -CAROOT` to the phone. On the phone: Settings → Security & privacy → More security settings → Encryption & credentials → **Install a certificate** → **CA certificate**.
4. Serve over HTTPS:
   ```bash
   ANOSMIA_HTTPS_CERT=private/certs/lan.pem ANOSMIA_HTTPS_KEY=private/certs/lan-key.pem npx vite preview --port 4173 --host 0.0.0.0
   ```
   Open `https://192.168.68.51:4173` on the phone. It must load with no certificate warning; never click through one.
5. When done, remove it on the phone: Encryption & credentials → **User credentials** → remove the mkcert authority. Delete `private/certs`. Optionally run `mkcert -uninstall` on the Mac.

Each address keeps its own journal. Data saved at `http://192.168.68.51:4173`, `http://localhost:4173`
and `https://192.168.68.51:4173` is stored separately on the phone.

## Checks

### A. Layout
1. Portrait. The welcome screen fills the screen with no sideways scrolling.
2. The status bar and gesture bar never cover the ANOSMIA header, the bottom bars or *Start tasting*.
3. Every screen (find, record, summary, journal, entry, compare, A/B setup/record/review/saved) shows nothing cut off at the sides.
4. Turn the phone sideways in the browser tab: the app still works, screens scroll. (The installed app is locked to portrait.)

### B. Thumb dock (record screen)
1. All dock buttons reachable one-handed.
2. A new answer is acknowledged, then moves to the next unanswered sensation after about half a second.
3. Changing an existing answer does not move on.
4. Tapping twice quickly does not answer the next sensation.
5. *Previous* / *Next* / tapping a row straight after answering stays where you put it.
6. Answer through to Finish: the Finish row scrolls into view above the dock and is never hidden behind it. Going back with *Previous*, tapping a half-hidden row, and *Keep tasting* from the summary all show the active row.

### C. Keyboard
1. Find screen: tap the search field. The keyboard opens; *Taste without naming* / *Start tasting* stays visible above it.
2. *Type it in*: the name field and *Use this* stay above the keyboard.
3. Summary: tap *Your words*. *Save to journal* stays above the keyboard.
4. A/B review notes: *Save comparison* stays above the keyboard.

### D. Camera and photos
1. *Snap the label* → Chrome asks for camera access → **Allow**. The rear camera shows in the viewfinder.
2. Take a photo → *Keep this photo?* → *Use photo*. The label tile shows the photo.
3. *Retake photo* shows the saved photo with *Keep it* / *Retake* / *Remove photo*. Retake replaces it; Remove clears it.
4. *Choose photo* opens Android's picker; a gallery image works the same way.
5. Deny access: Chrome → ⋮ → Settings → Site settings → Camera → block the app's address. *Snap the label* now explains that access is blocked and offers *Choose photo*. Re-allow afterwards.
6. Save a tasting with a photo, swipe Chrome away, reopen: the journal card and the entry show the photo.
7. While another app (e.g. the system Camera) holds the camera, *Snap the label* should say the camera couldn't start, rather than that it's blocked or missing.
8. Over plain `http://192.168.68.51:4173`, *Snap the label* says the camera needs a secure (https) connection, and *Choose photo* still works.

### E. Install
1. Chrome ⋮ → *Install app* (or *Add to Home screen*).
2. The launcher icon is the yellow glass mark, shaped by the launcher.
3. Launch: no address bar; cream background and status bar.

### F. Offline
1. Open the installed app once while online.
2. Turn on aeroplane mode. Swipe the app away and launch it again.
3. The app opens; saved tastings, entries (with photos) and A/B sessions are all there.
4. A new tasting can be recorded and saved offline.

### G. Saving
1. Saving shows *Saved…* once the entry is stored.
2. Swipe the app away mid-tasting and relaunch: it reopens where you were, answers intact.
3. Restart the phone: everything saved is still there.
4. The built-in *Sample tasting* says it isn't saved and never appears in the journal.

### H. Blind A/B (two people)
1. *Two glasses?* → *Someone else*. The pourer names A and B; the taster looks away.
2. The taster never sees a wine name, a selected wine in the naming sheet, or a label photo before saving: on setup, while recording, on review, after *Change*, or after closing and reopening the app.
3. After saving, the names are revealed and the session is labelled blind.
4. *Repeat this pair* starts as an open comparison; choosing *Someone else* clears the names for the pourer.

### I. Storage is local only
1. Chrome → Site settings → `localhost:4173` → *Clear & reset* deletes the journal. This is expected: there is no backup or sync.

### J. Changing a saved tasting's photo
1. Journal → open a tasting that has a photo. The photo shows a **Change photo** button at its lower right; one without a photo shows **Add photo**.
2. Tap the picture itself (away from the button): the same photo sheet opens.
3. *Change photo* → *Retake* → take a new photo with the rear camera → *Use photo*. The entry, its journal card and the comparison-selection screen all show the new photo straight away. Wine, sensations, notes and rating are unchanged.
4. Same again, but *Choose photo* and pick one from the gallery.
5. Before *Use photo*, back out with *Retake* → *Cancel*: the original photo is still there.
6. *Change photo* → *Remove photo* → *Keep photo* leaves it; *Remove photo* → *Remove it* clears it. The card falls back to the "No photo" placeholder, and the button now says **Add photo**.
7. Make two tastings share a photo (open a tasting, *Taste it again, blind*, save). Change the photo on one: the other keeps the original.
8. Swipe the app away and reopen: every change is still there.
9. Reach every button above with one thumb.

### K. Correcting what a saved tasting's wine was
1. Journal → open a tasting. A small **Edit** pill sits beside the wine name. There is no edit control for the notes, the rating, the sensations or the date: they are the original account and stay as recorded.
2. Tap **Edit**. A sheet opens with Wine name, Producer, Variety, Vintage and the kind chips (Red, White, Rosé, Sparkling, Orange, Sweet), prefilled with what's saved. Reach every field and button with one thumb.
3. Name an unidentified tasting and tap **Save changes**. The heading and the line beneath it update, a "Wine details saved." message appears, and the journal card and the comparison-selection screen show the new name straight away.
4. Tap into each field with the keyboard open: the field you're typing in stays visible, and **Save changes** and **Cancel** stay on screen.
5. **Cancel**, or tapping outside the sheet, leaves the tasting unchanged. Reopening starts from the saved details, not from what you typed.
6. Clear every field and save: the tasting becomes "Unnamed wine", which is still a valid tasting.
7. After correcting, tap **Reveal what I noticed**: every sensation, the notes, the rating and the date are exactly as before. Swipe the app away and reopen: the correction is still there.
8. Make a repeat with **Taste it again, blind**, then correct the older tasting: the newer one is unchanged, and the other way round.
