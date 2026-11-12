// All UI text. British spelling, plain language, short sentences, no em dashes.
import type { FieldId, PartCrop, MeasureId, Office, ScenarioId } from '../data/scenarios'
import type { StepId, WorkId } from '../logic/application'
import type { CaseState } from '../logic/advisor'
import type { Source } from '../logic/farm'
import type { Severity } from '../logic/readiness'
import type { ImpactReason } from '../logic/status'
import type { Mark } from '../logic/severity'
import type { DrawProblem } from '../logic/drawing'

const num = new Intl.NumberFormat('en-GB')
export const formatNumber = (n: number) => num.format(Math.round(n))
export const formatDinars = (n: number) => `${formatNumber(n)} dinars`
export const formatHa = (ha: number) => `${ha.toFixed(2)} ha`
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const dateYearFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
export const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`))
export const formatDateYear = (iso: string) => dateYearFmt.format(new Date(`${iso}T00:00:00Z`))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))

export const en = {
  appName: 'GSA',
  appSub: 'Subsidies 2026',
  saved: 'Saved',
  yes: 'Yes',
  no: 'No',
  change: 'Change',
  close: 'Close',

  /** The one status signal, worded the same on every screen. */
  mark: {
    done: 'Done',
    todo: 'To do',
    waiting: 'Waiting for a check',
    error: 'Needs fixing',
  } satisfies Record<Mark, string>,

  readiness: {
    headline: {
      renewal: 'Renew your status before you can submit',
      blocked: 'Not ready to submit yet',
      left: (n: number, fix: number) => `${n === 1 ? '1 thing left' : `${n} things left`}${fix ? `, ${fix} to fix` : ''}`,
      look: (n: number) => (n === 1 ? '1 thing to look at' : `${n} things to look at`),
      ready_with_warnings: (n: number) => (n === 1 ? 'Ready to submit, 1 thing to look at' : `Ready to submit, ${n} things to look at`),
      ready: 'Ready to submit',
      submitted: 'Submitted',
    },
    group: {
      error: 'Needs fixing',
      todo: 'To do',
      look: 'You can submit, but look at these',
      info: 'Good to know',
    } satisfies Record<Severity, string>,
  },

  fields: { river: 'Tree line field', road: 'Road field', upper: 'Upper field', meadow: 'Meadow', house: 'House field' } satisfies Record<FieldId, string>,
  crops: {
    wheat: 'Wheat',
    maize: 'Maize',
    sunflower: 'Sunflowers',
    grassland: 'Grassland and fodder',
    barley: 'Barley',
    soya: 'Soya',
    unsown: 'Nothing sown',
  } satisfies Record<PartCrop, string>,
  measures: {
    plant_production: 'Basic support for plant production',
    cows_raising_calves: 'Cows raising calves for fattening',
    fertiliser: 'Mineral fertiliser',
    diesel: 'Diesel for field work',
    certified_seed: 'Certified seed',
    insurance: 'Crop and animal insurance',
    breeding_cattle: 'Quality breeding cattle',
    insemination: 'Artificial insemination',
    green_cover: 'Eco-scheme: green cover over winter',
    irrigation: 'Watering your fields',
    organic: 'Organic production',
    milk: 'Milk premium',
    fattening: 'Fattening cattle',
  } satisfies Record<MeasureId, string>,
  offices: { animal_registry: 'the animal registry', land_registry: 'the land registry' } satisfies Record<Office, string>,

  impact: {
    river_unsown: (ha: string, about: string) => `Nothing is sown on ${ha} of the tree line field, about ${about} less`,
    road_took_area: (ha: string, about: string) => `The road took ${ha}, about ${about} less`,
    road_pending_correction: (ha: string, about: string) => `${ha} doesn't count until checked, about ${about} less`,
  } satisfies Record<ImpactReason, (ha: string, about: string) => string>,

  estimate: {
    title: 'Estimated subsidy',
    none: 'Your estimate appears once you choose your measures',
    afterChecks: 'Your measures are worked out after checks',
    provisional: (what: string) => `Provisional until you've checked ${what}`,
    pending: { field_river: 'the tree line field', field_road: 'the road field', measures: 'your measures', receipts: 'your input receipts' } as Record<string, string>,
    about: (d: string) => `About ${d}`,
    unpriced: (n: number) => (n === 1 ? 'Plus 1 more measure, worked out after checks' : `Plus ${n} more measures, worked out after checks`),
    caveat: 'The payment still depends on inspection and final eligibility.',
    how: 'How is this worked out?',
    plant: (ha: string, rate: string, total: string) => `${ha} × ${rate} = ${total}`,
    cows: (n: number, rate: string, total: string) => `${n} cows that calved × ${rate} = ${total}`,
  },

  scenarios: {
    second_year: 'Second year',
  } satisfies Record<ScenarioId, string>,
}

