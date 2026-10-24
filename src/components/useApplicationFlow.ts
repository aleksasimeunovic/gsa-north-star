import { useEffect, useRef, useState } from 'react'
import { en, home, tasks } from '../copy/en'
import { allTasks, newlyRemoved, type ApplicationList, type TaskId, type Work } from '../logic/application'
import { useApp } from './AppContext'

/** What is in the top slot: the task in front of him, "ready to submit", or nothing once submitted. */
export type Focus = TaskId | 'submit' | null

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
 * One obvious next action. The top slot shows the next task unless he picked another one; after an
 * answer the finished task leaves it, work no longer needed is named with its reason, and the next
 * action takes its place. A task that turned into "waiting for a check" stays until he carries on.
 */
export function useApplicationFlow(target: string | null) {
  const { derived, state } = useApp()
  const { list } = derived
  const submitted = !!state.answers.submittedAt
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  const title = (id: TaskId | 'submit') => taskTitle(id, receiptsMissing)
  const all = allTasks(list)
  const exists = (id: TaskId | null) => !!id && all.some((t) => t.id === id)

  const [open, setOpen] = useState<TaskId | null>(null)
  const [held, setHeld] = useState<TaskId | null>(null)
  const [visited, setVisited] = useState<TaskId[]>([])
  const [after, setAfter] = useState<AfterAnswer | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [bring, setBring] = useState(0)

  const focus: Focus = submitted ? null : exists(held) ? held : exists(open) ? open : list.next
  const focusTask = all.find((t) => t.id === focus)
  const shown = useRef<Focus>(focus)
  const before = useRef<ApplicationList>(list)
  const pastLength = useRef(state.past.length)
  const key = JSON.stringify(all.map((t) => [t.id, t.status, t.work, t.members]))

  /** Put a task in the top slot and bring it into view. */
  const show = (next: TaskId, remember = true) => {
    if (remember && focus && focus !== 'submit' && focus !== next) setVisited((v) => [...v, focus])
    setHeld(null)
    setOpen(next === list.next ? null : next)
    setBring((n) => n + 1)
  }
  const back = visited.length
    ? () => {
        const prev = visited[visited.length - 1]
        setVisited(visited.slice(0, -1))
        show(prev, false)
      }
    : undefined

  /** Forward: the next task that needs him other than the one in front of him, then submit. */
  const forward: TaskId | 'submit' = list.todo.find((t) => t.id !== focus)?.id ?? 'submit'
  const forwardIsPrimary = !focusTask || focusTask.status !== 'action_required'

  // React to each answer: what finished, what is no longer needed, what's new, what's next.
  useEffect(() => {
    const prev = before.current
    before.current = list
    if (prev === list) return
    const undone = state.past.length < pastLength.current
    pastLength.current = state.past.length
    const was = new Map(allTasks(prev).map((t) => [t.id, t.status]))
    if (undone) {
      // Back to the question he took back, in the top slot and ready to answer again.
      const reopened = all.find((t) => t.status !== was.get(t.id))
      setAfter(null)
      setAnnounce(home.announce.undone)
      if (reopened) show(reopened.id, false)
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
    const prevFocus = shown.current
    if (prevFocus && prevFocus !== 'submit' && was.get(prevFocus) === 'action_required') {
      const now = all.find((t) => t.id === prevFocus)?.status
      if (now === 'complete' || now === undefined) {
        if (list.next) words.push(home.announce.next(title(list.next)))
        setVisited((v) => [...v, prevFocus])
        setOpen(null)
        setHeld(null)
        setBring((n) => n + 1)
      } else if (now === 'awaiting_verification') setHeld(prevFocus)
    }
    if (words.length) setAnnounce(words.join(' '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    shown.current = focus
  })

  // Arriving from elsewhere (the readiness drawer, Submit) puts the task asked for in the top slot.
  useEffect(() => {
    if (target?.startsWith('task-') && !submitted) {
      const id = target.slice(5)
      if (id !== 'submit') show(id as TaskId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, submitted])

  // Bring what changed and the next action into view, and move focus to the next action.
  useEffect(() => {
    if (!bring) return
    requestAnimationFrame(() => {
      const next = document.getElementById('next-title')
      const panel = document.querySelector<HTMLElement>('.after[data-has-change]')
      ;(panel ?? document.getElementById('next'))?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
      next?.focus({ preventScroll: true })
    })
  }, [bring])

  return { focus, focusTask, held, after, announce, showDone, setShowDone, show, back, forward, forwardIsPrimary, title }
}

export type Flow = ReturnType<typeof useApplicationFlow>
