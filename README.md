# GSA North Star

A clickable, low-fidelity prototype of Aleksa Simeunović's North Star proposal for Serbia's agricultural subsidy application (GSA): the wizard is generated around Milan's farm rather than fixed around the government's process.

## Run

```bash
npm install
npm run dev      # http://localhost:5173/gsa-north-star/
npm test         # unit tests for src/logic
npm run build    # type-check and build to dist/
```

Use the **Prototype** button (top right) to switch scenario, sign in as Milan or Jelena, show design notes, or reset.

## Deploy (GitHub Pages)

1. Create a GitHub repository named `gsa-north-star`. If you use another name, change `base` in `vite.config.ts` to `/<repo-name>/`.
2. In the repository: Settings → Pages → Source: **GitHub Actions**.
3. Push `main`. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes `dist/`.

The site is served at `https://<user>.github.io/gsa-north-star/`. Navigation uses the URL hash, so there are no 404s on refresh.

## Structure

`src/logic` holds the pure, tested rules (wizard generator, status, readiness, estimate, geometry, submit, advisor queue). `src/ui` holds primitives with semantic props, ready for a design system. All text is in `src/copy/en.ts`; all scenario facts are in `src/data/scenarios.ts`. `CLAUDE.md` is the brief.

See `docs/acceptance.md` for where each problem and acceptance item is answered.
