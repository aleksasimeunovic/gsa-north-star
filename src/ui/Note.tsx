import { createContext, useContext } from 'react'
import { Badge } from './shadcn/badge'

// Design note tags. Shown only when design notes are on (prototype controls).
// Everything is North Star, so only real distinctions are tagged. 'ai' shows Earl where AI works; Milan never sees it.
export type NoteKind = 'tested' | 'eu_mandate' | 'assumption' | 'ai'

const LABEL: Record<NoteKind, string> = {
  tested: 'Tested (44 sessions)',
  eu_mandate: 'EU mandate',
  assumption: 'Assumption to confirm with the ministry',
  ai: 'AI behind the scenes',
}

export const NotesContext = createContext(false)

export function Note({ kind }: { kind: NoteKind }) {
  if (!useContext(NotesContext)) return null
  return (
    <Badge variant="meta" className="mx-1 align-middle">
      <span className="sr-only">Design note: </span>
      {LABEL[kind]}
    </Badge>
  )
}
