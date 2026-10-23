# Device testing: Nothing Phone (Android, Chrome)

Automated tests run in desktop Chromium. They do not replace these checks on the phone.
Record the date, Android version, Chrome version and result for each step.

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
