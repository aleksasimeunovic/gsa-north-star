import {
  ArrowRight, ArrowUpRight, BadgeCheck, Baby, Beef, Calendar, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, Copy, CircleAlert, CircleCheck,
  CircleX, Clock, History, FileText, FlaskConical, HandCoins, IdCard, Info, Landmark, ListChecks, Map, Maximize2, Minimize2, Minus,
  PencilLine, PiggyBank, Plus, Receipt, Satellite, Send, Sprout, Target, Undo2, Upload, Wheat, X, type LucideIcon,
} from 'lucide-react'
import { useDensity } from './Density'

/**
 * Icons by meaning, not by picture, so the set can be swapped without touching components.
 * Always decorative: the meaning is said in text next to it.
 */
const ICONS = {
  // Status
  complete: CheckCircle2,
  action_required: CircleAlert,
  awaiting_verification: Clock,
  kept: History,
  error: CircleX,
  warning: CircleAlert,
  info: Info,
  // Kinds of work
  change: Satellite,
  choice: ListChecks,
  same: BadgeCheck,
  // Answers and actions
  yes: CircleCheck,
  no: CircleX,
  check: Check,
  todo: Circle,
  now: ArrowRight,
  added: Plus,
  edit: PencilLine,
  removed: Minus,
  undo: Undo2,
  upload: Upload,
  expand: ChevronDown,
  disclose: ChevronRight,
  close: X,
  copy: Copy,
  larger: Maximize2,
  smaller: Minimize2,
  prototype: FlaskConical,
  deadline: Calendar,
  // Parts of the application and what they're about
  details: IdCard,
  bank: Landmark,
  animals: Beef,
  pigs: PiggyBank,
  calvings: Baby,
  land: Wheat,
  meadow: Sprout,
  map: Map,
  measures: HandCoins,
  goal: Target,
  details_open: ArrowUpRight,
  documents: FileText,
  receipt: Receipt,
  submit: Send,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

// Success and warning are filled, so they read as a state at a glance; the mark inside stays white.
const FILLED: Partial<Record<IconName, string>> = {
  complete: 'm8.5 12.5 2.5 2.5 4.5-5',
  action_required: 'M12 7.5v5.5M12 16.5h.01',
  // Readiness severities: a cross stops him, a mark asks him to look, an i is good to know.
  error: 'm9 9 6 6M15 9l-6 6',
  warning: 'M12 7.5v5.5M12 16.5h.01',
  info: 'M12 11v5.5M12 7.5h.01',
}

export function Icon({ name, size, className }: { name: IconName; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const density = useDensity()
  const px = { sm: 16, md: density === 'compact' ? 16 : 20, lg: 24 }[size ?? 'md']
  const mark = FILLED[name]
  if (mark) {
    return (
      <svg className={className} data-icon={name} width={px} height={px} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d={mark} fill="none" stroke="#fff" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  const Svg = ICONS[name]
  return <Svg className={className} data-icon={name} width={px} height={px} strokeWidth={1.75} aria-hidden="true" focusable="false" />
}
