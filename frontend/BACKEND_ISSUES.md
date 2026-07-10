# Backend Issues & Requests

Log here anything the frontend needs from the backend that is **missing, wrong, or blocking**.
**Do not fix the backend yourself and do not read backend source** — just describe the need
here clearly enough that a backend developer can act on it without this conversation, then
code the frontend against a stub/assumption so you stay unblocked.

## How to add an entry

Add a new `### ` block at the top of the "Open" list. Include: what you need, where in the
UI it's needed, the exact endpoint/field/shape, and your temporary workaround.

Template:
```
### [OPEN] <short title>
- **Where**: <screen / flow>
- **Need**: <endpoint / field / behavior, with exact shape>
- **Why**: <what the UI can't do without it>
- **Workaround**: <stub/mock you used so you could continue>
- **Date**: <YYYY-MM-DD>
```

When resolved by the backend, change `[OPEN]` → `[DONE]` and move it to the bottom.

---

## Open

### [OPEN] No binary file-upload endpoint for photos/videos
- **Where**: Add-property wizard (Uploader), contract photos.
- **Need**: An endpoint that accepts real image/video files (multipart) and returns stored
  paths/URLs. Today `photo_files` / `video_files` are just **arrays of strings** the API
  stores verbatim — there is no place to upload actual binaries.
- **Why**: The UI lets staff pick images from their device; those bytes need somewhere to go.
- **Workaround**: Send placeholder path strings for now; wire the real uploader once an
  upload endpoint exists.
- **Date**: 2026-07-10

---

## Done

_(none yet)_
