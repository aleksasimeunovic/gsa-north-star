# Spacing

One chain of relations, defined once in `src/index.css`. Components never use a bare number for a gap, and
never a `--space-*` step as a gap: they name the relation.

| Relation | Token | Value | Used for |
|---|---|---|---|
| Row | `--gap-row` | 2 px | Lines of one record; rows of a list that each have their own hover |
| Snug | `--gap-snug` | 4 px | Segments of one control; a mark and its caption |
| Inline | `--gap-inline` | 8 px | An icon and its words; buttons side by side or stacked |
| Heading to body | `--gap-heading` | 8 px | A heading and the text it introduces; a checkbox's label and hint |
| Label to control | `--gap-label` | 8 px | A label or legend and its control |
| Inside a list | `--gap-list` | 12 px | Items of one list; facts in a card |
| Inside a group | `--gap-group` | 16 px | Things that make one group: the evidence and its question, the fields of a form |
| Object to object | `--gap-object` | 16 px (phone 12) | Card to card, panel to panel, the task and the part's side column |
| Section to section | `--gap-section` | 24 px | The sections of a card, a side panel or a page |

Closer means more related: a heading sits nearer its own body (8) than the next item (12), items sit nearer
each other than groups (16), and sections stand apart (24).

Inside a surface: `--stage-pad` (the next action), `--panel-pad` (supporting panels), `--space-*` (4 px scale)
for padding of rows and controls only. `Stack` takes the relation (`heading`, `sm` = inline, `list`, `md` =
group, `lg` = section).

Raw pixel values left in `src/styles.css` are optical alignments, not spacing: an icon nudged 2 px to sit on a
line of text, a handle's hit area, chips' tight padding, offsets below the sticky header.