export const home = {
  deadline: (n: number, closes: string) =>
    `${n === 1 ? '1 day' : `${n} days`} left to apply for subsidies (closes ${formatDateYear(closes)})`,
  daysLeft: (n: number) => (n === 1 ? '1 day left' : `${n} days left`),
  toApply: 'to apply',
  activeFarmer: "You're an active farmer for this year",
  stepDone: (step: string) => `Nothing left to do in ${step.toLowerCase()}`,
  stepWaiting: (n: number) => (n === 1 ? '1 thing waits for a check. You can still submit' : `${n} things wait for a check. You can still submit`),
  continueTo: (step: string) => `Continue: ${step}`,
  backToList: 'Back to the list',
  now: 'Now',
  stepFinished: (step: string) => `${step} done`,
  submitted: 'Your application is submitted.',
  seeReceipt: 'See your receipt',
  // Said to screen readers when the list changes.
  announce: {
    done: (task: string) => `${task}: done.`,
    waiting: (task: string) => `${task}: waiting for a check.`,
    removed: (work: string) => `No longer needed: ${work}.`,
    next: (task: string) => `Next: ${task}.`,
    undone: 'Your last answer is undone.',
  },
}

/** What his last answer did, in one line, and what comes next. */
export const after = {
  done: (task: string) => `${task} saved`,
  waiting: (task: string) => `${task} sent for a check`,
  removed: (work: string) => `No longer needed: ${work.toLowerCase()}`,
  more: (work: string) => `Added: ${work.toLowerCase()}`,
  next: (what: string) => `Next: ${what}`,
  undo: 'Undo',
  undoLabel: 'Undo your last answer',
}

