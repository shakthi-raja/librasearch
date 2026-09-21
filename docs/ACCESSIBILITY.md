# Accessibility pass

The signed-in screens were walked the way a keyboard-only user meets them:
skip link first, then the top bar, then the page heading, then the content.
What follows is what changed in the phase-four pass and what remains open.

## Checked on every operational screen

- **Landmarks.** One `header`, one `nav` per role, one `main` with `id="main"`,
  and the skip link as the first focusable thing on the page.
- **Headings.** Every page starts with a single `h1` from `PageHeader`; sections
  use `h2` with `aria-labelledby` pointing at them.
- **Current section.** `NavLinks` marks the active route with
  `aria-current="page"` and scrolls it into view on narrow headers.
- **Tables.** Each data table has a `caption`, column headers inside `thead`,
  and no layout tables.
- **Forms.** `Field` wraps the control in its label, so every input on the
  settings, notices and procurement forms has a name; errors sit next to the
  form and use `role="alert"` or `role="status"`.
- **Charts.** The desk-traffic bars carry a per-day `aria-label` ("04 Nov 2026:
  3 loans") and the bars themselves are decorative (`aria-hidden`); subject
  bars keep their numeric value as text beside them.

## Command palette

The palette is a modal dialog: `role="dialog"`, `aria-modal`, a label, focus
moved to the filter input when it opens, Escape closes it, and Tab stays inside
the dialog. Closing returns focus to the button that opened it. Every result is
a real button, so it works without the arrow-key shortcut.

## Colour and motion

Text uses the ink, ink-2 and muted tokens on paper backgrounds; the tangerine
signal is only used for marks and bars next to a text value, never as the sole
carrier of meaning. The only transitions are short colour and border changes
already present in the base layer; no motion is needed to understand a page.

## Still open

- Focus-visible rings come from the browser default plus the button shadow; a
  bespoke high-contrast ring would be the next step.
- The CSV import table and the audit diff list are dense on small screens; both
  scroll horizontally rather than reflow.
