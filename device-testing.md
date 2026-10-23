# Device testing: Nothing Phone (Android, Chrome)

Automated tests run in desktop Chromium. They do not replace these checks on the phone.
Record the date, Android version, Chrome version and result for each step.

## Setup

The camera and app installation need a secure origin. Reach the Mac's server as `localhost` over USB:

1. On the phone: Settings → About phone → tap *Build number* seven times; then System → Developer options → enable **USB debugging**. Connect by USB and accept the prompt.
2. On the Mac (Android platform-tools installed):
   ```bash
   npm run build
   npx vite preview --port 4173 --host 127.0.0.1
   adb reverse tcp:4173 tcp:4173
   ```
3. On the phone, open Chrome at `http://localhost:4173`.

(Opening `http://<mac-ip>:4173` over Wi-Fi also loads the app, but it is not a secure origin: the
camera falls back to choosing a photo, and Chrome will not offer to install it.)

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
5. Deny access: Chrome → ⋮ → Settings → Site settings → Camera → block `localhost:4173`. *Snap the label* now explains that access is blocked and offers *Choose photo*. Re-allow afterwards.
6. Save a tasting with a photo, swipe Chrome away, reopen: the journal card and the entry show the photo.

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