export const tasks = {
  title: {
    renewal: 'Renew your active farmer status',
    bank: 'Account for payments',
    calvings: 'Cows that calved',
    herd: 'Your herd',
    pigs: 'Your pigs',
    field_river: 'Tree line field',
    field_road: 'Road field',
    field_bought: 'The parcel you bought',
    details: 'Your details',
    measures: 'Choose your measures',
    receipts: 'Your input receipts',
  } as Record<string, string>,
  receiptsMissingTitle: 'Upload your input receipts',
  /** The one next action, said as what to do. */
  start: { bank: 'Start with your account for payments', renewal: 'Start by renewing your active farmer status' } as Record<string, string>,
  action: {
    renewal: 'Renew your active farmer status',
    bank: 'Check your account for payments',
    calvings: 'Confirm your cows that calved',
    herd: 'Check your herd',
    pigs: 'Tell us about your pigs',
    field_river: 'Check the tree line field',
    field_road: 'Check the road field',
    field_bought: 'Check the parcel you bought',
    measures: 'Choose your measures',
    receipts: 'Confirm your input receipts',
  } as Record<string, string>,
  /** A confirmation's one button. */
  confirm: "Yes, that's right",
  review: 'Review this boundary',
  reviewParcel: 'Review this parcel',
  reviewSplit: 'Split the field on the map',
  changeSplit: 'Change the divider line',

  work: {
    river_split: 'Split the field',
    road_redraw: 'Redraw the field',
    pigs_declare: 'Declare your pigs',
    bank_enter: 'Type in your account number',
    bought_add: 'Name the field and give its crop',
  } satisfies Record<WorkId, string>,
  bank: {
    context: (date: string) => `Your bank closed the account payments went to on ${date}`,
    registered: 'In the farm register',
    fromBank: 'New account from your bank',
    ending: (n: string) => `•••• ${n}`,
    show: 'Show the whole number',
    hide: 'Hide the number',
    question: (n: string) => `Should your subsidy be paid into the account ending ${n}?`,
    answerYes: 'Yes, the new account',
    answerNo: 'No, another account',
    label: 'Account number for payments',
    hint: '18 digits, for example 160-0000000123456-78',
    error: 'Enter the 18 digits of the account number',
    save: 'Save',
    paidTo: (n: string) => `Paid into the account ending ${n}`,
  },

  calvings: {
    lead: (n: number) => `${n} cows calved between 1 April 2025 and 31 March 2026`,
    source: 'From the animal registry',
    wrong: 'Not right? Ask the registry to check',
    asked: (n: number) => `The registry will check, and ${n} counts until then`,
    askedWith: (his: string, n: number) => `You said ${his}. ${n} counts until the registry checks`,
    done: (n: number) => `${n} cows calved`,
  },

  /** Why it may fit, what the state checks, what he provides. */
  suggest: {
    green_cover: 'Your tree line and upper fields stayed green all winter',
    insemination: (n: number) => `${n} inseminations by your vet since last April`,
    /** The evidence in full, then what it might mean, worded as a possibility. */
    long: {
      green_all_winter: 'The satellite photos show your tree line and upper fields green from November to March. That may be the cover this measure pays for.',
      inseminations: (n: number) => `The animal registry shows ${n} inseminations by your vet since last April.`,
    },
    has: { green_all_winter: 'Winter satellite photos of your fields', inseminations: (n: number) => `${n} inseminations in the animal registry` },
    checks: {
      plant_production: 'Your receipts, and the area you farm',
      cows_raising_calves: 'Each calving in the animal registry',
      green_cover: 'That the fields stay covered until spring',
      insemination: "Your vet's certificate",
    } as Partial<Record<MeasureId, string>>,
    useFields: 'Use these fields',
    riverPart: (part: string) => `Tree line field (${part.toLowerCase()})`,
  },

  unreadable: {
    action: 'Send a clearer diesel receipt',
    context: 'Too blurry to read the amount',
    hint: 'A new photo in good light, the whole receipt in it',
    upload: 'Choose a new photo',
  },

  renewal: {
    body: 'You need it to submit. Prepare the rest first',
    button: 'Renew',
  },

  herd: {
    lastYear: 'Last year you declared',
    registry: 'Animal registry today',
    registryShort: 'Animal registry',
    yoursToday: 'You, today',
    question: (n: number) => `Do you have ${n} cattle now?`,
    summary: (reg: number, last: number) => `Registry ${reg}, declared last year ${last}`,
    done: (n: number) => `${n} cattle`,
    countLabel: 'How many cattle do you have today?',
    countHint: 'Include calves',
    countError: 'Enter a whole number, like 41',
    countSave: 'Save',
    /** Same words wherever the herd appears. */
    waiting: (reg: number) => `The animal registry checks it, and its ${reg} counts until then`,
    registryOnly: 'The animal registry',
    withJelena: 'The animal registry, with Jelena',
    outcome: {
      changed: (his: number) => `The animal registry checked and now shows ${his}`,
      kept: (_his: number, reg: number) => `The animal registry checked and kept ${reg}, which counts`,
    },
  },

  jelena: {
    state: {
      assigned: 'Jelena has your problem',
      waiting_office: 'Jelena asked the animal registry to check',
      waiting_farmer: 'Jelena needs more from you',
      resolved: 'Jelena has sorted this out',
    } satisfies Record<CaseState, string>,
    asks: 'Jelena asks: when did the cattle leave?',
    replyLabel: 'Your reply',
    reply: 'Send',
  },

  river: {
    /** What the photo shows, no more. */
    context: 'Part of this field looks different on the new photo',
    lastYear: 'Your field last year',
    lastYearValue: (ha: string, crop: string) => `${ha} · ${crop}`,
    different: 'Looks different',
    differentValue: (ha: string) => `About ${ha}`,
    showPhoto: 'New this year',
    showField: 'Last year',
    question: 'What grows in the part that looks different?',
    same: 'The same as the rest of the field',
    other: 'Something else',
    oneCrop: 'The same crop in the whole field',
    mayCheck: 'the state may still check it',
    split: (a: string, b: string) => `${a} and ${b}`,
    part: (crop: string, area: string) => `${area} · ${crop}`,
    pastLand: (counted: string) => `The land registry checks your edge, and ${counted} counts until then`,
    edge: 'your edge',
    counts: (ha: string) => `Your field counts as ${ha}`,
  },

  /** A disagreement with a record, in the same words wherever it appears. */
  settled: (who: string, next: string, gain?: string): [string, string][] => [
    ['Your part', 'Done'],
    ['Who settles it', who],
    ['Do you need to do anything?', 'No, unless they contact you'],
    ['What happens next', `${next}. You can still submit, and the result appears here`],
    ...(gain ? [['If they agree with you', gain] as [string, string]] : []),
  ],
  landWho: 'The land registry',
  landChecks: (what: string, counted: string) => `The land registry checks ${what}, and ${counted} counts until then`,

  road: {
    context: (d: string) => `Part of your field last year. Road on the land map since ${d}`,
    area: (from: string, to: string) => `${from} becomes ${to}`,
    payment: (about: string) => `About ${about} less`,
    question: 'Is this strip road now?',
    yes: "Yes, it's road now",
    no: "None of it is road, it's still my field",
    moved: 'Yes, but I moved its edge',
    editTitle: 'Move the outline onto the road',
    editHint: 'Pull its edge onto the road.',
    done: (left: string) => `Now ${left}`,
    correctionAsked: "The land registry checks the strip. The land map's area counts until then",
    landMap: 'On the land map',
    yours: 'You say',
    strip: 'the strip',
    gain: (whole: string, about: string) => `Your field goes back to ${whole}, about ${about} more`,
  },

  bought: {
    context: (d: string) => `The land registry shows a parcel in your name since ${d}`,
    question: 'Will you farm it this year?',
    yes: 'Yes, I farm it',
    no: 'No, not this year',
    draw: 'Add it',
    notFarmed: 'Not farmed this year',
  },

  pigs: {
    context: (n: number) => `The animal registry shows ${n} pigs. You declared none last year`,
    question: 'Are they only for your household?',
    hint: "Household pigs don't need declaring",
    answerYes: 'Household only',
    answerNo: 'I keep them to sell',
    household: 'Household only, nothing to declare',
    declared: (n: number) => `${n} pigs declared`,
  },

  /** Reused without asking. */
  details: {
    title: "Farmer's data",
    holder: 'Name',
    place: 'Address',
    active: 'Active farmer',
    activeYes: 'Yes, this year',
    asked: "Correction asked for. The record's office checks it",
  },

  measures: {
    lead: (fit: number) => `Tick the ones you want, out of ${fit}`,
    groupLast: 'You applied for these last year',
    groupSuggested: 'May also fit your farm',
    suggestedLead: 'From your records and the satellite photos. The state decides whether you qualify',
    groupMore: (n: number) => `${n} more you can apply for`,
    groupNot: (n: number) => `${n} that don't fit your farm this year`,
    notFit: { organic: 'For land certified as organic', milk: 'For farms that sell milk to a dairy', fattening: 'For cattle kept for fattening' } as Partial<Record<MeasureId, string>>,
    /** Under a measure's name: whether the records are enough, or what only he can add. */
    basis: { records: 'GSA has what it needs', adds: (list: string) => `You add: ${list}` },
    /** Inside a ticked measure, always in this order. */
    body: { why: 'Why GSA suggests it', has: 'GSA already has', add: 'Still needed from you', checks: 'The state still checks', estimate: 'In your estimate' },
    showThese: 'Show these fields on the map',
    chosen: (n: number, fit: number) => `${n} of ${fit} chosen`,
    plant: (ha: string, rate: string, total: string) => `${ha} × ${rate} dinars, about ${total}`,
    cows: (n: number, rate: string, total: string) => `${n} cows that calved × ${rate} dinars, about ${total}`,
    appliedFor: (n: number) => (n === 1 ? 'Applied for 1 measure' : `Applied for ${n} measures`),
    aboutOpen: (name: string) => `All about ${name}`,
    showMap: 'Show on map',
    showOne: (field: string) => `Show ${field} on the map`,
    showAll: 'Show your fields on the map',
    hideMap: 'Hide the map',
    panel: {
      why: 'Why it may fit your farm',
      pays: 'What it could pay you',
      noRate: 'The amount is worked out after checks',
      give: "What you'd give",
      known: (list: string) => `GSA already has: ${list}`,
      checks: 'What the state checks',
    },
    pays: {
      fertiliser: 'Part of the cost of mineral fertiliser',
      diesel: 'Part of the cost of diesel for field work',
      certified_seed: 'Part of the cost of certified seed',
      insurance: 'Part of your insurance premium',
      breeding_cattle: 'For each breeding cow in the herd book',
      insemination: 'Part of the cost of artificial insemination',
      green_cover: 'For each hectare kept green from autumn to spring',
      irrigation: 'Part of the cost of watering your fields',
    } as Partial<Record<MeasureId, string>>,
    why: {
      plant_production: 'You farm arable land and meadow',
      cows_raising_calves: 'Your cows calved this year',
      fertiliser: 'You grow wheat and maize',
      diesel: 'You work your own fields',
      certified_seed: 'You sow wheat',
      insurance: 'Your crops and cattle can be insured',
      breeding_cattle: 'You keep cows for breeding',
      insemination: 'Your cows calved this year',
      green_cover: 'You have arable fields',
      irrigation: 'You grow field crops',
    } as Partial<Record<MeasureId, string>>,
    newCrop: (crop: string) => `New: you sow ${crop} on the tree line field this year`,
    stillToFill: (list: string) => `Still to fill in: ${list}`,
    applied: 'Applied',
    ruledOut: "Can't be paid this year",
    attached: (name: string) => `Attached: ${name}`,
    error: {
      upload: 'Add a photo or PDF',
      number: 'Enter a number, like 50',
      text: 'Fill this in',
      longtext: 'Fill this in',
      choice: 'Choose one',
      fields: 'Choose at least one field',
      confirm: 'Tick the box',
      auto: '',
    },
  },

  /** What each measure needs. `short` is how a task lists what's left. */
  requirement: {
    land: { label: 'Your fields', short: 'fields' },
    receipts: { label: 'Your input receipts', short: 'receipts' },
    calvings: { label: 'Calvings in the animal registry', short: 'calvings' },
    fertiliser_receipt: { label: 'Fertiliser receipt.pdf, from your receipts', short: 'fertiliser receipt' },
    who_works: { label: 'Who works your land?', short: 'who works your land', options: { own: 'I do, with my own tractor', contractor: 'A contractor does' } },
    contract: { label: 'Your contract with the contractor', short: 'contract' },
    seed_label: { label: 'The label from the seed bag', hint: 'A photo is enough', short: 'seed label' },
    seed_kg: { label: 'How many kilograms of certified seed did you buy?', short: 'kilograms of seed' },
    insurer: { label: 'Insurance company', short: 'insurance company' },
    policy: { label: 'Your insurance policy', short: 'policy' },
    herd_book: {
      label: 'Are your cows entered in the herd book?',
      short: 'herd book',
      options: { yes: 'Yes', no: 'No' },
      ruledOut: 'It only pays for cows in the herd book',
    },
    vet_certificate: { label: "Your vet's insemination certificate", short: 'vet certificate' },
    cover_fields: { label: 'Which fields stay green over winter?', short: 'fields' },
    cover_promise: { label: "I'll keep them covered from autumn to spring", short: 'your promise' },
    water_permit: { label: 'Your permit to take water', hint: 'From the water authority, a photo is enough', short: 'water permit' },
    how_water: { label: 'How do you water your fields?', hint: 'For example, a pump from a well', short: 'how you water' },
  } as Record<string, { label: string; short: string; hint?: string; options?: Record<string, string>; ruledOut?: string }>,

  auto: {
    land: (ha: string, n: number) => `${ha} in ${n} fields`,
    receipts: (n: number) => `${n} files you uploaded`,
    receiptsMissing: 'Still to upload',
    receiptsBlurry: (n: number) => `${n} files, 1 too blurry to read. Fix it in Documents`,
    blurryShort: 'a clearer diesel receipt',
    calvings: (n: number) => `${n} cows calved`,
    fertiliser_receipt: 'Found in your receipts',
  },

  receipts: {
    needed: 'Plant production support needs them',
    upload: 'Choose a photo or PDF',
    files: (n: number) => `${n} files attached`,
  },

}

