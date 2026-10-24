// All scenario facts (CLAUDE.md section 7). Components never hardcode these.

import type { Placement } from '../logic/geo'

export type Point = { x: number; y: number }
// Coordinates are metres in a local grid, so area in m² / 10,000 = hectares.
export type Polygon = Point[]

export type Crop = 'wheat' | 'maize' | 'sunflower' | 'grassland' | 'barley' | 'soya'
export const CROPS: Crop[] = ['wheat', 'maize', 'sunflower', 'barley', 'soya', 'grassland']

export type FieldId = 'river' | 'road' | 'upper' | 'meadow' | 'house'

export type FieldSignal =
  | { kind: 'satellite_difference'; flagPolygon: Polygon; flagHa: number }
  | { kind: 'road_strip'; stripPolygon: Polygon; stripHa: number }
  /** Last year's drawing runs into a neighbour's declared field. */
  | { kind: 'overlap'; neighbourPolygon: Polygon; overlapPolygon: Polygon; overlapHa: number }

export interface Field {
  id: FieldId
  name: string
  areaHa: number
  cropLastYear: Crop
  arable: boolean
  polygon: Polygon
  signal?: FieldSignal
}

/** Reference layers on the map. */
export interface LandShape {
  id: string
  label: string
  polygon: Polygon
}

export type MeasureId =
  | 'plant_production'
  | 'cows_raising_calves'
  | 'fertiliser'
  | 'diesel'
  | 'certified_seed'
  | 'insurance'
  | 'breeding_cattle'
  | 'insemination'
  | 'green_cover'
  | 'irrigation'
  | 'organic'
  | 'milk'

/**
 * What a measure needs. 'auto' is something GSA already has from a record; the rest he adds.
 * `when` shows a requirement only after a given answer to another one.
 */
export type RequirementKind = 'auto' | 'upload' | 'number' | 'text' | 'longtext' | 'choice' | 'fields' | 'confirm'
export interface Requirement {
  id: string
  kind: RequirementKind
  options?: string[]
  when?: { id: string; value: string }
  /** A choice value that rules the measure out, so GSA can say so at once. */
  blocks?: string
}

export interface Measure {
  id: MeasureId
  /** Only the two real 2026 rates are numbers; the rest are worked out after checks. */
  unit?: 'ha' | 'cow_calved'
  rateDinars?: number
  fits: boolean
  lastYear: boolean
  requirements: Requirement[]
}

export interface Document {
  id: 'input_receipts'
  attached: boolean
  /** Placeholder names and dates, so he can see what he confirms. */
  files: { name: string; date: string }[]
}

/** Other animals in the registry that weren't declared last year. */
export interface Pigs {
  lastYearDeclared: number
  registryCount: number
}

export interface Herd {
  lastYearDeclared: number | null
  registryCount: number
  cowsCalved: number
  calvingPeriod: { from: string; to: string }
}

/** Records GSA brings in. Read-only for Milan. */
export interface GeneralData {
  holder: string
  place: string
}

export type ScenarioId = 'second_year' | 'second_year_not_renewed' | 'missing_document'

export interface Scenario {
  id: ScenarioId
  renewed: boolean
  window: { opens: string; closes: string }
  // Prototype clock (assumption), so "days left" means something.
  today: string
  generalData: GeneralData
  /** Where the fields sit on the satellite photo: north of a real road west of Bečanj (prototype placement). */
  place: Placement
  herd: Herd | null
  pigs: Pigs | null
  fields: Field[]
  /** Land the government has registered as farmland (physical blocks). Fields stay inside it. */
  blocks: LandShape[]
  /** Land register plots (cadastral parcels). Reference only, hidden by default. */
  parcels: LandShape[]
  measures: Measure[]
  documents: Document[]
}

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
]

