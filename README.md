# adhityavenkatraman.github.io

Personal website for Adhitya Venkatraman — Economist, Global Markets.

## Stack

Pure HTML, CSS, and vanilla JavaScript. No build step, no dependencies, no frameworks.

## Deploying to GitHub Pages

1. Create a repository named `<your-github-username>.github.io`
2. Push all files in this folder to the `main` branch:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
git push -u origin main
```

3. Go to **Settings → Pages** in your GitHub repo and confirm the source is set to `main` branch, root directory.

Your site will be live at `https://<your-username>.github.io` within a minute or two.

## Files

```
index.html   — markup and content
style.css    — all styles (no external CSS dependencies)
main.js      — background animation + scroll reveals
README.md    — this file
```

## Customizing

- **Publication links**: search for `href="#"` in `index.html` and replace with real DOI or PDF URLs.
- **GitHub link**: the header GitHub link currently points to `github.com/adhityavenkatraman` — update if your username differs.
- **Contact**: email is `adhityavenkatraman@gmail.com` throughout.
- **Fonts**: loaded from Google Fonts (Lora + IBM Plex Mono). Works offline after first load due to browser caching.