export const map = {
  title: 'Map of your fields',
  flag: 'Looks different',
  photoDate: (d: string) => `Satellite photo, ${d}`,
  strip: (ha: string) => `${ha} now road`,
  imagery: 'Imagery © Esri',
  keys: 'Drag or arrow keys move the map, plus or minus zoom',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  backTo: (field: string) => `Back to the ${field.toLowerCase()}`,
  backToFields: 'Back to your fields',
  wholeFarm: 'Whole farm',
  back: 'Back',
  backMore: ' to your application',
}

export const draw = {
  loading: 'Loading the map',
}

const KEYS = 'Arrow keys move it, and Delete takes it out'
const CROSSES = "The outline can't cross itself"

/** The same tools wherever he moves a shape on the map. */
export const shapeTools = {
  undo: 'Undo',
  undoHint: 'Undo your last move',
  redo: 'Redo',
  redoHint: 'Redo your last move',
  snapOff: 'Points stay where you put them',
  snapStop: "Don't join",
  snapStart: 'Join edges',
  undoIdle: 'Nothing to undo yet',
  joined: 'Joined the edge on the photo',
  reset: 'Reset',
  removeMouse: 'Double-click a point to remove it',
  removeTouch: 'Double-tap a point to remove it',
}

const EDGE_STOP = "The line stops at your field's edge: land outside it gets no support"

