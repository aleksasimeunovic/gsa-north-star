// Design note tag (shown when design notes are on, Phase 5).
export type NoteKind = 'tested' | 'north_star' | 'eu_mandate' | 'assumption'

const LABEL: Record<NoteKind, string> = {
  tested: 'Tested (44 sessions)',
  north_star: 'North Star proposal',
  eu_mandate: 'EU mandate',
  assumption: 'Assumption to confirm with the ministry',
}

export function Note({ kind }: { kind: NoteKind }) {
  return <span className="note" data-kind={kind}>{LABEL[kind]}</span>
}
