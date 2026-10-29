import { useRef, useState } from 'react'
import { proto } from '../copy/en'
import type { Role } from '../state/actions'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Drawer } from '../ui/Drawer'
import { Stack } from '../ui/Layout'
import { RadioGroup } from '../ui/RadioGroup'
import { useApp } from './AppContext'

/** Only what a reviewer needs: whose eyes to see it through, and a fresh start. */
export function PrototypeControls() {
  const { state, dispatch, go } = useApp()
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)

  return (
    <>
      <div className="prototype-launcher">
        <Button ref={opener} variant="prototype" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)}>
          {proto.open}
          <Icon name="expand" size="sm" />
        </Button>
      </div>
      <Drawer open={open} title={proto.title} variant="prototype" onClose={() => setOpen(false)} returnFocusTo={opener}>
        <Stack gap="md">
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
