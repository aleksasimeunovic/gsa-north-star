# Spacing

One chain of relations, defined once in `src/index.css`. Components never use a bare number for a gap.

| Relation | Token | Value | Used for |
|---|---|---|---|
| Row | `--gap-row` | 2 px | Rows of a list that each have their own hover (drawer, outline, part summary) |
| Text | `--gap-text` | 6 px | A title and the text it introduces; a checkbox's label and hint |
| Label | `--gap-label` | 8 px | A label or legend and its control |
| Inline | `--gap-inline` | 8 px | An icon and its words; buttons side by side or stacked; a problem's icon and message |
| Item | `--gap-item` | 12 px | Rows or options in a list; facts in a card |
| Group | `--gap-group` | 16 px | Groups in a block; panels in a column (the part summaries, the side panels) |
| Section | `--gap-section` | 24 px (phone 24) | The parts of a card or a page |

Inside a surface: `--stage-pad` (the next action), `--panel-pad` (supporting panels), `--space-*` (4 px scale) for
rows and controls. `Stack` takes the relation (`text`, `sm` = inline, `item`, `md` = group, `lg` = section).

Raw pixel values left in `src/styles.css` are optical alignments, not spacing: an icon nudged 2 px to sit on a
line of text, a handle's hit area, chips' tight padding, offsets below the sticky header.
