import {
  ArrowRight, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, CircleAlert, Clock, FlaskConical, ListChecks,
  Maximize2, Minimize2, Minus, Plus, ScanSearch, Undo2, X, type LucideIcon,
} from 'lucide-react'
import { useDensity } from './Density'

/**
 * Icons by meaning, not by picture, so the set can be swapped without touching components.
 * Always decorative: the meaning is said in text next to it.
 */
const ICONS = {
  complete: CheckCircle2,
  action_required: CircleAlert,
  awaiting_verification: Clock,
  check: Check,
  todo: Circle,
  now: ArrowRight,
  change: ScanSearch,
  choice: ListChecks,
  same: Check,
  added: Plus,
  removed: Minus,
  undo: Undo2,
  expand: ChevronDown,
  disclose: ChevronRight,
  close: X,
  larger: Maximize2,
  smaller: Minimize2,
  prototype: FlaskConical,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

export function Icon({ name, size }: { name: IconName; size?: 'sm' | 'md' | 'lg' }) {
  const density = useDensity()
  const px = { sm: 14, md: density === 'compact' ? 16 : 18, lg: 22 }[size ?? 'md']
  const Svg = ICONS[name]
  return <Svg className="icon" data-icon={name} width={px} height={px} strokeWidth={2} aria-hidden="true" focusable="false" />
}
