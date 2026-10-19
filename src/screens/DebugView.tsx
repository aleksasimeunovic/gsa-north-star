// Phase 1 only: plain lists to check the logic. Replaced by real screens from Phase 2.
import type { Dispatch } from 'react'
import { CROPS, SCENARIO_IDS, type Crop, type ScenarioId } from '../data/scenarios'
import { en, formatDinars, formatHa, itemLabel } from '../copy/en'
import type { derive } from '../logic/derive'
import { lineAtFraction, splitPolygon } from '../logic/geometry'
import { daysLeft } from '../logic/readiness'
import type { Action, AppState, YesNo } from '../state/actions'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'

interface Props {
  state: AppState
  derived: ReturnType<typeof derive>
  dispatch: Dispatch<Action>
}

function YesNoGroup({ legend, value, onChange }: { legend: string; value: YesNo | null; onChange: (v: YesNo) => void }) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      {(['yes', 'no'] as const).map((v) => (
        <label key={v}>
          <input type="radio" name={legend} checked={value === v} onChange={() => onChange(v)} />
          {v === 'yes' ? 'Yes' : 'No'}
        </label>
      ))}
    </fieldset>
  )
}

export function DebugView({ state, derived, dispatch }: Props) {
  const { scenario, items, wizard, compare, readiness, estimate } = derived
  const a = state.answers
  const river = scenario.fields.find((f) => f.id === 'river')!
  const splitT = a.river.split ? (a.river.split.line[0].y - 0) / 120 : 0.5
  const split = a.river.split ? splitPolygon(river.polygon, a.river.split.line[0], a.river.split.line[1]) : null

  const setSplit = (t: number, crops: [Crop | null, Crop | null]) =>
    dispatch({ type: 'set_split', split: { line: lineAtFraction(river.polygon, t), crops } })
  const crops = a.river.split?.crops ?? [null, null]

  return (
    <>
      <h1>Debug view</h1>
      <p className="muted">
        Phase 1. Window {scenario.window.opens} to {scenario.window.closes}, {en.daysLeft(daysLeft(scenario.today, scenario.window.closes))}.
      </p>

      <div className="grid">
        <section className="box" aria-labelledby="answers-h">
          <h2 id="answers-h">Answers</h2>
          <label>
            Scenario
            <select value={state.scenarioId} onChange={(e) => dispatch({ type: 'set_scenario', scenarioId: e.target.value as ScenarioId })}>
              {SCENARIO_IDS.map((id) => (
                <option key={id} value={id}>{en.scenarios[id]}</option>
              ))}
            </select>
          </label>
          <label>
            Role
            <select value={state.role} onChange={(e) => dispatch({ type: 'set_role', role: e.target.value as AppState['role'] })}>
              <option value="farmer">Milan</option>
              <option value="advisor">Jelena</option>
            </select>
          </label>

          {scenario.herd && (
            <>
              <YesNoGroup
                legend={`Do you have ${scenario.herd.registryCount} cattle now?`}
                value={a.herd.answer}
                onChange={(answer) => dispatch({ type: 'answer_herd', answer })}
              />
              {a.herd.answer === 'no' && (
                <label>
                  How many cattle do you have today?
                  <input
                    type="number"
                    min={0}
                    value={a.herd.ownCount ?? ''}
                    onChange={(e) => dispatch({ type: 'set_herd_count', count: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                </label>
              )}
            </>
          )}

          {!scenario.firstYear && (
            <>
              <YesNoGroup
                legend="Are you growing two crops in the river field?"
                value={a.river.answer}
                onChange={(answer) => dispatch({ type: 'answer_river', answer })}
              />
              {a.river.answer === 'yes' && (
                <fieldset>
                  <legend>Split (slider stand-in)</legend>
                  <label>
                    Line position
                    <input type="range" min={0} max={1} step={0.05} value={splitT} onChange={(e) => setSplit(Number(e.target.value), crops)} />
                  </label>
                  {split && <p>Parts: {split.areasHa.map(formatHa).join(' and ')}</p>}
                  {[0, 1].map((i) => (
                    <label key={i}>
                      Crop for part {i + 1}
                      <select
                        value={crops[i] ?? ''}
                        onChange={(e) => {
                          const next: [Crop | null, Crop | null] = [...crops]
                          next[i] = (e.target.value || null) as Crop | null
                          setSplit(splitT, next)
                        }}
                      >
                        <option value="">Choose</option>
                        {CROPS.map((c) => <option key={c} value={c}>{en.crops[c]}</option>)}
                      </select>
                    </label>
                  ))}
                </fieldset>
              )}
              {a.river.answer === 'no' && (
                <p>
                  <Button onClick={() => dispatch({ type: 'river_no_option', option: 'redraw' })}>Redraw</Button>{' '}
                  <Button onClick={() => dispatch({ type: 'river_redrawn' })}>Mark redrawn</Button>{' '}
                  <Button onClick={() => dispatch({ type: 'river_no_option', option: 'field_check' })}>Ask for a field check</Button>
                </p>
              )}
              <YesNoGroup
                legend="Did the road take part of this field?"
                value={a.road.answer}
                onChange={(answer) => dispatch({ type: 'answer_road', answer })}
              />
              {a.road.answer === 'no' && (
                <Button onClick={() => dispatch({ type: 'request_road_correction' })}>Ask for a correction</Button>
              )}
            </>
          )}

          <p>
            {wizard.steps.filter((s) => s.id !== 'submit').map((s) => (
              <Button key={s.id} onClick={() => dispatch({ type: 'confirm_step', stepId: s.id })}>Confirm {en.steps[s.id]}</Button>
            ))}
          </p>
          <p>
            <Button onClick={() => dispatch({ type: 'attach_document', documentId: 'input_receipts' })}>Attach receipts</Button>{' '}
            <Button onClick={() => dispatch({ type: 'renew' })}>Renew</Button>{' '}
            <Button variant="primary" disabled={!readiness.canSubmit} onClick={() => dispatch({ type: 'submit' })}>Submit</Button>{' '}
            <Button onClick={() => dispatch({ type: 'reset' })}>Reset</Button>
          </p>
        </section>

        <section className="box" aria-labelledby="derived-h">
          <h2 id="derived-h">Derived</h2>
          <p aria-live="polite">
            <strong>{en.applicationState[readiness.state]}</strong>
            {readiness.state === 'action_required' && <> · {en.thingsNeedAction(readiness.blockers.length)}</>}
          </p>
          <p className="muted">
            Complete {readiness.counts.complete} · Needs action {readiness.counts.action_required} · Awaiting {readiness.counts.awaiting_verification}
          </p>

          <h3>Steps ({wizard.progress.done} of {wizard.progress.total} done, {wizard.density})</h3>
          <ol>
            {wizard.steps.map((s) => (
              <li key={s.id}>
                {en.steps[s.id]}: {en.stepMode[s.mode]} <StatusBadge status={s.status} />
                {s.focusItemId && <span className="muted"> opens on {itemLabel(s.focusItemId)}</span>}
              </li>
            ))}
          </ol>

          <h3>Items</h3>
          <table>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <th scope="row">{itemLabel(i.id)}</th>
                  <td><StatusBadge status={i.status} /></td>
                  <td>
                    {en.itemDetail[i.detail]}
                    {i.conflict && <div>Record {i.conflict.record} | You declared {i.conflict.his}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>{en.estimate.title}</h3>
          <p>{en.estimate.about(formatDinars(estimate.aboutDinars))} <span className="muted">({formatDinars(estimate.totalDinars)})</span></p>
          <ul>
            {estimate.changes.map((c) => (
              <li key={c.reason}>{en.impact[c.reason](formatHa(c.areaHa), formatDinars(-c.aboutDinars))}</li>
            ))}
          </ul>
          <p className="muted">
            {formatHa(estimate.assumptions.eligibleAreaHa)} × {formatDinars(estimate.assumptions.rates.perHa)}, {estimate.assumptions.cowsCalved} cows calved × {formatDinars(estimate.assumptions.rates.perCow)}. {en.estimate.caveat}
          </p>
        </section>
      </div>

      <section className="box" aria-labelledby="compare-h">
        <h2 id="compare-h">Compare with the tested 8-step wizard</h2>
        <table>
          <tbody>
            {compare.map((c) => (
              <tr key={c.tested}>
                <th scope="row">{en.testedSteps[c.tested]}</th>
                <td>{c.becomes ? en.steps[c.becomes] : '-'}</td>
                <td>{en.fate[c.fate]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="box" aria-labelledby="history-h">
        <h2 id="history-h">History</h2>
        <ol>
          {state.history.slice(-10).map((h, i) => (
            <li key={i}>{h.at.slice(11, 19)} {h.actor}: {h.action}</li>
          ))}
        </ol>
      </section>
    </>
  )
}
