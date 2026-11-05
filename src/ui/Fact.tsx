/** Plain questions, each with its plain answer: for a state he needs to understand at a glance. */
export function Answers({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-[var(--gap-item)] rounded-xl border p-4">
      {items.map(([q, a]) => (
        <div key={q} className="grid gap-[var(--gap-text)]">
          <dt className="text-sm text-muted-foreground">{q}</dt>
          <dd className="font-medium">{a}</dd>
        </div>
      ))}
    </dl>
  )
}
