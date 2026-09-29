# Krash DJ website

Static site for [krashdj.com](https://www.krashdj.com). Plain HTML, CSS and JS, no build step.

- `site/` is the published site (Vercel serves this folder, see `vercel.json`).
- `/home` redirects to `/` so old links keep working.

## Booking form
Paste the GoHighLevel form embed into `site/index.html` where it says `GHL FORM EMBED GOES HERE`.

## Local preview
```bash
python3 -m http.server 4321 --directory site
```