const FIELDS: Field[] = [
  {
    id: 'river',
    name: 'River field',
    areaHa: 2.4,
    cropLastYear: 'wheat',
    arable: true,
    polygon: rect(0, 0, 200, 120),
    // The lower half floods every spring; satellite sees it differently.
    signal: { kind: 'satellite_difference', flagPolygon: rect(0, 60, 200, 60), flagHa: 1.2 },
  },
  {
    id: 'road',
    name: 'Road field',
    areaHa: 1.8,
    cropLastYear: 'maize',
    arable: true,
    polygon: rect(220, 0, 150, 120),
    signal: { kind: 'road_strip', stripPolygon: rect(220, 112, 150, 8), stripHa: 0.12 },
  },
  {
    id: 'upper',
    name: 'Upper field',
    areaHa: 2.0,
    cropLastYear: 'wheat',
    arable: true,
    polygon: rect(0, 140, 200, 100),
    // The neighbour's new declaration starts 5 m inside last year's drawing.
    signal: { kind: 'overlap', neighbourPolygon: rect(0, 235, 200, 55), overlapPolygon: rect(0, 235, 200, 5), overlapHa: 0.1 },
  },
  { id: 'meadow', name: 'Meadow', areaHa: 1.5, cropLastYear: 'grassland', arable: false, polygon: rect(220, 140, 150, 100) },
  { id: 'house', name: 'House field', areaHa: 1.3, cropLastYear: 'maize', arable: true, polygon: rect(390, 0, 130, 100) },
]

const BLOCKS: LandShape[] = [
  {
    id: 'block_1',
    label: 'Block 1',
    // Ends where the widened road starts.
    polygon: [
      { x: 0, y: 0 },
      { x: 370, y: 0 },
      { x: 370, y: 112 },
      { x: 200, y: 112 },
      { x: 200, y: 120 },
      { x: 0, y: 120 },
    ],
  },
  { id: 'block_2', label: 'Block 2', polygon: rect(0, 140, 370, 100) },
  { id: 'block_3', label: 'Block 3', polygon: rect(390, 0, 130, 100) },
]

const PARCELS: LandShape[] = [
  { id: 'parcel_1', label: 'Parcel 1', polygon: rect(0, 0, 120, 120) },
  { id: 'parcel_2', label: 'Parcel 2', polygon: rect(120, 0, 250, 120) },
  { id: 'parcel_3', label: 'Parcel 3', polygon: rect(0, 140, 370, 60) },
  { id: 'parcel_4', label: 'Parcel 4', polygon: rect(0, 200, 370, 40) },
  { id: 'parcel_5', label: 'Parcel 5', polygon: rect(390, 0, 130, 100) },
]

const HERD: Herd = {
  lastYearDeclared: 41,
  registryCount: 38,
  cowsCalved: 14,
  calvingPeriod: { from: '2025-04-01', to: '2026-03-31' },
}

const PIGS: Pigs = { lastYearDeclared: 0, registryCount: 3 }

// Ten fit his farm, two don't. Fitting ones first; the two he applied for last year are chosen already.
const MEASURES: Measure[] = [
  {
    id: 'plant_production',
    unit: 'ha',
    rateDinars: 18_000,
    fits: true,
    lastYear: true,
    requirements: [
      { id: 'land', kind: 'auto' },
      { id: 'receipts', kind: 'auto' },
    ],
  },
  { id: 'cows_raising_calves', unit: 'cow_calved', rateDinars: 20_000, fits: true, lastYear: true, requirements: [{ id: 'calvings', kind: 'auto' }] },
  { id: 'fertiliser', fits: true, lastYear: false, requirements: [{ id: 'fertiliser_receipt', kind: 'auto' }] },
  {
    id: 'diesel',
    fits: true,
    lastYear: false,
    requirements: [
      { id: 'who_works', kind: 'choice', options: ['own', 'contractor'] },
      { id: 'contract', kind: 'upload', when: { id: 'who_works', value: 'contractor' } },
    ],
  },
  {
    id: 'certified_seed',
    fits: true,
    lastYear: false,
    requirements: [
      { id: 'seed_label', kind: 'upload' },
      { id: 'seed_kg', kind: 'number' },
    ],
  },
  {
    id: 'insurance',
    fits: true,
    lastYear: false,
    requirements: [
      { id: 'insurer', kind: 'text' },
      { id: 'policy', kind: 'upload' },
    ],
  },
  { id: 'breeding_cattle', fits: true, lastYear: false, requirements: [{ id: 'herd_book', kind: 'choice', options: ['yes', 'no'], blocks: 'no' }] },
  { id: 'insemination', fits: true, lastYear: false, requirements: [{ id: 'vet_certificate', kind: 'upload' }] },
  {
    id: 'green_cover',
    fits: true,
    lastYear: false,
    requirements: [
      { id: 'cover_fields', kind: 'fields' },
      { id: 'cover_promise', kind: 'confirm' },
    ],
  },
  {
    id: 'irrigation',
    fits: true,
    lastYear: false,
    requirements: [
      { id: 'water_permit', kind: 'upload' },
      { id: 'how_water', kind: 'longtext' },
    ],
  },
  { id: 'organic', fits: false, lastYear: false, requirements: [] },
  { id: 'milk', fits: false, lastYear: false, requirements: [] },
]

