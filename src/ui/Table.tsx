import type { ReactNode } from 'react'

export function Table({ caption, head, rows }: { caption: string; head: string[]; rows: { key: string; cells: ReactNode[] }[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-sm">
        <caption className="px-4 pt-3 pb-2 text-left font-semibold">{caption}</caption>
        <thead>
          <tr className="border-b bg-muted/60">{head.map((h) => <th key={h} scope="col" className="px-4 py-2 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b last:border-0">
              {r.cells.map((c, i) => (i === 0 ? <th key={i} scope="row" className="px-4 py-2 text-left font-medium">{c}</th> : <td key={i} className="px-4 py-2 align-top">{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