export const split = {
  step: (n: number) => `Step ${n} of 3`,
  lineTitle: 'Where does the crop change?',
  check: {
    suggested: 'GSA drew the dashed line from the photo. It may be wrong.',
    onMap: "GSA's suggestion",
    yours: 'Your line.',
    question: 'Is this where the crop changes?',
    yes: "Yes, that's right",
    no: 'No, I need to change it',
  },
  yourLine: "Pull the line, or your field's edge, into place.",
  twoFingers: 'Move the map with two fingers',
  sliderOn: 'Hard to drag? Use a slider',
  sliderOff: 'Hide the slider',
  fieldNow: (ha: string, by: string, more: boolean) => `You say your field is ${ha}, ${by} ${more ? 'more' : 'less'}.`,
  pastLand: 'Past the registered farmland. The land registry will check it',
  pastLandCounts: (ha: string) => `Until then ${ha} counts.`,
  bendLabel: (n: number) => `Bend ${n} in the line`,
  cornerLabel: (n: number) => `Corner ${n} of your field`,
  endStart: 'Start of the line, on the edge of the field',
  endEnd: 'End of the line, on the edge of the field',
  keys: KEYS,
  tips: { line: 'Pull to bend', edge: 'Pull to move', bend: 'Drag to move', end: 'Slides along the edge', corner: 'Drag to move' },
  tools: {
    ...shapeTools,
    label: 'Tools for the line and your field',
    resetIdle: "This is GSA's line",
    sliderLabel: 'Move the whole line',
    resetHint: "Go back to GSA's line and your field as registered",
  },
  stopped: {
    edge: EDGE_STOP,
    leaves_field: EDGE_STOP,
    crosses_itself: "The line can't cross itself, so it stopped here",
    too_small: 'Each part needs at least 0.10 ha, so the line stopped here',
  },
  part: { top: 'Tree line side', bottom: 'Road side', left: 'Left part', right: 'Right part' },
  partArea: (part: string, area: string) => `${part} ${area}`,
  areaCrop: (area: string, crop: string) => `${area} · ${crop}`,
  cropsTitle: "What's growing in each part?",
  cropsHint: 'Tap a part on the map, or choose here',
  cropFor: (part: string, area: string) => `${part}, ${area}`,
  choose: 'Choose a crop',
  sameError: 'Choose something different from the other part',
  cropMissing: 'Choose a crop',
  effectsTitle: 'What this changes in your application',
  effects: {
    changes: 'What changes',
    stays: 'What stays the same',
    decide: 'What needs your decision',
    nothingToDecide: 'Nothing else needs your decision.',
    field: 'Tree line field',
    fieldValue: (parts: string) => `Two parts, ${parts}`,
    total: 'Its size',
    totalMoved: (ha: string, by: string, more: boolean) => `${ha}, ${by} ${more ? 'more' : 'less'}`,
    edge: 'Its edge',
    pastLand: (claimed: string, counted: string) => `You say ${claimed}. ${counted} counts until the land registry checks`,
    newCrop: (crop: string) => `Could cover seed for your ${crop}, if chosen in Measures`,
    plant: 'Basic support for plant production',
    bothCount: 'Covers both parts',
    oneCounts: (ha: string) => `Covers only ${ha}, because nothing is sown on the rest`,
    cover: 'Covers both parts. Change it in Measures',
    estimate: 'Your estimate',
    sameMoney: 'Both crops pay the same per hectare',
    less: (about: string) => `About ${about} less, because land with nothing sown isn't paid`,
    smaller: (about: string) => `About ${about} less, because your field is smaller`,
    more: (about: string) => `About ${about} more, because your field is larger`,
  },
  next: 'Continue',
  back: 'Back',
  confirm: 'Confirm',
}

