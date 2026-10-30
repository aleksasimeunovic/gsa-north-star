// All UI text. British spelling, plain language, short sentences, no em dashes.
import type { Crop, FieldId, GoalKind, MeasureId, Office, ScenarioId } from '../data/scenarios'
import type { RemovalReason, StepId, WorkId } from '../logic/application'
import type { CaseState } from '../logic/advisor'
import type { Source } from '../logic/farm'
import type { Severity } from '../logic/readiness'
import type { ImpactReason } from '../logic/status'
import type { Mark } from '../logic/severity'

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
    payment: 'Lower payment',
    error: 'Needs fixing',
  } satisfies Record<Mark, string>,

  readiness: {
    headline: {
      renewal: 'Renew your status before you can submit',
      blocked: 'Not ready to submit yet',
      fix: (n: number) => (n === 1 ? '1 thing to fix' : `${n} things to fix`),
      look: (n: number) => (n === 1 ? '1 thing to look at' : `${n} things to look at`),
      fixAndLook: (fix: number, look: number) => `${fix} to fix, ${look} to look at`,
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

  fields: { river: 'River field', road: 'Road field', upper: 'Upper field', meadow: 'Meadow', house: 'House field' } satisfies Record<FieldId, string>,
  crops: {
    wheat: 'Wheat',
    maize: 'Maize',
    sunflower: 'Sunflowers',
    grassland: 'Grassland and fodder',
    barley: 'Barley',
    soya: 'Soya',
  } satisfies Record<Crop, string>,
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
    road_took_area: (ha: string, about: string) => `The road took ${ha}, about ${about} less`,
    road_pending_correction: (ha: string, about: string) => `${ha} doesn't count until checked, about ${about} less`,
    overlap_removed: (ha: string, about: string) => `Your neighbour's line took ${ha}, about ${about} less`,
    overlap_pending: (ha: string, about: string) => `${ha} doesn't count until checked, about ${about} less`,
    meadow_out: (ha: string, about: string) => `The meadow is left out: ${ha}, about ${about} less`,
  } satisfies Record<ImpactReason, (ha: string, about: string) => string>,

  estimate: {
    title: 'Estimated subsidy',
    none: 'Your estimate appears once you choose your measures',
    afterChecks: 'Your measures are worked out after checks',
    provisional: (what: string) => `Provisional until you've checked ${what}`,
    pending: { field_road: 'the road field', field_upper: 'the upper field', field_meadow: 'the meadow', measures: 'your measures', receipts: 'your input receipts' } as Record<string, string>,
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
  daysLeft: (n: number) => (n === 1 ? '1 day left to apply' : `${n} days left to apply`),
  activeFarmer: "You're an active farmer for this year",
  nextAction: (what: string) => `Next: ${what.charAt(0).toLowerCase()}${what.slice(1)}`,
  stepDone: (step: string) => `Nothing left to do in ${step.toLowerCase()}`,
  stepWaiting: (n: number) => (n === 1 ? '1 thing waits for a check. You can still submit' : `${n} things wait for a check. You can still submit`),
  continueTo: (step: string) => `Continue: ${step}`,
  now: 'Now',
  /** How far along the part is: a fixed number he works down, never what's left, which can seem to grow. */
  outline: (done: number, of: number) => `${done} of ${of} done`,
  stepFinished: (step: string) => `${step}: done`,
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

/** What his last answer changed in the application, shown until his next answer. */
export const after = {
  done: (task: string, outcome: string) => `${task}: ${outcome}`,
  removed: (work: string, reason: string) => `No longer needed: ${work.toLowerCase()}, ${reason}`,
  more: (work: string, why: string) => `1 more thing: ${work.toLowerCase()}, because ${why}`,
  why: {
    river_split: 'something else is growing in the lower part',
    bank_enter: "the new account isn't the right one",
    bought_add: 'you farm it this year',
  } as Partial<Record<WorkId, string>>,
  undo: 'Undo',
  undoLabel: 'Undo your last answer',
}

export const tasks = {
  title: {
    renewal: 'Renew your active farmer status',
    bank: 'Account for payments',
    calvings: 'Cows that calved',
    field_meadow: 'Meadow',
    herd: 'Your herd',
    pigs: 'Your pigs',
    field_river: 'River field',
    field_road: 'Road field',
    field_upper: 'Upper field',
    fields_other: 'Crops on your other fields',
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
    field_meadow: 'Check the meadow',
    fields_other: "Confirm this year's crops",
    herd: 'Check your herd',
    pigs: 'Tell us about your pigs',
    field_river: 'Check the river field',
    field_road: 'Check the road field',
    field_upper: 'Check the upper field',
    field_bought: 'Check the parcel you bought',
    measures: 'Choose your measures',
    receipts: 'Confirm your input receipts',
  } as Record<string, string>,
  /** A confirmation's one button. */
  confirm: "Yes, that's right",
  review: 'Review this boundary',
  reviewSplit: 'Split the field on the map',

  work: {
    river_split: 'Split the field',
    road_redraw: 'Redraw the field',
    pigs_declare: 'Declare your pigs',
    bank_enter: 'Type in your account number',
    bought_add: 'Name the field and choose its measures',
  } satisfies Record<WorkId, string>,
  reason: {
    one_crop: 'one crop in the whole field (the state may still check it)',
    edge_moved: 'GSA moved the edge to the road for you',
    kept_until_checked: 'we asked for a correction instead',
    not_farmed: "you don't farm it this year",
    household: "household pigs don't need declaring",
    bank_sent: 'your bank sent the new one',
  } satisfies Record<RemovalReason, string>,

  bank: {
    context: (date: string) => `Your bank closed the account payments went to on ${date}`,
    registered: 'In the farm register',
    fromBank: 'New account from your bank',
    ending: (n: string) => `**** **** **** ${n}`,
    closed: 'Closed',
    question: (n: string) => `Should your subsidy be paid into the account ending ${n}?`,
    answerYes: 'Yes, the new account',
    answerNo: 'No, another account',
    label: 'Account number for payments',
    hint: '18 digits, for example 160-0000000123456-78',
    error: 'Enter the 18 digits of the account number',
    save: 'Save the account',
    paidTo: (n: string) => `Paid into the account ending ${n}`,
  },

  calvings: {
    lead: (n: number) => `${n} cows calved between 1 April 2025 and 31 March 2026`,
    source: 'From the animal registry',
    wrong: 'Not right? Ask the registry to check',
    asked: (n: number) => `The registry will check, and ${n} counts until then`,
    askedWith: (his: string, n: number) => `You said ${his}, the registry will check, and ${n} counts until then`,
    done: (n: number) => `${n} cows calved`,
  },

  meadow: {
    rule: 'The state checks by satellite that the meadow is mowed or grazed at least once this year',
    question: 'Will you mow or graze the meadow at least once this year?',
    answerYes: 'Yes, I will',
    answerNo: 'No, not this year',
    kept: "You'll mow or graze it, and the state checks by satellite",
    out: (ha: string) => `Left out this year, ${ha} less`,
  },

  /** Why it may fit, what the state checks, what he provides. */
  suggest: {
    green_cover: 'Your river and upper fields stayed green all winter',
    insemination: (n: number) => `${n} inseminations by your vet since last April`,
    checks: {
      green_cover: 'The state checks the fields stay covered from autumn to spring',
      insemination: "The state checks your vet's certificate against the registry",
    } as Partial<Record<MeasureId, string>>,
    provide: (list: string) => `You provide: ${list}`,
    useFields: (names: string) => `Use these fields: ${names}`,
  },

  unreadable: {
    action: 'Send a clearer diesel receipt',
    context: 'Too blurry to read the amount',
    hint: 'Take a new photo in good light, with the whole receipt in it',
    upload: 'Choose a new photo',
  },

  renewal: {
    body: 'You need it to submit. You can prepare everything else first',
    button: 'Renew now',
  },

  herd: {
    lastYear: 'Last year you declared',
    registry: 'Animal registry today',
    registryShort: 'Animal registry',
    yoursToday: 'You, today',
    question: (n: number) => `Do you have ${n} cattle now?`,
    summary: (reg: number, last: number) => `The registry shows ${reg}, and last year you declared ${last}`,
    done: (n: number) => `${n} cattle`,
    countLabel: 'How many cattle do you have today?',
    countHint: 'Include calves',
    countError: 'Enter a whole number, like 41',
    countSave: 'Save my number',
    /** Same words wherever the herd appears. */
    waiting: (reg: number) => `The animal registry checks it, and its ${reg} counts until then`,
    settled: (reg: number, who: string): [string, string][] => [
      ['Your part', 'Done'],
      ['Who settles it', who],
      ['Do you need to do anything?', 'No, unless they contact you'],
      ['What happens next', `The animal registry checks it, and its ${reg} counts until then. You can still submit, and the result appears here`],
    ],
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
    asks: 'Jelena asks: when did you sell or slaughter the cattle that left?',
    replyLabel: 'Your reply',
    reply: 'Send reply',
  },

  river: {
    /** What the photo shows, no more. */
    context: 'The lower strip is greening later than the wheat above it, so it may need attention',
    question: "What's growing in the lower part this year?",
    same: 'The same as the rest of the field',
    other: 'Something else',
    oneCrop: 'The same crop in the whole field',
    mayCheck: 'the state may still check it',
    split: (a: string, b: string) => `${a}, ${b}`,
    part: (crop: string, area: string) => `${crop} ${area}`,
  },

  road: {
    context: (d: string) => `Since ${d} the land map marks a strip of this field as road`,
    area: (from: string, to: string) => `${from} becomes ${to}`,
    payment: (about: string) => `About ${about} less`,
    question: 'Did the road take part of this field?',
    yes: "Yes, it's road now",
    no: "No, it's still my field",
    done: (left: string) => `Now ${left}`,
    correctionAsked: "Correction asked for. Until it's checked, the land map's area counts",
  },

  upper: {
    context: (d: string) => `On ${d} your neighbour declared a strip along the bottom of this field`,
    overlap: (ha: string) => `${ha} declared by both of you`,
    question: "Should we move your edge back to your neighbour's line?",
    yes: 'Yes, move my edge',
    no: 'No, the strip is mine',
    answerYes: "Moved to the neighbour's line",
    answerNo: 'The strip is mine',
    moved: (ha: string) => `Now ${ha}`,
    disputed: "Your declaration and your neighbour's are both kept, and the payments office checks them",
  },

  bought: {
    context: (d: string) => `The land registry shows a parcel in your name since ${d}`,
    question: 'Will you farm it this year?',
    yes: 'Yes, I farm it',
    no: 'No, not this year',
    draw: 'Add it to your fields',
    notFarmed: 'Not farmed this year',
  },

  pigs: {
    context: (n: number) => `The animal registry shows ${n} pigs, and you didn't declare any last year`,
    question: 'Are they only for your household?',
    hint: "Household pigs don't need declaring",
    answerYes: 'Household only',
    answerNo: 'I keep them to sell',
    household: 'Household only, nothing to declare',
    declared: (n: number) => `${n} pigs declared`,
  },

  fields: {
    row: (area: string, crop: string) => `${area}, ${crop}`,
  },


  /** Reused without asking. */
  details: {
    title: 'Unchanged since last year',
    holder: 'Name',
    place: 'Address',
    active: 'Active farmer',
    activeYes: 'Yes, this year',
    asked: 'Correction asked for, the office that keeps the record checks it',
  },

  measures: {
    lead: (fit: number) => `You can apply for ${fit} measures this year, and each one counts once you've filled in everything it needs`,
    groupLast: 'You applied for these last year',
    choose: 'Choose',
    chooseAgain: 'Choose again',
    groupSuggested: 'GSA recommends for your farm',
    groupMore: (n: number) => `${n} more measures you can apply for`,
    chosen: (n: number, fit: number) => `${n} of ${fit} chosen`,
    plant: (ha: string, rate: string, total: string) => `${ha} × ${rate} dinars, about ${total}`,
    cows: (n: number, rate: string, total: string) => `${n} cows that calved × ${rate} dinars, about ${total}`,
    notApplied: (ready: number, n: number, next: string) => `Not applied yet, ${ready} of ${n} filled in, next is ${next}`,
    allFilled: 'Everything is filled in, so you can apply now',
    fillIn: "Fill in what's missing",
    appliedFor: (n: number) => (n === 1 ? 'Applied for 1 measure' : `Applied for ${n} measures`),
    goalsTitle: 'What you need for more support',
    goal: {
      organic_months: (n: number) => `Keep your land organic for ${n} more months`,
      dairy_cows: (n: number) => `You need ${n} more dairy cows`,
      fattening_cattle: (n: number) => `You need ${n} more cattle in fattening`,
    } satisfies Record<GoalKind, (n: number) => string>,
    gain: (about: string) => `About ${about} more a year for your household`,
    goalOpen: (name: string) => `All about ${name}`,
    /** The side panel: everything about a measure he can't apply for yet. */
    goalPanel: {
      household: 'What it could mean for your household',
      working: { ha: (qty: string, rate: string) => `${qty} ha × ${rate} dinars`, animal: (qty: string, rate: string) => `${qty} animals × ${rate} dinars` },
      caveat: "This is an estimate, and the final amount depends on that year's rates and the state's checks",
      need: 'What you need to do',
      then: "Once that's done, you can apply in next year's application",
      checks: 'What the state checks',
      provide: "What you'd provide",
    },
    goalAbout: {
      organic: {
        pays: 'Extra support for each hectare farmed without synthetic fertiliser or sprays',
        steps: ['Have a certification body confirm your land is organic'],
        checks: 'That a certification body has approved your land, and that it stays organic',
        provide: 'Your organic certificate',
      },
      milk: {
        pays: 'Support for each dairy cow whose milk you sell to a dairy',
        steps: ['Sign a contract with a dairy'],
        checks: 'Your cows in the animal registry, and the milk the dairy reports',
        provide: 'Your contract with the dairy',
      },
      fattening: {
        pays: 'Support for each animal you fatten and sell for slaughter',
        steps: ['Keep each one on your farm until it is sold', 'Register each one in the animal registry'],
        checks: 'Each animal in the animal registry, and when it was sold',
        provide: 'Your sale or slaughter receipts',
      },
    } as Partial<Record<MeasureId, { pays: string; steps: string[]; checks: string; provide: string }>>,
    confirm: (n: number) => (n === 1 ? 'Apply for 1 measure' : `Apply for ${n} measures`),
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
      irrigation: 'The river field is next to the river',
    } as Partial<Record<MeasureId, string>>,
    stillToFill: (list: string) => `Still to fill in: ${list}`,
    ready: 'Ready to apply',
    applied: 'Applied',
    ruledOut: "Can't be paid this year",
    leaveOut: 'Leave out',
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
      ruledOut: 'It only pays for cows in the herd book, so leave it out this year',
    },
    vet_certificate: { label: "Your vet's insemination certificate", short: 'vet certificate' },
    cover_fields: { label: 'Which fields stay green over winter?', short: 'fields' },
    cover_promise: { label: "I'll keep them covered from autumn to spring", short: 'your promise' },
    water_permit: { label: 'Your permit to take water', hint: 'From the water authority, a photo is enough', short: 'water permit' },
    how_water: { label: 'How do you water your fields?', hint: 'For example, a pump from the river to the river field', short: 'how you water' },
  } as Record<string, { label: string; short: string; hint?: string; options?: Record<string, string>; ruledOut?: string }>,

  auto: {
    land: (ha: string, n: number) => `${ha} in ${n} fields`,
    receipts: (n: number) => `${n} files you uploaded`,
    receiptsMissing: 'Still to upload',
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
  flag: 'Greening later',
  photoDate: (d: string) => `Satellite photo, ${d}`,
  strip: (ha: string) => `${ha} now road`,
  edge: "The line stops at your field's edge, because land outside it can't get support",
  neighbour: "Neighbour's field",
  both: (ha: string) => `${ha} declared by both`,
  imagery: 'Imagery © Esri',
  keys: 'Drag or use the arrow keys to move the map, plus or minus to zoom',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  backTo: (field: string) => `Back to the ${field.toLowerCase()}`,
  backToFields: 'Back to your fields',
  wholeFarm: 'Whole farm',
  larger: 'Show larger map',
  smaller: 'Show smaller map',
  back: 'Back to your application',
}

export const draw = {
  loading: 'Loading the map',
}

export const split = {
  proposed: 'Line placed where the satellite photo changes',
  moveLine: 'Drag the line to move it',
  handleStart: 'Left end of the line',
  handleEnd: 'Right end of the line',
  keys: 'Arrow keys move it',
  useSlider: 'Use a slider instead',
  useDrag: 'Drag the line instead',
  sliderLabel: 'Where the second crop starts, from the top',
  noCross: 'The line needs to cross the whole field, so move one end',
  part: { top: 'Top part', bottom: 'Bottom part', left: 'Left part', right: 'Right part' },
  partArea: (part: string, area: string) => `${part}: ${area}`,
  cropFor: (part: string, area: string) => `Crop in the ${part.toLowerCase()} (${area})`,
  choose: 'Choose a crop',
  sameError: 'Choose a different crop from the other part',
  undo: 'Undo',
  confirm: 'Confirm the split',
}

export const finish = {
  submit: {
    readyTitle: 'Ready to submit. The state still checks:',
    blockedTitle: 'Not ready to submit yet',
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
    button: 'Submit application',
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
    amendText: 'You can amend it until the national deadline, and sign the declaration again',
    amend: 'Amend your application',
  },
  renewal: {
    title: 'Renew your active farmer status',
    why: 'You need it to submit',
    button: 'Renew my status',
    doneTitle: "You're an active farmer.",
    doneNext: 'Next: your application',
    continue: 'Continue to your application',
  },
}

/** What GSA knows about each part of his farm right now, each line changed with a pen. */
export const records = {
  title: 'What GSA knows',
  edit: (what: string) => `Change: ${what}`,
  save: 'Send the correction',
  cancel: 'Cancel',
  correctionHint: "The record's office checks it, and its value counts until then",
  numberError: 'Enter a whole number, like 14',
  textError: 'Enter the right value',
  youSaid: (v: string) => `You said ${v}`,
  state: { records: 'Unconfirmed', confirmed: 'Confirmed by you', checking: 'Waiting for a check' } satisfies Record<Source, string>,
  cattle: 'Cattle',
  pigs: 'Pigs',
  calvings: 'Cows that calved',
  period: (from: string, to: string) => `${from} to ${to}`,
  fieldValue: (ha: string, crop: string) => `${ha}, ${crop}`,
  leftOut: 'Left out this year',
  addField: 'Add a field',
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
  nameHint: 'So you recognise it, for example Lower field',
  nameError: 'Give the field a name',
  crop: 'What are you growing there this year?',
  next: 'Continue',
  measures: 'What do you apply for on this field?',
  perHa: (rate: string) => `${rate} dinars per hectare`,
  save: 'Add the field',
  saveNone: 'Add the field without measures',
  saveChanges: 'Save the field',
  change: 'Change the field',
  remove: 'Remove this field',
  line: (name: string, ha: string, crop: string) => `${name}, ${ha}, ${crop}`,
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
    answer_river: 'Answered: river field',
    set_split: 'Split the river field',
    answer_road: 'Answered: road field',
    answer_upper: 'Answered: upper field',
    answer_pigs: 'Answered: pigs',
    choose_measures: 'Chose measures',
    save_measure: 'Added what a measure needs',
    reply_to_jelena: 'Replied to Jelena',
    undo: 'Undid his last answer',
    farmer_replied: 'Farmer replied',
    confirm: 'Confirmed a part',
    answer_bank: 'Answered: account',
    set_bank_account: 'Gave his account',
    answer_meadow: 'Answered: meadow',
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
    submit: 'Check and submit',
  } satisfies Record<StepId, string>,
  of: (i: number, n: number) => `Step ${i} of ${n}`,
  /** Under the open part's name in the stepper: how far along, a number he works down, never what's left. */
  status: (done: number, of: number) => (done === of ? 'Done' : `${done} of ${of} done`),
}

export const bar = {
  label: 'Application',
  back: 'Back',
  next: (task: string) => `Next: ${task}`,
}

/** His farm as GSA knows it now, updated by every answer. */
export const farm = {
  title: 'Your farm this year',
  fields: 'Fields',
  cattleLabel: 'Cattle',
  pigsLabel: 'Pigs',
  measures: 'Measures',
  landValue: (ha: string, n: number) => `${ha} in ${n} fields`,
  crop: (crop: string, ha: string) => `${crop} ${ha}`,
  cattle: (n: number) => `${n} cattle`,
  cattleChecking: (his: number, reg: number) => `${his} cattle. The animal registry checks it, and its ${reg} counts until then`,
  pigs: (n: number) => `${n} pigs`,
  pigsHousehold: (n: number) => `${n} pigs for the household`,
  measuresValue: (n: number, fit: number) => `${n} of ${fit} you can apply for`,
  source: records.state,
  partly: (n: number, of: number) => `${n} of ${of} confirmed by you`,
  details: 'See each part',
}
