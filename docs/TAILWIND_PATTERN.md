# Tailwind CSS Hard Pattern

Codex must treat this document as law when editing Tailwind, CSS, layout markup, or visual component structure in this project.

This project uses Tailwind CSS CLI v4.

The canonical styling source is:

```text
public_html/static/css/input.css
```

Compiled output is:

```text
public_html/static/css/styles.css
```

Do not hand-edit compiled CSS.

---

## 1. Non-negotiable rules

### 1.1 Tailwind version

Use Tailwind CSS v4 syntax only.

Allowed:

```css
@import "tailwindcss";
@plugin "@iconify/tailwind4";
@source "../../index.php";
@theme { ... }
@utility name { ... }
@layer base { ... }
@layer components { ... }
@layer utilities { ... }
```

Not allowed:

```js
tailwind.config.js
```

Do not add a Tailwind config file unless explicitly instructed.

### 1.2 Styling ownership

All reusable styling belongs in:

```text
public_html/static/css/input.css
```

Markup names structure. CSS decides appearance.

Good:

```html
<section class="site-section services-section">
  <div class="site-section__inner">
    <header class="site-section__header">
      <p class="site-section__eyebrow">Services</p>
      <h2 class="site-section__title">What We Do</h2>
    </header>
  </div>
</section>
```

Bad:

```html
<section class="mx-auto max-w-7xl px-5 py-20 text-center bg-blue-darkest">
```

Utility-heavy markup is allowed only for one-off experiments. Repeated structure must become a semantic class in `input.css`.

### 1.3 No style logic in JavaScript

JavaScript may:

```text
add classes
remove classes
toggle classes
set data attributes
set CSS variables for measured values
```

JavaScript may not:

```text
build long Tailwind class strings
inject visual styling rules
own responsive layout
own component appearance
```

Good:

```js
menu.classList.toggle("is-open");
```

Bad:

```js
menu.className = "absolute left-4 right-4 top-20 grid gap-1 rounded-lg bg-gray-darkest p-4 shadow-xl";
```

---

## 2. Required `input.css` order

`public_html/static/css/input.css` must follow this order:

```text
1. Imports / plugins / sources
2. Theme tokens
3. Base layer
4. Universal primitives
5. Universal component contracts
6. Feature/page namespaces
7. Utilities
8. Keyframes
9. Media overrides
```

Do not scatter component styles randomly.

---

## 3. Imports, plugins, and sources

Use explicit sources.

```css
@import "tailwindcss";
@plugin "@iconify/tailwind4";

@source "../../index.php";
@source "../../partials/**/*.php";
@source "../js/**/*.js";
@source "../partials/**/*.html";
@source "../email-templates/**/*.html";
```

Add a new `@source` only when a real template or script path needs scanning.

---

## 4. Theme tokens

Use `@theme` for Tailwind-facing design tokens.

```css
@theme {
  --font-inter: "Inter", ui-sans-serif, sans-serif;
  --font-arimo: "Arimo", ui-sans-serif, sans-serif;
  --font-oswald: "Oswald", ui-sans-serif, sans-serif;
  --font-sgeo: "SGEO-Regular", ui-sans-serif, sans-serif;

  --color-gray-lightest: oklch(0.56 0.01 275);
  --color-gray-lighter: oklch(0.50 0.01 275);
  --color-gray-light: oklch(0.45 0.01 275);
  --color-gray-medium: oklch(0.39 0.01 275);
  --color-gray-dark: oklch(0.33 0.01 275);
  --color-gray-darker: oklch(0.26 0.01 275);
  --color-gray-darkest: oklch(0.19 0.01 275);
  --color-mdgray: oklch(0.24 0.01 275);

  --color-blue-lightest: oklch(0.72 0.11 258);
  --color-blue-lighter: oklch(0.65 0.10 258);
  --color-blue-light: oklch(0.45 0.11 258);
  --color-blue-medium: oklch(0.58 0.15 258);
  --color-blue-dark: oklch(0.50 0.13 258);
  --color-blue-darker: oklch(0.43 0.12 258);
  --color-blue-darkest: oklch(0.45 0.11 258);

  --color-accent-blue: oklch(0.58 0.15 258);
  --color-accent-blue-lite: oklch(0.72 0.11 258);
  --color-yellow: oklch(0.91 0.14 100);
  --color-red: oklch(0.65 0.24 27);

  --container-1200: 75rem;
}
```

Rules:

```text
Raw color values live in @theme.
Do not duplicate random hex values in components.
Prefer existing tokens before creating new ones.
New tokens must have semantic purpose.
```

