# acesguild.org

Website for [Aces Guild](https://acesguild.org) — a family group with the common pursuit of exploration and **Adventures in Computer Electronics and Science**.

Built with [Astro](https://astro.build/) and deployed to GitHub Pages at `acesguild.org`.

## Development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Adding a Project

1. Create `src/content/projects/<slug>.md` — use `rocket-numero-uno.md` as a template.
2. Add images under `public/images/projects/<slug>/`.
3. The project detail page, projects index, and homepage featured section update automatically.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`), which builds the site and deploys it to GitHub Pages.
