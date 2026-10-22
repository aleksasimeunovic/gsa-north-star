import { useRef, useState } from 'react'
import { en, proto } from '../copy/en'
import { SCENARIO_IDS } from '../data/scenarios'
import type { Role } from '../state/actions'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { Stack, Text } from '../ui/Layout'
import { RadioGroup } from '../ui/RadioGroup'
import { Toggle } from '../ui/Toggle'
import { useApp } from './AppContext'

/** Clearly separate from GSA: scenario, role, design notes, reset. */
export function PrototypeControls() {
  const { state, dispatch, go } = useApp()
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)

  return (
    <>
      <div className="prototype-launcher">
        <Button ref={opener} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)}>
          {proto.open}
          <svg className="chevron" data-open={open || undefined} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Button>
      </div>
      <Drawer open={open} title={proto.title} variant="prototype" onClose={() => setOpen(false)} returnFocusTo={opener}>
        <Stack gap="md">
          <Text variant="strong">{proto.notPart}</Text>
          <div>
            <RadioGroup
              legend={proto.scenario}
              value={state.scenarioId}
              options={SCENARIO_IDS.map((id) => ({ value: id, label: en.scenarios[id] }))}
              onChange={(scenarioId) => {
                dispatch({ type: 'set_scenario', scenarioId })
                go('welcome')
              }}
            />
          </div>
          <RadioGroup<Role>
            legend={proto.signInAs}
            value={state.role}
            options={[
              { value: 'farmer', label: proto.milan },
              { value: 'advisor', label: proto.jelena },
            ]}
            onChange={(role) => {
              dispatch({ type: 'set_role', role })
              go(role === 'advisor' ? 'queue' : 'welcome')
            }}
          />
          <Toggle label={proto.notes} checked={state.prototype.showNotes} onChange={(show) => dispatch({ type: 'set_notes', show })} />
          <div>
            <Button
              onClick={() => {
                dispatch({ type: 'reset' })
                go('welcome')
              }}
            >
              {proto.reset}
            </Button>
          </div>
        </Stack>
      </Drawer>
    </>
  )
}