---

## 5. Base layer

Use `@layer base` for:

```text
font-face
body
root CSS variables
browser element resets
global document structure
```

Example:

```css
@layer base {
  @font-face {
    font-family: "Inter";
    src: url("/static/font/Inter.ttf") format("truetype");
    font-display: swap;
  }

  :root {
    --header-outer-height: 90px;
    --header-inner-height: 65px;
    --header-height-difference: calc(var(--header-outer-height) - var(--header-inner-height));
    --slider-button-bg: #222429;
    --slider-line-bg: #222429;
  }

  body.body {
    font-optical-sizing: auto;
    background-image: url("/static/img/noise-texture.svg");
    background-color: var(--color-blue-darkest);
    background-repeat: repeat;
    font-family: var(--font-inter);
    color: white;
  }

  .site-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  #site-content {
    flex: 1 0 auto;
  }

  .site-footer {
    flex-shrink: 0;
  }
}
```

Do not put page-specific components in `@layer base`.

---

## 6. Universal primitives

Universal primitives are reusable building blocks.

Use `@utility`.

```css
@utility site-container {
  @apply mx-auto w-full max-w-1200 px-5 md:px-8;
}

@utility site-section-pad {
  @apply px-6 py-12 md:px-10 md:py-20;
}

@utility site-surface {
  @apply rounded-xl bg-gray-darkest shadow-lg;
}

@utility site-surface-soft {
  @apply rounded-xl bg-white/10 shadow-lg backdrop-blur;
}

@utility site-card {
  @apply rounded-xl bg-white text-gray-darkest shadow-xl;
}

@utility site-heading-eyebrow {
  @apply text-xs font-bold uppercase tracking-[0.45em] text-accent-blue-lite md:text-sm;
}

@utility site-heading-title {
  @apply font-bold leading-tight tracking-tight text-white;
}

@utility site-body-copy {
  @apply text-base leading-8 text-neutral-300 md:text-xl;
}
```

Rules:

```text
Primitives do not target a specific page.
Primitives should be reusable.
Primitives may be used by component classes.
Primitives should not encode business meaning.
```

Good primitive names:

```text
site-container
site-surface
site-card
site-section-pad
site-heading-title
site-body-copy
```

Bad primitive names:

```text
pressure-washing-card
services-blue-box
homepage-special-title
```

### 6.1 Centering and alignment primitives

Centering is a layout decision, not a single reusable trick. Before adding centered layout styles, identify what is being centered:

```text
content  = the whole content group inside a container
items    = each child inside its own grid/flex alignment area
cluster  = a row or wrap of multiple controls/items
overlay  = an out-of-flow absolute/fixed child
text     = inline content inside a text box
```

Preferred project primitives:

```css
@utility center-content {
  display: grid;
  place-content: center;
}

@utility center-items {
  display: grid;
  place-items: center;
}

@utility center-cluster {
  display: flex;
  flex-wrap: wrap;
  place-content: center;
}

@utility abs-center {
  position: absolute;
  inset: 0;
  place-self: center;
}
```

Use them by intent:

```text
center-content  centers a content group inside a box.
center-items    centers children inside their own alignment areas.
center-cluster  centers wrapping button/pill/nav groups.
abs-center      centers positioned badges, loaders, overlays, and similar children.
text-center     centers inline text only; do not use it as a layout substitute.
mx-auto         centers a block with a constrained width only.
```

Rules:

```text
Do not default to flex items-center justify-center just because the visual result looks centered.
Do not use top: 50%, left: 50%, and transform translate centering for new absolute/fixed children when inset plus place-self works.
Use semantic component classes in markup and apply these primitives in input.css for repeated patterns.
Use anchor-positioning alignment such as anchor-center only inside a focused component and preferably behind @supports.
```

---

## 7. Universal component contracts

Universal components are shared markup contracts.

Use `@layer components`.

