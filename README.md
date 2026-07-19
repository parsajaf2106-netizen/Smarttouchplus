# Smart Touch + Website

A static marketing site for Smart Touch + (managed IT services, Richmond Hill & GTA), plus a small serverless function that powers the "Byte" AI chat widget.

## Structure

- Plain HTML/CSS/JS — no build step. Each page (`index.html`, `services.html`, `industries.html`, `about.html`, `resources.html`, `contact.html`) shares a header/footer that's injected at runtime by `js/includes.js` from `partials/header.html` and `partials/footer.html`.
- `api/chat.js` — a Vercel serverless function that proxies chat messages to the Google Gemini API (free tier). This is the only part of the project that needs Node.

Because the header/footer are loaded via `fetch()`, **the site must be served over HTTP** — opening `index.html` directly as a `file://` URL will not load the nav/footer.

## Local development

Two options:

```bash
# Option A: full local dev, including the /api/chat function
npm install
npx vercel dev

# Option B: just the static pages (contact form / chat widget won't work)
npx serve .
```

For Option A, create a `.env` file (see `.env.example`) with your own free Gemini API key.

## Deploying (Vercel)

1. Push this project to a Git repo and import it in Vercel, or run `npx vercel` from this folder.
2. In the Vercel project's Environment Variables, add `GEMINI_API_KEY` (get a free key at https://aistudio.google.com/apikey — no credit card required). Without this, the site still works — the Byte chat widget will just show a friendly "not set up yet" message instead of crashing.
3. Point the `smarttouchplus.com` domain at the Vercel project (Vercel → Project → Settings → Domains).

## Things to finish before launch

- **Contact form + newsletter signup**: both use [Formspree](https://formspree.io) (free tier) so submissions actually deliver somewhere without a custom backend. Create a free Formspree account, create a form, and replace `YOUR_FORM_ID` in the `action` attribute in `contact.html` and `resources.html` with your real form ID. Until then, submitting either form shows a clear "not connected yet" message instead of silently failing.
- **GEMINI_API_KEY**: required for the Byte chat widget to give real answers (see Deploying, above). It's free — no billing setup needed.
- **Testimonials**: intentionally left out of this build rather than reusing the old placeholder quotes. Once you have 2–3 real client testimonials, they can be added back as a section on the home page.
- **Social links**: `partials/footer.html` has LinkedIn/Instagram icon placeholders that currently link to the contact page. Swap in real profile URLs once they exist.
- **Domain**: meta tags and canonical URLs are already set to `https://smarttouchplus.com` — update them if the final domain differs.

## Editing content

- Header/nav: `partials/header.html`
- Footer (contact info, quick links): `partials/footer.html`
- Colors/fonts/spacing: CSS variables at the top of `css/styles.css`
- Chat assistant's knowledge of the business: the `SYSTEM_PROMPT` constant in `api/chat.js`
