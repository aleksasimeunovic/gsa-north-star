import { useState, type ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './shadcn/collapsible'
import { Icon } from './Icon'

export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
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
