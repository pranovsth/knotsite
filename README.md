# Knot Site

A production-ready React implementation of the **Knot Site-Windows** Figma frame. The 1600 × 4824 desktop composition follows the source geometry and artwork, while the mobile layout reflows for touch, readability, and narrow screens.

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

## Homepage behavior

- Original logo, phone, section, testimonial, editor, and shadow artwork is exported from the supplied Figma file.
- GSAP reveals below-the-fold content with a short, one-time scroll transition.
- Framer Motion handles dialog transitions and the interactive editor preview.
- Template artwork, navigation, claim forms, journal, FAQs, support, and legal links are keyboard and touch accessible.
- The homepage adapts at 767px with a mobile menu, scrollable template gallery, reflowed section art, two-column features, and a compact footer.
- `prefers-reduced-motion` disables nonessential animation.

The claim and account controls open a local portfolio editor for this portfolio demonstration. They do not register a domain or create a real account. Drafts stay in browser storage and can be exported as standalone HTML.

## Verification

```sh
node tests/exact-design.mjs
node tests/editor-production.mjs
```

The exact-design suite checks the 1600px Figma geometry, exported assets, image loading, desktop and mobile bounds, menu and dialog focus, reduced motion, claim validation, draft persistence, and HTML export. QA captures and reports are generated under `artifacts/` and are excluded from publication.
