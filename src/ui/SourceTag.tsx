import type { Source } from '../logic/farm'

const ICON: Record<Source, string> = { records: '○', confirmed: '✓', checking: '◌' }

/** Where a fact comes from: text plus an icon shape, never colour alone. */
export function SourceTag({ source, children }: { source: Source; children: string }) {
  return (
    <span className="source" data-source={source}>
      <span aria-hidden="true" className="source-icon">{ICON[source]}</span> {children}
    </span>
  )
}