const RECEIPTS = [
  { name: 'Seed receipt.pdf', date: '2026-03-12' },
  { name: 'Fertiliser receipt.pdf', date: '2026-03-20' },
  { name: 'Diesel receipt.jpg', date: '2026-04-02' },
]

const BASE: Scenario = {
  id: 'second_year',
  renewed: true,
  window: { opens: '2026-04-10', closes: '2026-05-26' },
  today: '2026-04-28',
  generalData: { holder: 'Milan Dragović', place: 'Bečanj, near Čačak' },
  place: { lon: 20.55172, lat: 43.86748, rotationDeg: 12.5 },
  herd: HERD,
  pigs: PIGS,
  fields: FIELDS,
  blocks: BLOCKS,
  parcels: PARCELS,
  measures: MEASURES,
  documents: [{ id: 'input_receipts', attached: true, files: RECEIPTS }],
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  second_year: BASE,
  second_year_not_renewed: { ...BASE, id: 'second_year_not_renewed', renewed: false },
  missing_document: { ...BASE, id: 'missing_document', documents: [{ id: 'input_receipts', attached: false, files: [] }] },
}

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[]

// Advisor mode: only escalated problems reach Jelena.
export type CaseKind = 'herd_discrepancy' | 'inherited_parcel'

export type Office = 'animal_registry' | 'land_registry'

export interface AdvisorCaseSeed {
  id: string
  farmer: string
  kind: CaseKind
  sentAt: string
  note: string
  /** The farmer can't submit until this is sorted. */
  blocksSubmission: boolean
  deadline: string
  /** Record vs farmer's value, when there are two numbers. */
  values?: { record: number; his: number }
  owner: Office
  /** Earlier history on the application before it reached Jelena. */
  history: { at: string; actor: string; action: string }[]
}

export const ADVISOR = {
  name: 'Jelena',
  office: 'PSSS Čačak',
}

/** Milan's case, filled in from his own request once he sends it. */
export const MILAN_CASE: AdvisorCaseSeed = {
  id: 'milan_herd',
  farmer: 'Milan Dragović',
  kind: 'herd_discrepancy',
  sentAt: '2026-04-28T09:12:00Z',
  note: '',
  blocksSubmission: false,
  deadline: '2026-05-26',
  values: { record: 38, his: 41 },
  owner: 'animal_registry',
  history: [],
}

export const NEIGHBOUR_CASE: AdvisorCaseSeed = {
  id: 'neighbour_parcel',
  farmer: "Milan's neighbour, Bečanj",
  kind: 'inherited_parcel',
  sentAt: '2026-04-27T15:40:00Z',
  note: "The parcel is still in my late father's name.",
  blocksSubmission: true,
  deadline: '2026-05-26',
  owner: 'land_registry',
  history: [
    { at: '2026-04-27T15:20:00Z', actor: 'Neighbour', action: 'confirm' },
    { at: '2026-04-27T15:40:00Z', actor: 'Neighbour', action: 'send_to_jelena' },
  ],
}
