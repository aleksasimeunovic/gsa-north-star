import type { RefObject } from 'react'
import { en, finish, itemLabel, ui } from '../copy/en'
import type { Status } from '../logic/status'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { Stack, Text } from '../ui/Layout'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { itemTarget } from './targets'

const ORDER: Status[] = ['action_required', 'awaiting_verification', 'complete']

export function ReadinessDrawer({ open, onClose, returnFocusTo }: { open: boolean; onClose: () => void; returnFocusTo: RefObject<HTMLElement> }) {
  const { derived, go } = useApp()
  const { items, readiness, changes } = derived

  return (
    <Drawer open={open} title={ui.readiness.drawerTitle} onClose={onClose} returnFocusTo={returnFocusTo}>
      <Stack gap="md">
        {readiness.renewalNeeded && (
          <section aria-labelledby="group-renewal">
            <h3 id="group-renewal"><StatusBadge status="action_required" /></h3>
            <Text>{ui.welcome.notRenewed}</Text>
            <Button
              variant="link"
              onClick={() => {
                onClose()
                go('renewal')
              }}
            >
              {finish.renewal.title}
            </Button>
          </section>
        )}
        {ORDER.map((status) => {
          const group = items.filter((i) => i.status === status)
          return (
            <section key={status} aria-labelledby={`group-${status}`}>
              <h3 id={`group-${status}`}>
                <StatusBadge status={status} /> <span className="count">({group.length})</span>
              </h3>
              <Text variant="small">{ui.readiness.groupHint[status]}</Text>
              {group.length === 0 ? (
                <Text variant="secondary">{ui.readiness.empty}</Text>
              ) : (
                <ul className="item-list">
                  {group.map((i) => (
                    <li key={i.id}>
                      <Text variant="strong" as="span">{itemLabel(i.id)}</Text>
                      <Text variant="small">{en.itemDetail[i.detail]}</Text>
                      {status !== 'complete' && (
                        <Button
                          variant="link"
                          onClick={() => {
                            onClose()
                            go(...itemTarget(i, changes))
                          }}
                        >
                          {ui.goToIt}<span className="visually-hidden">: {itemLabel(i.id)}</span>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </Stack>
    </Drawer>
  )
}
