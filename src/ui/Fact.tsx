/** Plain questions, each with its plain answer: for a state he needs to understand at a glance. */
export function Answers({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-3 rounded-xl border p-4">
      {items.map(([q, a]) => (
        <div key={q} className="grid gap-0.5">
          <dt className="text-sm text-muted-foreground">{q}</dt>
          <dd className="font-medium">{a}</dd>
        </div>
      ))}
    </dl>
  )
}
