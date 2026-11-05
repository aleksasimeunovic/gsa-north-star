// All scenario facts (CLAUDE.md section 7). Components never hardcode these.

import type { Placement } from '../logic/geo'

export type Point = { x: number; y: number }
// Coordinates are metres in a local grid, so area in m² / 10,000 = hectares.
export type Polygon = Point[]

export type Crop = 'wheat' | 'maize' | 'sunflower' | 'grassland' | 'barley' | 'soya'
export const CROPS: Crop[] = ['wheat', 'maize', 'sunflower', 'barley', 'soya', 'grassland']
/** One part of a split field: a crop, or nothing sown there this year. */
export type PartCrop = Crop | 'unsown'
export const PART_CROPS: PartCrop[] = [...CROPS, 'unsown']

export type FieldId = 'river' | 'road' | 'upper' | 'meadow' | 'house'

/** Each signal is a fact with its source's date (prototype placeholders): GSA says what it saw and when. */
export type FieldSignal =
  /** `edge`: where the photo changes, from one side of the field to the other. GSA's line starts here. `riverAt`: where the river runs beside it. */
  | { kind: 'satellite_difference'; edge: Point[]; flagPolygon: Polygon; flagHa: number; riverAt: Point }
  | { kind: 'road_strip'; stripPolygon: Polygon; stripHa: number; seen: string }

export interface Field {
  id: FieldId
  name: string
  areaHa: number
  cropLastYear: Crop
  arable: boolean
  polygon: Polygon
  signal?: FieldSignal
  /** The farmland registered around the field. His edge can go past it, and then the land registry checks it. */
  land?: Polygon
  /** What he says the field is, when his edge goes past the registered farmland; areaHa is what counts until checked. */
  claimedHa?: number
}