export const finish = {
  submit: {
    leftIn: (count: string, parts: number) => `${count}, in ${parts === 1 ? '1 part' : `${parts} parts`}`,
    readyTitle: 'Ready to submit. The state still checks:',
    goTo: (what: string) => `Go to: ${what}`,
    awaitingNote: 'You can still submit',
    checks: {
      eligibility: 'That you and each measure are eligible',
      records: 'Your answers against the animal registry and the land map',
      inspection: 'Some farms are inspected on the ground',
      payment: 'The final amount, which may differ from the estimate',
    },
    declarationTitle: 'Declaration',
    declaration: 'I confirm under full criminal and material liability that the information in this application is true.',
    button: 'Submit',
    signFirst: 'Tick the declaration to submit',
  },
  receipt: {
    title: 'Your application is submitted.',
    when: (d: string) => `Submitted on ${d}`,
    reference: 'Reference number',
    referenceNote: 'Keep this number',
    copy: 'Copy the reference number',
    copied: 'Copied',
    nextTitle: 'What happens next',
    next: [
      'The state checks your application against its records',
      'Some farms are inspected on the ground',
      "You'll see the decision and the payment in GSA",
    ],
    amendTitle: 'Need to change something?',
    amendText: 'You can amend it until the national deadline',
    amend: 'Amend',
  },
  renewal: {
    title: 'Renew your active farmer status',
    why: 'You need it to submit',
    button: 'Renew',
    doneTitle: "You're an active farmer.",
    doneNext: 'Next: your application',
    continue: 'Continue',
  },
}

