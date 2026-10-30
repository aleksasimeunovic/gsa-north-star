import { useState, type ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './shadcn/collapsible'
import { Icon } from './Icon'

/** Opens on request; a parent that needs to open it passes `open` and `onOpenChange`. */
export function Disclosure({ label, children, open, onOpenChange }: { label: string; children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [own, setOwn] = useState(false)
  return (
    <Collapsible open={open ?? own} onOpenChange={onOpenChange ?? setOwn}>
      <CollapsibleTrigger className="group inline-flex min-h-11 cursor-pointer items-center gap-2 text-left font-medium text-foreground">
        <span className="text-muted-foreground transition-transform group-data-[state=open]:rotate-90">
          <Icon name="disclose" />
        </span>
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pl-7">{children}</CollapsibleContent>
    </Collapsible>
  )
}
