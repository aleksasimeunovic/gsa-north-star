import type { ReactNode } from 'react'

export function Table({ caption, head, rows }: { caption: string; head: string[]; rows: { key: string; cells: ReactNode[] }[] }) {
  return (
    <table className="table">
      <caption>{caption}</caption>
      <thead>
        <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            {r.cells.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
