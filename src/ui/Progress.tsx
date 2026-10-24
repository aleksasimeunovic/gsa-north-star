import { Progress as Base } from './shadcn/progress'

/** A thin bar for how far along something is. Decorative: the same progress is always said in words too. */
export function Progress({ value, max }: { value: number; max: number }) {
  return <Base aria-hidden="true" value={Math.min(100, (value / max) * 100)} />
}
