// All scenario facts (CLAUDE.md section 7). Components never hardcode these.

export type Point = { x: number; y: number }
// Coordinates are metres in a local grid, so area in m² / 10,000 = hectares.
export type Polygon = Point[]

export type Crop = 'wheat' | 'maize' | 'sunflower' | 'grassland' | 'barley' | 'soya'
export const CROPS: Crop[] = ['wheat', 'maize', 'sunflower', 'barley', 'soya', 'grassland']

export type FieldId = 'river' | 'road' | 'upper' | 'meadow' | 'house'

export type FieldSignal =
  | { kind: 'satellite_difference'; flagPolygon: Polygon; flagHa: number }
  | { kind: 'road_strip'; stripPolygon: Polygon; stripHa: number }

export interface Field {
  id: FieldId
  name: string
  areaHa: number
  cropLastYear: Crop
  arable: boolean
  polygon: Polygon
  signal?: FieldSignal
}

/** Reference layers for the map legend. */
export interface LandShape {
  id: string
  label: string
  polygon: Polygon
}

export type MeasureId = 'plant_production' | 'cows_raising_calves' | 'eco_scheme'

export interface Measure {
  id: MeasureId
  unit: 'ha' | 'cow_calved'
  rateDinars: number
  fits: boolean
  keptFromLastYear: boolean
}

export interface Document {
  id: 'input_receipts'
  attached: boolean
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
  applicationYear: number
}

export type ScenarioId =
  | 'second_year'
  | 'second_year_not_renewed'
  | 'first_year'
  | 'no_animals'
  | 'missing_document'

export interface Scenario {
  id: ScenarioId
  firstYear: boolean
  renewed: boolean
  window: { opens: string; closes: string }
  // Prototype clock (assumption), so "days left" means something.
  today: string
  generalData: GeneralData
  herd: Herd | null
  fields: Field[]
  /** Physical blocks: land that can get support. */
  blocks: LandShape[]
  /** Cadastral parcels: the legal plots. Reference only; labels are placeholders. */
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
  { id: 'upper', name: 'Upper field', areaHa: 2.0, cropLastYear: 'wheat', arable: true, polygon: rect(0, 140, 200, 100) },
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

const MEASURES: Measure[] = [
  { id: 'plant_production', unit: 'ha', rateDinars: 18_000, fits: true, keptFromLastYear: true },
  { id: 'cows_raising_calves', unit: 'cow_calved', rateDinars: 20_000, fits: true, keptFromLastYear: true },
  { id: 'eco_scheme', unit: 'ha', rateDinars: 0, fits: false, keptFromLastYear: false },
]

const BASE: Scenario = {
  id: 'second_year',
  firstYear: false,
  renewed: true,
  window: { opens: '2026-04-10', closes: '2026-05-26' },
  today: '2026-04-28',
  generalData: { holder: 'Milan Dragović', place: 'Bečanj, near Čačak', applicationYear: 2026 },
  herd: HERD,
  fields: FIELDS,
  blocks: BLOCKS,
  parcels: PARCELS,
  measures: MEASURES,
  documents: [{ id: 'input_receipts', attached: true }],
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  second_year: BASE,
  second_year_not_renewed: { ...BASE, id: 'second_year_not_renewed', renewed: false },
  missing_document: { ...BASE, id: 'missing_document', documents: [{ id: 'input_receipts', attached: false }] },
  no_animals: {
    ...BASE,
    id: 'no_animals',
    herd: null,
    measures: MEASURES.map((m) => (m.id === 'cows_raising_calves' ? { ...m, fits: false, keptFromLastYear: false } : m)),
  },
  first_year: {
    ...BASE,
    id: 'first_year',
    firstYear: true,
    // No last year: the registry headcount becomes a question.
    herd: { ...HERD, lastYearDeclared: null, registryCount: 41 },
    fields: FIELDS.map(({ signal: _signal, ...f }) => f),
    measures: MEASURES.map((m) => ({ ...m, keptFromLastYear: false })),
  },
}

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[]

// Advisor mode: only escalated problems reach Jelena.
export type CaseKind = 'herd_discrepancy' | 'inherited_parcel'

export interface AdvisorCaseSeed {
  id: string
  farmer: string
  kind: CaseKind
  sentAt: string
  note: string
  /** Record vs farmer's value, when there are two numbers. */
  values?: { record: number; his: number }
  owner: 'animal_registry' | 'land_registry'
  /** Earlier history on the application before it reached Jelena. */
  history: { at: string; actor: string; action: string }[]
}

export const ADVISOR = {
  name: 'Jelena',
  office: 'PSSS Čačak',
}

/** Shown when Milan hasn't sent his own problem yet in this session. */
export const MILAN_CASE: AdvisorCaseSeed = {
  id: 'milan_herd',
  farmer: 'Milan Dragović',
  kind: 'herd_discrepancy',
  sentAt: '2026-04-28T09:12:00Z',
  note: '4 sold, 2 slaughtered, 3 calves born.',
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
  owner: 'land_registry',
  history: [
    { at: '2026-04-27T15:20:00Z', actor: 'Neighbour', action: 'confirm_step' },
    { at: '2026-04-27T15:40:00Z', actor: 'Neighbour', action: 'send_to_jelena' },
  ],
}