/** What GSA knows about each part of his farm right now, each line changed with a pen. */
export const records = {
  titles: { details: "Farmer's data", animals: 'Your animals', land: 'Your fields', documents: 'Your documents' },
  more: { details: 'More data', animals: 'All about your animals', land: 'All your fields', documents: 'All your files' },
  save: 'Send',
  cancel: 'Cancel',
  correctionHint: "The record's office checks it, and its value counts until then",
  numberError: 'Enter a whole number, like 14',
  textError: 'Enter the right value',
  youSaid: (v: string) => `You said ${v}`,
  youSay: (v: string) => `You say ${v}`,
  state: { records: 'Unconfirmed', confirmed: 'Confirmed', checking: 'Waiting for a check' } satisfies Record<Source, string>,
  cattle: 'Cattle',
  pigs: 'Pigs',
  calvings: 'Cows that calved',
  period: (from: string, to: string) => `${from} to ${to}`,
  areaCrop: (ha: string, crop: string) => `${ha} · ${crop}`,
  unchangedFields: 'Unchanged fields',
  total: 'All your land',
  fieldCount: (n: number) => `${n} fields`,
  files: (n: number) => `${n} files`,
  addField: 'Add a field',
  farmNumber: 'Farm number',
  phone: 'Phone',
}

/** Adding a field on the map: where, its name and crop, its measures. */
export const fieldEdit = {
  titleNew: 'Add a field',
  yourField: 'Your field',
  step: (n: number, of: number) => `Step ${n} of ${of}`,
  place: 'Where is the field?',
  placeHint: 'Tap the land on the map, or choose it here',
  landLabel: 'Registered farmland',
  landNames: { block_5: 'Farmland south of the meadow' } as Record<string, string>,
  landChoice: (name: string, ha: string) => `${name}, ${ha}`,
  details: 'About the field',
  name: 'Name',
  nameHint: 'For example, Lower field',
  nameError: 'Give the field a name',
  cropError: 'Choose what you grow there',
  crop: 'What are you growing there this year?',
  save: 'Save',
  saveChanges: 'Save',
  change: 'Change',
  remove: 'Delete this field',
  draw: 'Draw new parcel on the map',
  edges: 'Change its edges',
  line: (name: string, ha: string, crop: string) => `${name}, ${ha} · ${crop}`,
  yard: {
    seen: 'The photo shows a house on it',
    house: 'House',
    title: 'Is this the house and its yard?',
    editTitle: 'Move the outline onto the house and its yard',
    why: "A house and yard aren't farmland. GSA drew this from the photo, which can be wrong.",
    without: (field: string) => `${field} without the house and yard`,
    yes: "Yes, that's right",
    no: 'No, I need to change it',
    none: 'No house here',
    done: 'Done',
    label: (ha: string) => `House and yard, ${ha}`,
    corner: (n: number) => `Corner ${n} of the yard`,
    keys: KEYS,
    tools: 'Tools for the yard',
    resetHint: "Go back to GSA's outline",
    resetIdle: "This is GSA's outline",
    stopped: {
      crosses_itself: CROSSES,
      too_small: 'A yard needs at least 0.01 ha',
    },
  },
  /** The road strip, edited like the yard when the land map's outline is wrong. */
  road: {
    label: (ha: string) => `Road, ${ha}`,
    corner: (n: number) => `Corner ${n} of the road`,
    keys: KEYS,
    tools: 'Tools for the road',
    resetHint: "Go back to the land map's road",
    resetIdle: "This is the land map's road",
    stopped: {
      crosses_itself: CROSSES,
      too_small: 'The road needs at least 0.01 ha',
    },
  },
}

/** Drawing a field corner by corner on the photo. */
export const drawField = {
  title: 'Draw your field',
  start: 'Click or tap each corner of your field on the map.',
  next: 'Go round your field, one corner at a time.',
  three: 'Add more corners, or close the field on your first one.',
  editTitle: "Check your field's edges",
  editHint: "Pull a corner, or an edge's middle dot, to where your field ends.",
  continue: 'Continue',
  onFirst: 'On your first corner',
  create: (ha: string) => `Create the field, ${ha}`,
  problem: {
    outside_farmland: "Only registered farmland gets support. Move the cross onto it",
    crosses_itself: "The edges can't cross each other. Move the cross",
  } satisfies Record<DrawProblem, string>,
  stopped: {
    outside_farmland: 'Your field stays on registered farmland',
    crosses_itself: "The edges can't cross each other, so it stopped here",
  } satisfies Record<DrawProblem, string>,
  overlaps: (field: string) => `This takes land you already declare (${field})`,
  leaveOut: 'Leave it out',
  tooSmall: 'A field needs at least 0.10 ha',
  metres: (m: number) => `${m} m`,
  areaSaid: (ha: string, n: number) => `${n} corners, ${ha}`,
  tools: 'Tools for drawing your field',
  undo: 'Undo',
  undoHint: 'Undo your last corner or move',
  redo: 'Redo',
  redoHint: 'Redo your last corner or move',
  reset: 'Reset',
  resetHint: 'Go back to the field as you created it',
  cornerLabel: (n: number) => `Corner ${n} of your field`,
  midLabel: (n: number) => `Middle of edge ${n}. Pull it to add a corner`,
  keys: KEYS,
}