/** Registered farmland he can put a field on. */
export interface LandShape {
  id: string
  label: string
  polygon: Polygon
  areaHa: number
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
  | 'fattening'

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

export type GoalKind = 'organic_months' | 'dairy_cows' | 'fattening_cattle'

export interface Goal {
  kind: GoalKind
  left: number
  /** What it could pay a year: a rate for each hectare or animal, on his own numbers. */
  gain: { rateDinars: number; quantity: number; unit: 'ha' | 'animal' }
}

export interface Measure {
  id: MeasureId
  /** Only the two real 2026 rates are numbers; the rest are worked out after checks. */
  unit?: 'ha' | 'cow_calved'
  rateDinars?: number
  fits: boolean
  lastYear: boolean
  requirements: Requirement[]
  /** What he still lacks to be eligible and what it could pay him, for a measure that doesn't fit yet (prototype placeholders). */
  goal?: Goal
}

export interface Document {
  id: 'input_receipts'
  attached: boolean
  /** Placeholder names and dates, so he can see what he confirms. */
  files: { name: string; date: string }[]
  /** A file GSA couldn't read, so he sends a clearer one. */
  unreadable?: string
}

/**
 * A measure GSA thinks may fit, from evidence he would otherwise have to know about:
 * the satellite saw winter cover, the animal registry has his vet's inseminations.
 */
export interface Suggestion {
  measureId: MeasureId
  evidence: 'green_all_winter' | 'inseminations'
  /** Fields the evidence is about, suggested to him; he uses them with one tap. Never ticked for him. */
  fields?: FieldId[]
  count?: number
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

/** A parcel the land registry now shows in his name, bought since last year: GSA asks whether he farms it. */
export interface BoughtParcel {
  polygon: Polygon
  areaHa: number
  /** When the land registry recorded it in his name (prototype placeholder). */
  on: string
  /** A house and its yard the photo shows on it, outlined by GSA: a guess he confirms, changes or rejects. */
  yard?: Polygon
}

/** Records GSA brings in. Read-only for Milan. */
export interface GeneralData {
  holder: string
  place: string
  /** The farm account payments go to. The bank reported it closed and a new one open in his name. */
  account: { ending: string; closedOn: string; newEnding: string; number: string; newNumber: string } | null
  /** More of what the farm register holds about him, for his records (prototype placeholders). */
  farmNumber: string
  phone: string
}

export type ScenarioId = 'second_year'

export interface Scenario {
  id: ScenarioId
  renewed: boolean
  window: { opens: string; closes: string }
  // Prototype clock (assumption), so "days left" means something.
  today: string
  /** When the satellite photo on every map was taken (prototype placeholder). */
  photoTaken: string
  generalData: GeneralData
  /** Where the fields sit on the satellite photo: north of a real road west of Bečanj (prototype placement). */
  place: Placement
  herd: Herd | null
  pigs: Pigs | null
  fields: Field[]
  bought: BoughtParcel | null
  /** Registered farmland near his fields that isn't in his application: where a field he adds can go. */
  otherLand: LandShape[]
  measures: Measure[]
  suggestions: Suggestion[]
  documents: Document[]
}

const shape = (...points: [number, number][]): Polygon => points.map(([x, y]) => ({ x, y }))

// Every shape is traced on the edges the satellite photo shows. Coordinates are metres on the local grid.
// The record's area is what counts: a shape says where the land is, and a part of a field is its share of that area.

// The pale ground along the river, where the photo changes to green wheat: a real edge across a real field.
const RIVER_TOP = shape([147, 1], [168, -5], [190, -12], [215, -18], [245, -24], [268, -28], [275, -26], [279, -18], [278, 10], [280, 30])
const RIVER_EDGE = shape([283.75, 37.5], [250, 39], [200, 42.5], [157.64, 46.5])
const RIVER_LEFT = shape([154, 38], [149, 22], [145, 8])
const RIVER_BOTTOM = shape([287, 60], [290, 100], [290, 116], [172, 116], [166, 90], [160, 52])

const FIELDS: Field[] = [
  {
    id: 'river',
    name: 'River field',
    areaHa: 2.4,
    cropLastYear: 'wheat',
    arable: true,
    polygon: [...RIVER_TOP, RIVER_EDGE[0], ...RIVER_BOTTOM, RIVER_EDGE[3], ...RIVER_LEFT],
    // The part along the river stays wet for longer every spring, so the photo sees it differently.
    signal: { kind: 'satellite_difference', edge: [...RIVER_EDGE].reverse(), flagPolygon: [...RIVER_TOP, ...RIVER_EDGE, ...RIVER_LEFT], flagHa: 1.08, riverAt: { x: 268, y: -37 } },
    // Registered farmland around it, from the trees along the river to the road (prototype placeholder).
    land: shape([136, 2], [164, -12], [212, -26], [266, -36], [282, -32], [288, -18], [288, 28], [295, 58], [298, 100], [297, 121], [168, 121], [159, 90], [152, 54], [143, 26]),
  },
  {
    id: 'road',
    name: 'Road field',
    areaHa: 1.8,
    cropLastYear: 'maize',
    arable: true,
    polygon: shape([344, -20], [380, -18], [414, -15], [413, -5], [410, 45], [407, 75], [406, 112], [404, 117], [335, 117], [332, 112], [331, 72], [339, 45], [340, 20], [344, -5]),
    // The strip along the road, where the road was widened.
    signal: { kind: 'road_strip', stripPolygon: shape([331.6, 108], [406.2, 108], [406, 112], [404, 117], [335, 117], [332, 112]), stripHa: 0.12, seen: '2026-03-16' },
  },
  { id: 'upper', name: 'Upper field', areaHa: 2.0, cropLastYear: 'wheat', arable: true, polygon: shape([190, 190], [235, 197], [277, 212], [270, 247], [262, 282], [279, 292], [208, 295], [146, 282], [115, 273], [111, 259], [119, 233], [133, 218], [151, 202]) },
  { id: 'meadow', name: 'Meadow', areaHa: 1.5, cropLastYear: 'grassland', arable: false, polygon: shape([305, 140], [360, 139], [408, 138], [405, 175], [400, 205], [398, 236], [372, 236], [352, 227], [310, 216], [303, 207]) },
  { id: 'house', name: 'House field', areaHa: 1.3, cropLastYear: 'maize', arable: true, polygon: shape([388, -139], [436, -140], [478, -140], [480, -105], [476, -62], [478, -22], [430, -26], [381, -31]) },
]

// Farmland south of the meadow, not in his application: where a field he rents could go.
const OTHER_LAND: LandShape[] = [{ id: 'block_5', label: 'Block 5', areaHa: 0.9, polygon: shape([280, 219], [351, 229], [372, 237], [400, 238], [395, 266], [390, 279], [313, 290], [285, 290], [264, 282], [277, 248]) }]

const HERD: Herd = {
  lastYearDeclared: 41,
  registryCount: 38,
  cowsCalved: 14,
  calvingPeriod: { from: '2025-04-01', to: '2026-03-31' },
}

const PIGS: Pigs = { lastYearDeclared: 0, registryCount: 3 }

// Ten fit his farm, three don't. Fitting ones first, the two he applied for last year at the top.
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
  // Not real rates: what the side panel works out for his household, until the ministry's rates are in.
  { id: 'organic', fits: false, lastYear: false, requirements: [], goal: { kind: 'organic_months', left: 2, gain: { rateDinars: 16_000, quantity: 7.5, unit: 'ha' } } },
  { id: 'milk', fits: false, lastYear: false, requirements: [], goal: { kind: 'dairy_cows', left: 2, gain: { rateDinars: 8_000, quantity: 16, unit: 'animal' } } },
  { id: 'fattening', fits: false, lastYear: false, requirements: [], goal: { kind: 'fattening_cattle', left: 5, gain: { rateDinars: 10_000, quantity: 5, unit: 'animal' } } },
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
  photoTaken: '2026-04-21',
  generalData: {
    holder: 'Milan Dragović',
    place: 'Bečanj, near Čačak',
    // Prototype placeholders: 18-digit accounts ending in the digits the bank reported.
    account: { ending: '0417', closedOn: '2026-03-03', newEnding: '2291', number: '205-0000000033304-17', newNumber: '160-0000000452922-91' },
    farmNumber: '714882',
    phone: '064 123 4567',
  },
  place: { lon: 20.55172, lat: 43.86748, rotationDeg: 12.5 },
  herd: HERD,
  pigs: PIGS,
  fields: FIELDS,
  // 0.80 ha above the road field, in his name since February (round 11, Aleksa).
  // The orchard beside the road field, traced on its tree lines and the path along its south side, with a real
  // house and yard in the middle of it.
  bought: {
    polygon: shape([419, -12], [486, -9], [540, -6], [542, 20], [530, 40], [513, 48], [457, 46], [415, 47], [417, 18]),
    areaHa: 0.8,
    on: '2026-02-12',
    yard: shape([467, 20], [490, 22], [491, 40], [466, 38]),
  },
  otherLand: OTHER_LAND,
  measures: MEASURES,
  suggestions: [
    { measureId: 'green_cover', evidence: 'green_all_winter', fields: ['river', 'upper'] },
    { measureId: 'insemination', evidence: 'inseminations', count: 9 },
  ],
  documents: [{ id: 'input_receipts', attached: true, files: RECEIPTS, unreadable: 'Diesel receipt.jpg' }],
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  second_year: BASE,
}


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
  /** The prototype clock (assumption), so follow-up dates mean something. */
  today: string
  /** The neighbour's parcel, for a small map preview (placeholder outline). */
  parcel?: Polygon
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
  today: '2026-04-28',
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
  today: '2026-04-28',
  parcel: shape([52, 26], [77, 22], [90, 60], [105, 112], [100, 118], [72, 118], [63, 75]),
  history: [
    { at: '2026-04-27T15:20:00Z', actor: 'Neighbour', action: 'confirm' },
    { at: '2026-04-27T15:40:00Z', actor: 'Neighbour', action: 'send_to_jelena' },
  ],
}
