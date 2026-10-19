import type { Scenario } from '../data/scenarios'
import type { Answers, Role } from '../state/actions'
import { type ChangeId, detectChanges, isAnswered } from './changes'
import { type Item, type ItemId, type Status, type StepId, worstStatus } from './status'

/**
 * confirm: unchanged since last year, one confirmation.
 * open_on_change: opens on the change, other items still shown.
 * full: nothing to start from (first year), or the submit step.
 */
export type StepMode = 'confirm' | 'open_on_change' | 'full'

export interface Step {
  id: StepId
  mode: StepMode
  status: Status
  focusItemId?: ItemId
  itemIds: ItemId[]
}

export interface Wizard {
  steps: Step[]
  density: 'comfortable' | 'compact'
  progress: { total: number; done: number }
}

function buildStep(id: StepId, items: Item[], firstYear: boolean): Step {
  const own = items.filter((i) => i.stepId === id)
  const status = worstStatus(own.map((i) => i.status))
  const open = own.find((i) => i.status === 'action_required') ?? own.find((i) => i.status === 'awaiting_verification')
  const mode: StepMode = firstYear ? 'full' : open ? 'open_on_change' : 'confirm'
  return { id, mode, status, focusItemId: open?.id, itemIds: own.map((i) => i.id) }
}

/**
 * The wizard is generated around the farm, not fixed around the process.
 * - Steps the farm has nothing for are hidden (no animals, no herd step).
 * - Unchanged steps shrink to one confirmation; changed ones open on the change.
 * - Progress counts only the steps he has.
 * - Advisor: same steps, denser, what needs action first.
 */
export function generateWizard(s: Scenario, a: Answers, items: Item[], role: Role): Wizard {
  const ids: StepId[] = ['herd', 'land', 'everything_else']
  const steps = ids
    .filter((id) => items.some((i) => i.stepId === id))
    .map((id) => buildStep(id, items, s.firstYear))

  if (role === 'advisor') {
    const rank: Record<Status, number> = { action_required: 0, awaiting_verification: 1, complete: 2 }
    steps.sort((x, y) => rank[x.status] - rank[y.status])
  }

  const submitted = a.submittedAt !== null
  steps.push({ id: 'submit', mode: 'full', status: submitted ? 'complete' : 'action_required', itemIds: [] })

  // Done = nothing left to act on and he has moved past the step.
  const done = steps.filter((st) =>
    st.id === 'submit' ? submitted : st.status !== 'action_required' && a.confirmedSteps.includes(st.id),
  ).length

  return {
    steps,
    density: role === 'advisor' ? 'compact' : 'comfortable',
    progress: { total: steps.length, done },
  }
}

// The tested 8-step FAO wizard, for the compare view.
export const TESTED_STEPS = [
  'general_data',
  'measures',
  'parcels',
  'animal_measures',
  'attachments',
  'declarations',
  'conditionality',
  'summary',
] as const
export type TestedStepId = (typeof TESTED_STEPS)[number]

export type Fate =
  | 'folded_read_only' // records, read-only, confirm once
  | 'kept_fitting_first' // last year's confirmed, fitting ones first
  | 'opens_on_change'
  | 'one_confirmation'
  | 'asked'
  | 'asked_only_if_missing'
  | 'signed_once'
  | 'left_out'
  | 'replaced_by_readiness'
  | 'hidden_no_animals'
  | 'asked_in_full'

export interface CompareRow {
  tested: TestedStepId
  becomes: StepId | null
  fate: Fate
}

/** What happened to each tested step, given the steps Milan has now. */
export function compareMapping(s: Scenario, wizard: Wizard): CompareRow[] {
  const step = (id: StepId) => wizard.steps.find((st) => st.id === id)
  const herd = step('herd')
  const land = step('land')
  const docsMissing = step('everything_else')?.focusItemId === 'documents'
  const modeFate = (st: Step | undefined, whenConfirm: Fate): Fate =>
    !st ? 'hidden_no_animals' : st.mode === 'full' ? 'asked_in_full' : st.mode === 'open_on_change' ? 'opens_on_change' : whenConfirm

  return [
    { tested: 'general_data', becomes: 'everything_else', fate: 'folded_read_only' },
    { tested: 'measures', becomes: 'everything_else', fate: s.firstYear ? 'asked_in_full' : 'kept_fitting_first' },
    { tested: 'parcels', becomes: 'land', fate: modeFate(land, 'one_confirmation') },
    { tested: 'animal_measures', becomes: herd ? 'herd' : null, fate: modeFate(herd, 'one_confirmation') },
    { tested: 'attachments', becomes: 'everything_else', fate: docsMissing ? 'asked' : 'asked_only_if_missing' },
    { tested: 'declarations', becomes: 'submit', fate: 'signed_once' },
    { tested: 'conditionality', becomes: null, fate: 'left_out' },
    { tested: 'summary', becomes: null, fate: 'replaced_by_readiness' },
  ]
}

// Which open change each tested step is waiting on before it can fold into its new step.
const WAITS_ON: Partial<Record<TestedStepId, ChangeId[]>> = {
  parcels: ['river', 'road'],
  animal_measures: ['herd'],
}

export interface AssemblyRow extends CompareRow {
  waitingOn: ChangeId[]
}

/**
 * Live preview of the application while he answers: tested steps still waiting on an
 * answer stay as they were; the rest have already folded into their new step.
 */
export function assembly(s: Scenario, a: Answers, compare: CompareRow[]): AssemblyRow[] {
  const open = detectChanges(s).filter((c) => !isAnswered(c, a))
  return compare.map((row) => ({ ...row, waitingOn: (WAITS_ON[row.tested] ?? []).filter((c) => open.includes(c)) }))
}