```css
@layer components {
  .site-section {
    @apply relative;
  }

  .site-section__inner {
    @apply site-container;
  }

  .site-section__header {
    @apply mx-auto max-w-4xl text-center;
  }

  .site-section__eyebrow {
    @apply site-heading-eyebrow;
  }

  .site-section__title {
    @apply site-heading-title;
    font-size: clamp(2.4rem, 7vw, 5rem);
  }

  .site-section__text {
    @apply site-body-copy mx-auto mt-6 max-w-3xl;
  }

  .site-section__cta {
    @apply mt-8 inline-flex items-center justify-center;
  }

  .site-section__layout {
    @apply grid gap-8;
  }

  .site-section__body {
    @apply min-w-0;
  }

  .site-section__footer {
    @apply mt-10;
  }

  .site-button {
    @apply inline-flex cursor-pointer items-center justify-center rounded-md px-6 py-2 font-semibold text-white shadow-md transition-all;
  }

  .site-button--primary {
    @apply site-button h-14 w-48 text-lg;
    background: radial-gradient(circle at 50% 50%, var(--color-blue-lighter) 0%, transparent 100%), var(--color-blue-light);
    border-style: none;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 6px rgb(0 0 0 / 0.3), inset 0 2px 6px rgb(255 255 255 / 0.5);
  }

  .site-button--primary::before {
    content: "";
    pointer-events: none;
    top: 0;
    left: 0;
    border-radius: 0.75rem;
    width: 100%;
    height: 50%;
    transition: opacity 0.3s;
    background: linear-gradient(rgb(255 255 255 / 0.6), rgb(255 255 255 / 0));
    position: absolute;
  }

  .site-button--primary:hover {
    background-color: var(--color-blue-medium);
    box-shadow: 0 6px 10px rgb(0 0 0 / 0.4), inset 0 3px 8px rgb(255 255 255 / 0.6);
  }

  .site-button--primary:active {
    transform: scale(0.95);
    background-color: var(--color-blue-dark);
    box-shadow: 0 6px 10px rgb(0 0 0 / 0.4), inset 0 4px 6px rgb(0 0 0 / 0.4);
  }
}
```

Rules:

```text
Universal components start with site-.
Use BEM-style parts with __.
Use variants with --.
Do not create unrelated names for the same structural idea.
```

---

## 8. Required section contract

Every major section must use this structure unless there is a documented reason not to.

```html
<section class="site-section feature-section">
  <div class="site-section__inner feature-section__inner">
    <header class="site-section__header feature-section__header">
      <p class="site-section__eyebrow feature-section__eyebrow">Eyebrow</p>
      <h2 class="site-section__title feature-section__title">Title</h2>
      <p class="site-section__text feature-section__text">Text</p>
    </header>

    <div class="site-section__layout feature-section__layout">
      ...
    </div>
  </div>
</section>
```

Required class tiers:

```text
site-section              = universal section behavior
feature-section           = page/feature identity
site-section__inner       = universal width/padding
feature-section__inner    = feature override if needed
site-section__header      = universal header behavior
feature-section__header   = feature override if needed
site-section__layout      = universal content layout
feature-section__layout   = feature-specific grid/flex
```

---

## 9. Feature/page namespaces

Feature classes are allowed only for real feature differences.

Example:

```css
@layer components {
  .subpage-hero {
    @apply site-section overflow-hidden bg-gray-darker px-6 pt-14 text-center text-white md:pt-20;
    margin: 0;
  }

  .subpage-hero__inner {
    @apply site-section__inner max-w-4xl pb-14 md:pb-20;
  }

  .subpage-hero__eyebrow {
    @apply site-section__eyebrow;
  }

  .subpage-hero__title {
    @apply site-section__title mt-5;
  }

  .subpage-hero__text {
    @apply site-section__text;
  }

  .subpage-hero__cta {
    @apply site-section__cta;
  }

  .services-section {
    @apply site-section;
  }

  .services-section__layout {
    @apply site-section__layout md:grid-cols-2 lg:grid-cols-3;
  }

  .service-card {
    @apply site-card overflow-hidden;
  }

  .service-card__media {
    @apply aspect-video overflow-hidden;
  }

  .service-card__body {
    @apply p-6;
  }

  .service-card__title {
    @apply text-2xl font-bold text-gray-darkest;
  }

  .service-card__text {
    @apply mt-3 text-base leading-7 text-gray-medium;
  }
}
```

Allowed namespace prefixes:

```text
site-*       universal structure
subpage-*    subpage shell/hero/content
home-*       homepage-only
service-*    service cards/details
services-*   services page sections
nav-*        navigation
form-*       form controls
slider-*     comparison slider
modal-*      modal/dialog
media-*      image/video bands
```

Do not invent new prefixes when an existing prefix fits.

---

## 10. Buttons

Canonical button names:

```text
site-button
site-button--primary
site-button--secondary
site-button--ghost
site-button--link
site-icon-button
```

Legacy class support is allowed temporarily:

```css
@layer components {
  .btn-primary {
    @apply site-button--primary;
  }
}
```

New markup should use:

```html
<a class="site-button site-button--primary" href="/contact">Get Estimate</a>
```

Not:

```html
<a class="btn-primary">Get Estimate</a>
```

