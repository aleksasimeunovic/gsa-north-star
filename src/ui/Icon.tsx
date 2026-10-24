import {
  ArrowRight, BadgeCheck, Baby, Beef, Calendar, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, CircleAlert, CircleCheck,
  CircleX, Clock, Database, FileText, FlaskConical, HandCoins, IdCard, Landmark, ListChecks, Map, Maximize2, Minimize2, Minus,
  PiggyBank, Plus, Receipt, Satellite, Send, Sprout, Undo2, Upload, Users, Wheat, X, type LucideIcon,
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
  records: Database,
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
  removed: Minus,
  undo: Undo2,
  upload: Upload,
  expand: ChevronDown,
  disclose: ChevronRight,
  close: X,
  larger: Maximize2,
  smaller: Minimize2,
  prototype: FlaskConical,
  deadline: Calendar,
  // Parts of the application and what they're about
  details: IdCard,
  bank: Landmark,
  household: Users,
  animals: Beef,
  pigs: PiggyBank,
  calvings: Baby,
  land: Wheat,
  meadow: Sprout,
  map: Map,
  measures: HandCoins,
  documents: FileText,
  receipt: Receipt,
  submit: Send,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

export function Icon({ name, size, className }: { name: IconName; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const density = useDensity()
  const px = { sm: 14, md: density === 'compact' ? 16 : 18, lg: 22 }[size ?? 'md']
  const Svg = ICONS[name]
  return <Svg className={className} data-icon={name} width={px} height={px} strokeWidth={1.75} aria-hidden="true" focusable="false" />
}
