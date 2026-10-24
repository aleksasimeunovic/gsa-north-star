import { useEffect, useRef, useState } from 'react'
import { en, home, steps, tasks } from '../copy/en'
import { allTasks, newlyRemoved, stepOf, type ApplicationList, type StepId, type TaskId, type Work } from '../logic/application'
import { useApp } from './AppContext'

/** What is in the top slot: a task in this part, "check and submit", or nothing (this part is done, or submitted). */
export type Focus = TaskId | 'submit' | null

/** What his last answer changed in the application: shown at the top until his next answer. */
export interface AfterAnswer {
  done: TaskId[]
  waiting: TaskId[]
  removed: { taskId: TaskId; work: Work }[]
  /** Tasks his answer added, such as a measure that needs something from him. */
  added: TaskId[]
}

/** Forward: the next task in this part, or the next part once this one is done. */
export type Forward = { task: TaskId } | { step: StepId } | null

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function taskTitle(id: TaskId | 'submit', receiptsMissing = false) {
  if (id === 'receipts' && receiptsMissing) return tasks.receiptsMissingTitle
  if (id.startsWith('measure_')) return en.measures[id.slice(8) as keyof typeof en.measures]
  return tasks.title[id]
}

/**
 * The application in parts, one part at a time, and one obvious next action inside it. The top slot shows
 * the next task in this part unless he picked another one; after an answer the finished task leaves it,
 * work no longer needed is named with its reason, and the next task in the part takes its place. Once the
 * part is done, he continues to the next. A task that turned into "waiting for a check" stays until he carries on.
 */
export function useApplicationFlow(target: string | null) {
  const { derived, state } = useApp()
  const { list } = derived
  const submitted = !!state.answers.submittedAt
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  const title = (id: TaskId | 'submit') => taskTitle(id, receiptsMissing)
  const all = allTasks(list)

  const [step, setStep] = useState<StepId>(() => (list.next && list.next !== 'submit' ? stepOf(list.next) : 'submit'))
  const [open, setOpen] = useState<TaskId | null>(null)
  const [held, setHeld] = useState<TaskId | null>(null)
  const [after, setAfter] = useState<AfterAnswer | null>(null)
  const [announce, setAnnounce] = useState('')
  const [bring, setBring] = useState(0)

  const index = Math.max(0, list.steps.findIndex((s) => s.id === step))
  const current = list.steps[index]
  const inStep = (id: TaskId | null) => !!id && current.tasks.some((t) => t.id === id)
  const stepTodo = current.tasks.filter((t) => t.status === 'action_required')
  const focus: Focus = submitted ? null : current.id === 'submit' ? 'submit' : inStep(held) ? held : inStep(open) ? open : (stepTodo[0]?.id ?? null)
  const focusTask = all.find((t) => t.id === focus)
  const prevStep = index > 0 ? list.steps[index - 1] : undefined
  /** The next part that still needs him, coming back round to one he skipped, then check and submit. */
  const stepAfter = (i: number) =>
    [...list.steps.slice(i + 1), ...list.steps.slice(0, i)].find((s) => s.left > 0) ?? list.steps.find((s) => s.id === 'submit')
  const nextStep = stepAfter(index)
  /** The next task in this part after the one in front of him, in order, coming round to the start. */
  const todoAfter = (id: Focus) => {
    const order = current.tasks.map((t) => t.id)
    const at = id ? order.indexOf(id as TaskId) : -1
    return [...current.tasks.slice(at + 1), ...current.tasks.slice(0, Math.max(0, at))].find((t) => t.status === 'action_required' && t.id !== id)
  }

  const shown = useRef<Focus>(focus)
  const before = useRef<ApplicationList>(list)
  const pastLength = useRef(state.past.length)
  const key = JSON.stringify(all.map((t) => [t.id, t.status, t.work]))

  /** Put a task in the top slot, in its own part, and bring it into view. */
  const show = (id: TaskId) => {
    setStep(stepOf(id))
    setHeld(null)
    setOpen(id)
    setBring((n) => n + 1)
  }
  /** Open a part: its next task takes the top slot. */
  const goStep = (id: StepId) => {
    setStep(id)
    setOpen(null)
    setHeld(null)
    setAfter(null)
    setBring((n) => n + 1)
  }
  const back = prevStep ? () => goStep(prevStep.id) : undefined

  const nextInStep = todoAfter(focus)
  const forward: Forward = current.id === 'submit' ? null : nextInStep ? { task: nextInStep.id } : nextStep ? { step: nextStep.id } : null
  // Primary only when nothing in the top slot is waiting for his answer (a held task); a finished part has its own button.
  const forwardIsPrimary = !!focusTask && focusTask.status !== 'action_required'

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
    const prevFocus = shown.current
    if (prevFocus && prevFocus !== 'submit' && was.get(prevFocus) === 'action_required') {
      const now = all.find((t) => t.id === prevFocus)?.status
      if (now === 'complete' || now === undefined) {
        // On to the next task in this part; once the part is finished, straight on to the next part that needs him.
        const next = todoAfter(prevFocus)
        const onward = next ? null : stepAfter(index)
        if (next) words.push(home.announce.next(title(next.id)))
        else if (onward) words.push(home.announce.next(steps.name[onward.id]))
        if (onward) setStep(onward.id)
        setOpen(next?.id ?? null)
        setHeld(null)
        setBring((n) => n + 1)
        // Something he did himself (sending a problem on, asking for a check) stays in front of him until he carries on.
      } else if (now === 'awaiting_verification') setHeld(prevFocus)
    }
    if (words.length) setAnnounce(words.join(' '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    shown.current = focus
  })

  // Arriving from elsewhere (the readiness drawer, the receipt) opens the task or part asked for.
  useEffect(() => {
    if (!target || submitted) return
    if (target.startsWith('task-')) show(target.slice(5) as TaskId)
    if (target.startsWith('step-')) goStep(target.slice(5) as StepId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, submitted])

  // Bring what changed and the next action into view, and move focus to the next action.
  useEffect(() => {
    if (!bring) return
    requestAnimationFrame(() => {
      const next = document.getElementById('next-title')
      const panel = document.querySelector<HTMLElement>('.after[data-has-change]')
      ;(panel ?? document.getElementById('step'))?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
      next?.focus({ preventScroll: true })
    })
  }, [bring])

  return { step: current, index, nextStep, focus, focusTask, held, after, announce, show, goStep, back, forward, forwardIsPrimary, title }
}

export type Flow = ReturnType<typeof useApplicationFlow>
