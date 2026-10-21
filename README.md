# Knot Site

An interactive React implementation of the **Knot Site-Windows** Figma frame, with original design assets, a Three.js knot, GSAP entrance and scroll motion, and Framer Motion transitions.

## Run locally

```sh
npm install
npm run dev
```

On Windows PowerShell with script execution disabled, use `npm.cmd` in place of `npm`.

```sh
npm run build
npm run preview
```

The production build is written to `dist/`.

## Interactions

- Drag the 3D knot, or focus it and use arrow keys. Home resets its orientation.
- Explore each phone template and the prebuilt section cards.
- Enter a username to open the portfolio editor.
- Change content, templates, colors, and visible sections in the live preview.
- Save a draft in this browser, reopen it through **Log In**, or export a standalone HTML portfolio.
- Read the journal, browse job board links, and expand FAQs.

The editor is a local prototype: it does not register a `knot.site` address, create an account, or publish visitor portfolios. Drafts remain in browser local storage. HTML exports can be hosted independently.

## Design and accessibility

Original phone, logo, and section artwork comes from the supplied Figma file. The export map is in `public/assets/design-assets.json`. Some vector exports were recovered from the local `.fig` because the Figma connector reached its plan limit; those preserve geometry, text outlines, imagery, and fills, with blur effects approximated in CSS. Sample profiles and portfolio content are illustrative.

Fonts are self-hosted in `public/fonts`; their licenses are included. The page provides keyboard controls, focus containment in dialogs, reduced-motion behavior, responsive layouts, a WebGL fallback, and paused offscreen 3D rendering.

## Verification

Production compilation and automated browser checks cover desktop and mobile layout, WebGL rendering, form validation, template dialogs, local draft persistence, HTML downloads, tabs, navigation, and FAQs. Verification captures are generated under `artifacts/` and are not included in source publication.