---

## 11. Navigation

Canonical navigation names:

```text
site-header
site-header__outer
site-header__inner
site-nav
site-nav__brand
site-nav__list
site-nav__item
site-nav__link
site-nav__toggle
```

Legacy mappings are allowed during migration:

```css
@layer components {
  .header-outer {
    @apply site-header__outer;
  }

  .header-inner {
    @apply site-header__inner;
  }

  .main-nav {
    @apply site-nav;
  }

  .nav-link {
    @apply site-nav__link;
  }

  .menu-toggle {
    @apply site-nav__toggle;
  }
}
```

---

## 12. Forms

Canonical form names:

```text
form-field
form-field__label
form-field__control
form-field__hint
form-field__error
form-input
form-select
form-textarea
form-checkbox
```

Example:

```css
@layer components {
  .form-field {
    @apply grid gap-2;
  }

  .form-field__label {
    @apply text-sm font-bold uppercase tracking-wider text-white;
  }

  .form-input,
  .form-select,
  .form-textarea {
    @apply w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-darkest outline-none transition;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    @apply border-blue-dark ring-2 ring-blue-lightest;
  }

  .form-field__error {
    @apply text-sm font-semibold text-red;
  }
}
```

---

## 13. JavaScript state classes

Use state classes only for behavior/state.

Allowed state names:

```text
.is-open
.is-active
.is-loading
.is-disabled
.is-hidden
.is-visible
.has-error
.has-value
```

Allowed data attributes:

```text
data-state
data-theme
data-route
data-current
data-index
```

Example:

```css
@media (max-width: 767px) {
  #primary-menu.is-open {
    display: grid;
    position: absolute;
    left: 1rem;
    right: 1rem;
    top: 4.75rem;
    gap: 0.25rem;
    border-radius: 0.5rem;
    background: var(--color-gray-darkest);
    padding: 1rem;
    box-shadow: 0 1rem 3rem rgb(0 0 0 / 0.4);
  }
}
```

Do not create visual one-off state names.

Bad:

```text
.blue-menu-open
.big-shadow-active
mobile-grid-show
```

---

## 14. Raw CSS allowance

Raw CSS is allowed only for things Tailwind cannot express cleanly:

```text
pseudo-elements
keyframes
clip-path
background images
radial gradients
complex shadows
CSS variables
scrollbar styling
media-query exceptions
measured JS variables
```

Good:

```css
.site-button--primary::before {
  content: "";
  background: linear-gradient(rgb(255 255 255 / 0.6), rgb(255 255 255 / 0));
}
```

Bad:

```css
.card-title {
  font-size: 24px;
  color: white;
  margin-top: 16px;
}
```

Use `@apply` for normal styling.

---

## 15. Markup rule

Markup should use short semantic class lists.

Good:

```html
<section class="site-section services-section">
  <div class="site-section__inner">
    <div class="services-section__layout">
      <article class="service-card">
        <div class="service-card__body">
          <h3 class="service-card__title">Epoxy Flooring</h3>
        </div>
      </article>
    </div>
  </div>
</section>
```

Bad:

```html
<section class="relative mx-auto max-w-1200 px-5 py-20 bg-blue-darkest text-white overflow-hidden">
```

---

## 16. Responsive rule

Responsive behavior belongs in `input.css`.

Good:

```css
.services-section__layout {
  @apply grid gap-8 md:grid-cols-2 lg:grid-cols-3;
}
```

Bad:

```html
<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
```

Exception: small, obvious one-off wrappers may use utilities in markup. Repeated layouts must become named classes.

---

## 17. Legacy migration rule

When replacing old classes, do not break templates immediately.

Use aliasing first:

```css
.btn-primary {
  @apply site-button--primary;
}
```

Then update markup gradually.

Do not delete legacy classes until all references are removed.

---

## 18. Validation checklist

Before committing CSS changes:

```bash
npm run build:css
```

Check:

```text
No Tailwind config added
No compiled CSS manually edited
No missing @source paths
No large utility piles added to markup
No JS-owned styling
No duplicate component names
No new color literals unless justified
No page-specific rules inside base layer
No repeated centering utilities in markup when a semantic component class should own the alignment
```

---

## 19. Codex instruction

When editing styling:

1. Read this file first.
2. Read `public_html/static/css/input.css`.
3. Preserve the required file order.
4. Add reusable styling to primitives or universal components first.
5. Add feature-specific classes only when layout differs.
6. Keep markup semantic.
7. Run `npm run build:css`.
8. Report changed files and verification result.

Do not invent a new styling pattern.
