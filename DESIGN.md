# Green Light Design System

## 1. Visual Intent

A direct, nocturnal broadcast notice: one restrained editorial message in the upper field of an uninterrupted black canvas, grounded by a continuous color-coded broadcast strip. Restraint is the identity; the typography supplies all hierarchy and character.

## 2. Color

- `--color-canvas: #000000` is the only surface.
- `--color-text: #f4f3ef` is the only foreground, providing high contrast without a stark blue-white cast.
- `--color-signal-red: #ff3b30`, `--color-signal-yellow: #ffd60a`, and `--color-signal-green: #30d158` form the marquee's repeating signal order. Each remains highly legible against the black canvas.

## 3. Typography

- `--font-display: "Acid Grotesk", sans-serif`, loaded locally from `/AcidGrotesk-Medium.woff2` at weight 500 with `font-display: swap`.
- `--type-message: clamp(1.875rem, 4.4vw, 4rem)` gives the intro a materially smaller fluid scale while remaining readable at 375px, 768px, and 1280px.
- `--leading-message: 0.98` and `--tracking-message: -0.035em` keep the large paragraph compact and legible.
- `--type-marquee: clamp(1.5rem, 3vw, 2.75rem)`, `--leading-marquee: 1`, and `--tracking-marquee: -0.03em` give the fixed strip a compact, emphatic label treatment in Acid Grotesk.

## 4. Spacing & Responsive Layout

- `--space-page: clamp(1rem, 3vw, 3rem)` is the viewport gutter.
- `--space-intro-start: clamp(2rem, 7.5vw, 6rem)` optically anchors the message in the viewport's upper field without imposing a fixed-height section or literal viewport-height percentage.
- `--marquee-block-size: clamp(3.5rem, 6vw, 5.5rem)` fixes the strip to a responsive, predictable bottom geometry; `--space-marquee-gap: clamp(1.5rem, 3vw, 3rem)` separates repeated labels.
- The page fills at least `100dvh`, starts the message at the top with tokenized inset, allows natural vertical growth on short viewports, and reserves the marquee block size plus the page gutter below its content.
- The message uses the available inline width and wraps naturally at 375px, 768px, and 1280px without horizontal overflow.

## 5. Components

### Broadcast Message

- **Structure:** one semantic `<main>` containing one `<p>`.
- **Variants and states:** none; the page has no interactive or alternate states.
- **Layout:** a naturally growing viewport shell with tokenized inline, top, and marquee-clearance spacing.
- **Accessibility:** semantic landmark, readable source order, no hidden or duplicated copy.

### Broadcast Marquee

- **Structure:** one fixed, full-width, overflow-clipped `<aside>` containing a moving track with two identically structured sequence halves. Each half repeats `PLAY ANYTHING` in red, yellow, green order three times so common viewport widths remain covered.
- **Variants and states:** continuous motion by default; one stationary sequence under reduced motion. It has no hover, focus, active, or interactive state.
- **Layout:** a black strip pinned to the viewport bottom. Matching end spacing on each sequence half makes a `-50%` track translation meet at an exact seam without a gap or jump.
- **Accessibility:** the strip is decorative reinforcement rather than new information, so the marquee is `aria-hidden="true"`; repeated moving labels never enter the accessibility tree or interrupt assistive technology.

## 6. Motion & Interaction

- `--duration-marquee: 24s` controls one continuous leftward cycle. The CSS-only animation is linear and infinite, and animates only `transform` from `translate3d(0, 0, 0)` to `translate3d(-50%, 0, 0)`.
- The two sequence halves are structurally identical and include matching terminal spacing, making the midpoint translation a seamless loop boundary.
- Under `prefers-reduced-motion: reduce`, animation is set to `none` and the duplicate half is hidden, retaining one stable readable red/yellow/green sequence.
- The marquee is non-interactive: motion communicates the station's ongoing programming breadth without suggesting a control or requiring a response.

## 7. Depth & Surface

Flat by intent: no gradients, borders, shadows, textures, or imagery. The fixed color strip is the sole decorative effect.

## 8. Accessibility Constraints & Accepted Debt

- Target WCAG 2.2 AA. Off-white on black exceeds contrast requirements for text.
- Intro text remains selectable, zoomable, and reflowable; no rigid top-section height is permitted, and page-level horizontal overflow is clipped.
- There are no controls, focus targets, or flashing content. The decorative marquee is excluded from the accessibility tree to prevent repeated announcements.
- Reduced-motion users receive the same visible phrase and color sequence without translation; no essential information depends on movement.
- Accepted debt: none.
