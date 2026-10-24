/** A thin bar for how far along something is. Decorative: the same progress is always said in words too. */
export function Progress({ value, max }: { value: number; max: number }) {
  return (
    <div className="progress" aria-hidden="true">
      <span className="progress-fill" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}
