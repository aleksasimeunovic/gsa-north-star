import { useEffect, useRef, useState } from 'react'
import { en, home, tasks } from '../copy/en'
import { allTasks, newlyRemoved, type ApplicationList, type TaskId, type Work } from '../logic/application'
import { useApp } from './AppContext'

export type Open = TaskId | 'submit' | null

/** What his last answer changed in the application: shown at the top until his next answer. */
export interface AfterAnswer {
  done: TaskId[]
  waiting: TaskId[]
  removed: { taskId: TaskId; work: Work }[]
  /** Tasks his answer added, such as a measure that needs something from him. */
  added: TaskId[]
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function taskTitle(id: TaskId | 'submit', receiptsMissing = false) {
  if (id === 'receipts' && receiptsMissing) return tasks.receiptsMissingTitle
  if (id.startsWith('measure_')) return en.measures[id.slice(8) as keyof typeof en.measures]
  return tasks.title[id]
}

/**
 * Which task is open, where Back goes, and what each answer changed.
 * After an answer the finished task leaves the top, work no longer needed is named with its reason,
 * and the next action opens and takes focus.
 */
export function useApplicationFlow(target: string | null) {
  const { derived, state } = useApp()
  const { list } = derived
  const submitted = !!state.answers.submittedAt
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  const title = (id: TaskId | 'submit') => taskTitle(id, receiptsMissing)
  const all = allTasks(list)

  const [open, setOpen] = useState<Open>(submitted || list.next === 'submit' ? null : list.next)
  const [visited, setVisited] = useState<TaskId[]>([])
  // A task that turned into "waiting for a check" while open stays in place until he carries on.
  const [held, setHeld] = useState<TaskId | null>(null)
  const [after, setAfter] = useState<AfterAnswer | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [focusId, setFocusId] = useState<Open>(null)
  const before = useRef<ApplicationList>(list)
  const pastLength = useRef(state.past.length)
  const key = JSON.stringify(all.map((t) => [t.id, t.status, t.work, t.members]))

  const show = (next: Open, remember = true) => {
    if (remember && open && open !== 'submit' && open !== next) setVisited((v) => [...v, open])
    setHeld(null)
    setOpen(next === 'submit' ? null : next)
    if (next && list.done.some((t) => t.id === next)) setShowDone(true)
    setFocusId(next)
  }
  const toggle = (id: TaskId) => (open === id ? setOpen(null) : show(id))
  const back = visited.length
    ? () => {
        const prev = visited[visited.length - 1]
        setVisited(visited.slice(0, -1))
        show(prev, false)
      }
    : undefined

  /** Forward: the next task that needs him other than the one he's in, then submit. */
  const forward: TaskId | 'submit' = list.todo.find((t) => t.id !== open && t.id !== held)?.id ?? 'submit'
  const openStatus = all.find((t) => t.id === open)?.status
  const forwardIsPrimary = !open || openStatus !== 'action_required'

  // React to each answer: what finished, what is no longer needed, what's new, what's next.
  useEffect(() => {
    const prev = before.current
    before.current = list
    if (prev === list) return
    const undone = state.past.length < pastLength.current
    pastLength.current = state.past.length
    const was = new Map(allTasks(prev).map((t) => [t.id, t.status]))
    if (undone) {
      // Back to the question he took back, open and ready to answer again.
      const reopened = all.find((t) => t.status !== was.get(t.id))
      setAfter(null)
      setAnnounce(home.announce.undone)
      if (reopened) show(reopened.id)
      return
    }
    const change: AfterAnswer = {
      done: all.filter((t) => t.status === 'complete' && was.get(t.id) === 'action_required').map((t) => t.id),
      waiting: all.filter((t) => t.status === 'awaiting_verification' && was.get(t.id) !== 'awaiting_verification').map((t) => t.id),
      removed: newlyRemoved(prev, list),
      added: all.filter((t) => !was.has(t.id) && t.status === 'action_required').map((t) => t.id),
    }
    const any = change.done.length + change.waiting.length + change.removed.length + change.added.length > 0
    setAfter(any ? change : null)

    const words = [
      ...change.done.map((id) => home.announce.done(title(id))),
      ...change.waiting.map((id) => home.announce.waiting(title(id))),
      ...change.removed.map((r) => home.announce.removed(tasks.work[r.work.id])),
    ]
    if (open && open !== 'submit' && was.get(open) === 'action_required') {
      const now = all.find((t) => t.id === open)?.status
      if (now === 'complete' || now === undefined) {
        if (list.next) words.push(home.announce.next(title(list.next)))
        setVisited((v) => [...v, open])
        setOpen(list.next === 'submit' ? null : list.next)
        setFocusId(list.next)
      } else if (now === 'awaiting_verification') setHeld(open)
    }
    if (words.length) setAnnounce(words.join(' '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Arriving from elsewhere (the readiness drawer, Submit) opens the task asked for.
  useEffect(() => {
    if (target?.startsWith('task-') && !submitted) show(target.slice(5) as TaskId | 'submit')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, submitted])

  useEffect(() => {
    if (!focusId) return
    requestAnimationFrame(() => {
      const el = document.getElementById(`task-${focusId}`)
      // After an answer, bring what it changed into view with the next task right under it.
      const panel = document.querySelector<HTMLElement>('.after[data-has-change]')
      const nextIsBelowPanel = panel && el && panel.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
      ;(nextIsBelowPanel ? panel : el)?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
      el?.querySelector<HTMLElement>('.task-title button, .task-go button')?.focus({ preventScroll: true })
    })
    setFocusId(null)
  }, [focusId])

  return { open, held, after, announce, showDone, setShowDone, show, toggle, back, forward, forwardIsPrimary, title }
}

export type Flow = ReturnType<typeof useApplicationFlow>
