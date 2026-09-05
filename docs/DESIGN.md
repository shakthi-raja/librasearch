# Design system

LibraSearch reads like a library's working records: warm manila paper, near-black ink rules, one tangerine signal, and a grass green for what is on the shelf and in date. Tokens live in `src/styles/tokens.css`; nothing past that file names a colour or a font.

## Type

| Role | Face | Use |
|---|---|---|
| Display | Red Hat Display 600, tracking -0.035em | Page titles and section heads, sentence case |
| Body | Red Hat Text 400 and 500 | Everything else, 16px minimum |
| Figures | Red Hat Mono 400 and 500, tabular | Barcodes, accession numbers, ISBNs, rack codes, dates, amounts |

Labels, table heads, chips and nav links are the body face a step smaller, sentence case, never tracked capitals. Mono is for what gets copied onto a slip, never for a label.

## Colour

| Token | Meaning |
|---|---|
| `--color-paper`, `-2`, `-3` | Ground, raised surface, inset well |
| `--color-ink`, `-2`, `--color-muted` | Text and rules |
| `--color-accent` | The signal: primary action, current selection, focus, a ready hold. Always a fill with ink on it, never text |
| `--color-green` | On the shelf, on time, approved |
| `--color-error` | Validation and failures, always with words, never colour alone |

Dark mode is re-derived per token, never inverted: elevation becomes lightness, shadows become inset rings, the accent drops chroma and gains lightness. The mode follows the system until a reader picks one.

## Surfaces

- A 1px ink rule over a list, `--color-rule` hairlines between rows, a 2px ink rule over a total.
- The notebook card (`.entry`) is the one surface that lifts: loan slips, receipts, the rack card.
- Tables before cards. No card inside a card.

## Controls

Moulded keys at 6px radius, 40px in the app and 48px for a page's main action. One filled primary per screen. Fields carry their label inside the box. Every control has hover, focus-visible, active and disabled states.

## The stack map

`src/components/stack-map` draws the library floor as a survey plan: racks as hatched plots, the reading room in slate, the course reserve edged in tangerine, columns on the structural grid. Rack codes match `copies.rack`, so any screen can pin a copy to its shelf. Pins: disc for on the shelf, diamond for the hold shelf, triangle for on loan.

## Motion

State, not decoration. `--dur-micro` and `--dur-short` for controls; the only orchestrated motion is pins landing on the map, which is skipped under reduced motion.
