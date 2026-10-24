import { Checkbox } from './Checkbox'

/** An on/off setting, shown as a checkbox with role switch semantics kept simple. */
export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <Checkbox label={label} checked={checked} onChange={onChange} />
}