export const proto = {
  open: 'Prototype',
  title: 'Prototype',
  signInAs: 'Persona',
  milan: 'Milan (farmer)',
  jelena: 'Jelena (advisor)',
  reset: 'Reset this scenario',
}

export const advisor = {
  nav: { queue: 'Problems sent to you', milan: "Milan's application" },
  title: 'Problems sent to you',
  shortcuts: 'J next, K previous, O open',
  listLabel: 'Cases',
  /** Each state names who acts next. */
  state: {
    assigned: 'Needs you',
    waiting_office: 'Referred, awaiting a response',
    waiting_farmer: 'Needs the farmer',
    resolved: 'Resolved',
  } satisfies Record<CaseState, string>,
  next: {
    assigned: () => 'Next: you',
    waiting_office: (office: string) => `Next: ${office}`,
    waiting_farmer: () => 'Next: the farmer',
    resolved: () => 'Resolved',
  } satisfies Record<CaseState, (office: string) => string>,
  reply: "Farmer's reply",
  blocks: 'Blocks submission',
  deadline: (d: string) => `Application deadline ${d}`,
  followUp: (d: string) => `Follow up on ${d} if there's no answer`,
  kind: {
    herd_discrepancy: 'Herd differs from the animal registry',
    inherited_parcel: "Parcel still in a late parent's name",
  },
  note: "Farmer's explanation",
  noNote: 'No explanation',
  record: { herd_discrepancy: 'Animal registry', inherited_parcel: 'Land registry' },
  parcelRecord: 'In the name of his late father',
  his: 'Farmer declared',
  inApp: "In Milan's application",
  outcome: {
    herd_discrepancy: { changed: (his: number) => `Now shows ${his}`, kept: (_his: number, reg: number) => `Kept ${reg}` },
    inherited_parcel: { changed: () => 'Now in his name', kept: () => "Stays in his late father's name" },
  },
  act: {
    referred: (office: string) => `Refer to ${office}`,
    asked_farmer: 'Ask the farmer',
    decided: (office: string) => `Record the decision of ${office}`,
    openApp: 'Open his application',
  },
  historyTitle: 'Action history',
  historyHead: { when: 'When', who: 'Who', what: 'What' },
  history: {
    answer_herd: 'Answered: herd',
    set_herd_count: 'Gave his cattle count',
    send_to_jelena: 'Sent the problem to Jelena',
    ask_record_check: 'Asked for a correction',
    answer_river: 'Answered: tree line field',
    set_split: 'Split the tree line field',
    answer_road: 'Answered: road field',
    answer_pigs: 'Answered: pigs',
    choose_measures: 'Chose measures',
    save_measure: 'Added what a measure needs',
    reply_to_jelena: 'Replied to Jelena',
    undo: 'Undid his last answer',
    farmer_replied: 'Farmer replied',
    confirm: 'Confirmed a part',
    answer_bank: 'Answered: account',
    set_bank_account: 'Gave his account',
    attach_document: 'Attached a document',
    renew: 'Renewed active farmer status',
    sign_declarations: 'Signed the declaration',
    submit: 'Submitted the application',
    amend: 'Reopened to amend',
    opened: 'Opened the case',
    referred: 'Referred to the record owner',
    asked_farmer: 'Asked the farmer',
    owner_decided: "Recorded the owner's decision",
  } as Record<string, string>,
}

/** The parts of his application. */
export const steps = {
  label: 'Parts of your application',
  name: {
    details: 'Your details',
    animals: 'Animals',
    land: 'Land',
    measures: 'Measures',
    documents: 'Documents',
    submit: 'Summary',
  } satisfies Record<StepId, string>,
  of: (i: number, n: number) => `Step ${i} of ${n}`,
  left: (id: StepId, n: number) => {
    if (n === 0) return 'Done'
    if (id === 'measures') return 'Choose yours'
    if (id === 'land') return n === 1 ? '1 parcel to resolve' : `${n} parcels to resolve`
    return `${n} thing${n === 1 ? '' : 's'} to ${{ details: 'confirm', documents: 'sort out' }[id as string] ?? 'answer'}`
  },
}

export const bar = {
  label: 'Application',
  back: 'Back',
  next: (task: string) => `Next: ${task}`,
}

