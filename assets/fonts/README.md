# Fonts

The template uses two Google Fonts, loaded in every page `<head>`:

- **Sora** 600 / 700 / 800 — headings (`--cw-font-display`)
- **Nunito Sans** 400 / 600 / 700 / 800 — body text (`--cw-font-body`)

## Self-hosting (optional, for privacy or offline use)

1. Download the WOFF2 files (e.g. from https://gwfh.mranftl.com/fonts — "google-webfonts-helper").
2. Put them in this folder, e.g. `sora-v12-latin-700.woff2`.
3. Add `@font-face` rules at the top of `assets/css/style.css`:

```css
@font-face {
  font-family: "Sora";
  src: url("../fonts/sora-v12-latin-700.woff2") format("woff2");
  font-weight: 700; font-style: normal; font-display: swap;
}
```

4. Remove the three `fonts.googleapis.com` / `fonts.gstatic.com` lines from each page `<head>`.

For Arabic or Hebrew content, add a matching font (e.g. Noto Sans Arabic) and reference it in `assets/css/rtl.css`.
