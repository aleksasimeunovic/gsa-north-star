// All UI text. British spelling, plain language, short sentences, no em dashes.
import type { Crop, FieldId, MeasureId, Office, ScenarioId } from '../data/scenarios'
import type { DrawingProblem } from '../logic/geometry'
import type { RemovalReason, StepId, WorkId } from '../logic/application'
import type { CaseState } from '../logic/advisor'
import type { Source } from '../logic/farm'
import type { Severity } from '../logic/readiness'
import type { ImpactReason, Status } from '../logic/status'

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

  status: {
    complete: 'Complete',
    action_required: 'Needs your action',
    awaiting_verification: 'Awaiting verification',
  } satisfies Record<Status, string>,

  readiness: {
    headline: {
      renewal: 'Renew your status before you can submit',
      blocked: (n: number) => (n === 1 ? "You can't submit yet: 1 thing to do" : `You can't submit yet: ${n} things to do`),
      ready_with_warnings: (n: number) => (n === 1 ? 'Ready to submit, 1 thing to look at' : `Ready to submit, ${n} things to look at`),
      ready: 'Ready to submit',
      submitted: 'Submitted',
    },
    group: {
      error: 'Stops you submitting',
      warning: "You can submit, but look at these",
      info: 'Good to know',
    } satisfies Record<Severity, string>,
    waiting: 'Waits for a check, and you can still submit',
    info: {
      state_checks: 'The state still inspects your farm and checks eligibility before paying',
      unpriced: (n: number) => (n === 1 ? '1 measure is worked out after checks' : `${n} measures are worked out after checks`),
    },
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
  } satisfies Record<MeasureId, string>,
  offices: { animal_registry: 'the animal registry', land_registry: 'the land registry' } satisfies Record<Office, string>,

  impact: {
    road_took_area: (ha: string, about: string) => `The road took ${ha}, about ${about} less`,
    road_pending_correction: (ha: string, about: string) => `Until the correction is checked, ${ha} doesn't count, about ${about} less`,
    overlap_removed: (ha: string, about: string) => `Your neighbour's line took ${ha}, about ${about} less`,
    redrawn: (ha: string, about: string) => `Your new line takes ${ha} off the field, about ${about} less`,
    overlap_pending: (ha: string, about: string) => `Until the line is checked, ${ha} doesn't count, about ${about} less`,
    meadow_out: (ha: string, about: string) => `The meadow is left out this year: ${ha}, about ${about} less`,
  } satisfies Record<ImpactReason, (ha: string, about: string) => string>,

  estimate: {
    title: 'Estimated subsidy',
    basis: "Based on what you've told us",
    provisional: (what: string) => `Provisional until you've checked ${what}`,
    pending: { field_road: 'the road field', field_upper: 'the upper field', field_meadow: 'the meadow', measures: 'your measures', receipts: 'your input receipts' } as Record<string, string>,
    about: (d: string) => `About ${d}`,
    unpriced: (n: number) => (n === 1 ? 'Plus 1 more measure, worked out after checks' : `Plus ${n} more measures, worked out after checks`),
    caveat: 'The payment still depends on inspection and final eligibility.',
    how: 'How is this worked out?',
    plant: (ha: string, rate: string, total: string) => `${ha} × ${rate} = ${total}`,
    cows: (n: number, rate: string, total: string) => `${n} cows that calved × ${rate} = ${total}`,
    total: (t: string) => `Total: ${t}`,
  },

  scenarios: {
    second_year: 'Second year',
    second_year_not_renewed: 'Second year, not renewed',
    missing_document: 'Missing receipts',
  } satisfies Record<ScenarioId, string>,
}

export const home = {
  deadline: (n: number, closes: string) =>
    `${n === 1 ? '1 day' : `${n} days`} left to apply for subsidies (closes ${formatDateYear(closes)})`,
  daysLeft: (n: number) => (n === 1 ? '1 day left to apply' : `${n} days left to apply`),
  activeFarmer: "You're an active farmer for this year",
  stepDone: (step: string) => `Nothing left to do in ${step.toLowerCase()}`,
  stepWaiting: (n: number) => (n === 1 ? '1 thing waits for a check, and you can still submit' : `${n} things wait for a check, and you can still submit`),
  continueTo: (step: string) => `Continue: ${step}`,
  now: 'Now',
  todo: 'To do',
  /** What's left in this part. */
  outline: (left: number) => (left === 0 ? 'Nothing left to do' : left === 1 ? '1 thing to do' : `${left} things to do`),
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
  waiting: (task: string) => `${task} waits for a check, and you can still submit`,
  removed: (work: string, reason: string) => `No longer needed: ${work.toLowerCase()}, ${reason}`,
  undo: 'Undo',
  undoLabel: 'Undo your last answer',
}

export const tasks = {
  title: {
    renewal: 'Renew your active farmer status',
    bank: 'Account for payments',
    household: 'Your household',
    calvings: 'Cows that calved',
    field_meadow: 'Meadow',
    receipt_unreadable: 'Diesel receipt',
    herd: 'Your herd',
    pigs: 'Your pigs',
    field_river: 'River field',
    field_road: 'Road field',
    field_upper: 'Upper field',
    fields_other: 'Your other fields',
    details: 'Your details',
    measures: 'Choose your measures',
    receipts: 'Your input receipts',
    submit: 'Sign and submit',
  } as Record<string, string>,
  receiptsMissingTitle: 'Upload your input receipts',
  /** The one next action, said as what to do. */
  start: { bank: 'Start with your account for payments', renewal: 'Start by renewing your active farmer status' } as Record<string, string>,
  action: {
    renewal: 'Renew your active farmer status',
    bank: 'Check your account for payments',
    household: 'Check your household',
    details: 'Confirm your details',
    calvings: 'Confirm your cows that calved',
    field_meadow: 'Check the meadow',
    fields_other: 'Confirm your other fields',
    receipt_unreadable: 'Send a clearer diesel receipt',
    herd: 'Check your herd',
    pigs: 'Tell us about your pigs',
    field_river: 'Check the river field',
    field_road: 'Check the road field',
    field_upper: 'Check the upper field',
    measures: 'Choose your measures',
    receipts: 'Confirm your input receipts',
  } as Record<string, string>,
  /** A confirmation's one button. */
  confirm: "Yes, that's right",
  review: 'Review this boundary',
  reviewSplit: 'Split the field on the map',
  reviewDraw: 'Draw where your field ends',

  work: {
    river_split: 'Split the field',
    road_redraw: 'Redraw the field',
    upper_redraw: 'Redraw the field',
    pigs_declare: 'Declare your pigs',
    bank_enter: 'Type in your account number',
  } satisfies Record<WorkId, string>,
  reason: {
    one_crop: 'one crop in the whole field (the state may still check it)',
    edge_moved: 'GSA moved the edge to the road for you',
    kept_until_checked: 'we asked for a correction instead',
    neighbour_line: "GSA moved your edge to your neighbour's line",
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

  household: {
    context: (relation: string, name: string) => `The population register shows your ${relation} ${name} now lives at your address`,
    question: (first: string) => `Is ${first} a member of your farm household?`,
    hint: "It doesn't change your estimate",
    added: (name: string) => `${name} added to your household`,
    notMember: 'Not a member of your farm household',
  },

  calvings: {
    lead: (n: number) => `${n} cows calved between 1 April 2025 and 31 March 2026`,
    source: 'From the animal registry',
    wrong: 'Not right? Ask the registry to check',
    asked: (n: number) => `The registry will check, and ${n} counts until then`,
    done: (n: number) => `${n} cows calved`,
  },

  meadow: {
    context: 'The satellite photos show no mowing or grazing on the meadow last summer',
    question: 'Will you mow or graze the meadow this year?',
    hint: 'A meadow needs mowing or grazing at least once a year to get support',
    answerYes: 'Yes, I will',
    answerNo: 'No, not this year',
    kept: "You'll mow or graze it, the state may check it",
    out: (ha: string) => `Left out this year, ${ha} less`,
  },

  suggest: {
    green_cover: 'The satellite photos show your wheat fields stayed green all winter',
    insemination: (n: number) => `The animal registry shows ${n} inseminations by your vet since last April`,
  },

  unreadable: {
    context: (name: string) => `${name} is too blurry to read the amount`,
    hint: 'Take a new photo in good light, with the whole receipt in it',
    upload: 'Choose a new photo',
    done: (name: string) => `New photo of ${name} attached`,
  },

  renewal: {
    body: 'You need it to submit, and you can prepare everything else first',
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
    keepBoth: 'We keep both numbers, and the registry stays the official record until it has checked',
    canSubmit: "You can still submit, and this doesn't change your estimate",
    differs: (his: number, reg: number) => `You said ${his}, the registry shows ${reg}`,
    willCheck: 'the registry will check',
    sendJelena: 'Send this to Jelena',
  },

  jelena: {
    who: 'Jelena, your advisor at PSSS Čačak, sees only this problem',
    noteLabel: 'Add a note (optional)',
    noteHint: 'For example, what happened to the animals',
    send: 'Send to Jelena',
    cancel: 'Cancel',
    state: {
      assigned: 'Jelena has your problem',
      waiting_office: 'Jelena asked the animal registry to check',
      waiting_farmer: 'Jelena needs more from you',
      resolved: 'Jelena has sorted this out',
    } satisfies Record<CaseState, string>,
    asks: 'Jelena asks: can you tell her when you sold or slaughtered the cattle that left?',
    replyLabel: 'Your reply',
    reply: 'Send reply',
  },

  river: {
    context: 'The satellite photo shows the lower part of the field looks different from the rest',
    /** What GSA makes of the photo, so he can tell at a glance whether it's right. */
    insight: [
      'The dotted area is the strip along the river, where the field floods most springs',
      "This year it's greening later than the wheat above it",
      'That usually means another crop was sown there after the water went down',
    ],
    question: 'Are you growing two crops in the river field?',
    hint: "The photo can't see what you planted, so you decide",
    yes: 'Yes, two crops',
    no: 'No, one crop',
    answerYes: 'Two crops',
    answerNo: 'One crop',
    mayCheck: 'the state may still check it',
    split: (a: string, b: string) => `${a}, ${b}`,
    part: (crop: string, area: string) => `${crop} ${area}`,
  },

  road: {
    context: 'The land map now marks a strip of this field as road',
    area: (from: string, to: string) => `${from} becomes ${to}`,
    payment: (about: string) => `About ${about} less`,
    question: 'Did the road take part of this field?',
    yes: "Yes, it's road now",
    no: "No, it's still my field",
    done: (left: string) => `Now ${left}`,
    correctionAsked: "Correction asked for, and until it's checked the land map's area counts",
  },

  upper: {
    context: 'Your neighbour declared a strip along the bottom of this field this year',
    overlap: (ha: string) => `${ha} is declared by both of you, and only one of you can get support for it`,
    question: "Should we move your edge back to your neighbour's line?",
    yes: 'Yes, move my edge',
    no: 'No, the strip is mine',
    answerYes: "Moved to the neighbour's line",
    answerNo: 'The strip is mine',
    moved: (ha: string) => `Now ${ha}`,
    drawn: (ha: string) => `Drawn by you, ${ha}`,
    drawnOverlaps: "Your line and your neighbour's are both kept until the payments office checks them",
    redraw: 'Draw it again',
  },

  pigs: {
    context: (n: number) => `The animal registry shows ${n} pigs, and you didn't declare any last year`,
    question: 'Are they only for your household?',
    hint: "Household pigs don't need declaring, and no measure pays for them",
    answerYes: 'Household only',
    answerNo: 'I keep them to sell',
    household: 'Household only, nothing to declare',
    declared: (n: number) => `${n} pigs declared`,
  },

  fields: {
    row: (area: string, crop: string) => `${area}, ${crop}`,
  },


  details: {
    holder: 'Holder',
    place: 'Place',
    active: 'Active farmer',
    activeYes: 'Yes, this year',
    wrong: 'Records wrong? Ask for a correction',
    asked: 'Correction asked for, and the office that keeps the record will check it',
  },

  measures: {
    lead: (fit: number) => `You can apply for ${fit} measures this year`,
    groupLast: 'You had these last year',
    groupSuggested: (n: number) => (n === 1 ? 'GSA found 1 more that fits your farm' : `GSA found ${n} more that fit your farm`),
    groupMore: (n: number) => `${n} more measures you can apply for`,
    chosen: (n: number, fit: number) => `${n} of ${fit} chosen`,
    lastYear: 'You had it last year',
    plant: (ha: string, rate: string, total: string) => `${ha} × ${rate} dinars, about ${total}`,
    cows: (n: number, rate: string, total: string) => `${n} cows that calved × ${rate} dinars, about ${total}`,
    others: (list: string) => `Not for your farm: ${list}`,
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
      organic: 'Needs a certified organic farm',
      milk: 'Needs milk sold to a dairy',
    } satisfies Record<MeasureId, string>,
    add: (list: string) => `To apply, add ${list}`,
    ready: 'Everything is added',
    ruledOut: "Can't be paid this year",
    leaveOut: 'Leave this measure out',
    attached: (name: string) => `Attached: ${name}`,
    error: {
      upload: 'Add a photo or PDF',
      number: 'Enter a number, like 50',
      text: 'Fill this in',
      longtext: 'Fill this in',
      choice: 'Choose one',
      fields: 'Choose at least one field',
      confirm: 'Tick the box to apply',
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
      ruledOut: 'This measure only pays for cows in the herd book, so leave it out this year. Jelena can tell you how to enter them',
    },
    vet_certificate: { label: "Your vet's insemination certificate", short: 'vet certificate' },
    cover_fields: { label: 'Which fields stay green over winter?', short: 'fields' },
    cover_promise: { label: "I'll keep them covered from autumn to spring", short: 'your promise' },
    water_permit: { label: 'Your permit to take water', hint: 'From the water authority, a photo is enough', short: 'water permit' },
    how_water: { label: 'How do you water your fields?', hint: 'For example, a pump from the river to the river field', short: 'how you water' },
  } as Record<string, { label: string; short: string; hint?: string; options?: Record<string, string>; ruledOut?: string }>,

  auto: {
    land: (ha: string, n: number) => `${ha} in ${n} fields, from the land map`,
    receipts: (n: number) => `${n} files you uploaded`,
    receiptsMissing: 'Still to upload',
    calvings: (n: number) => `${n} cows calved, from the animal registry`,
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
  flag: 'Along the river, looks different',
  notMown: 'No mowing seen',
  strip: (ha: string) => `${ha} now road`,
  edge: "The line stops at your field's edge, because land outside it can't get support",
  neighbour: "Neighbour's field",
  both: (ha: string) => `${ha} declared by both`,
  imagery: 'Imagery © Esri',
  keys: 'Drag or use the arrow keys to move the map, and plus or minus to zoom',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  backTo: (field: string) => `Back to the ${field.toLowerCase()}`,
  backToFields: 'Back to your fields',
  wholeFarm: 'Whole farm',
  larger: 'Show larger map',
  smaller: 'Show smaller map',
  back: 'Back to your application',
}

/** Drawing where a field ends, on a real map. */
export const draw = {
  label: (field: string) => `Map: drag the corners of the ${field.toLowerCase()} to where it ends`,
  how: 'Drag a corner, or drag an edge to add one',
  area: (ha: string) => `Your field: ${ha}`,
  loading: 'Loading the map',
  problem: {
    crosses_itself: 'The edges cross each other, so move a corner back to make one shape',
    outside_land: "Part of the field is outside registered farmland, which can't get support. Move the corner back inside the dashed line",
    overlaps_neighbour: '',
    overlaps_own: 'The field runs into another of your fields, so move the corner back',
    too_small: "The field is too small, so start again from last year's line",
  } satisfies Record<DrawingProblem, string>,
  stillOverlaps: (ha: string) => `Your line still runs ${ha} into your neighbour's field. If that's right, save it and the payments office checks both lines`,
  undo: 'Undo',
  reset: "Start again from last year's line",
  save: 'Save my field',
  useSlider: 'Use a slider instead',
  useMap: 'Drag on the map instead',
  sliderLabel: 'Where your field ends at the bottom, in metres from the top',
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
    title: 'Sign and submit',
    readyTitle: 'Ready to submit. The state still checks:',
    blockedTitle: 'Before you submit',
    goTo: (what: string) => `Go to: ${what}`,
    awaitingTitle: 'Waiting for a check',
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
    back: 'Back to your application',
  },
  receipt: {
    title: 'Your application is submitted.',
    thanks: "Thank you, Milan, there's nothing more you need to do now",
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
    amendText: "You can amend your application until the national deadline, and you'll sign the declaration again",
    amend: 'Amend your application',
  },
  renewal: {
    title: 'Renew your active farmer status',
    why: "You need it to submit, and it's separate from your application",
    button: 'Renew my status',
    doneTitle: "You're an active farmer.",
    doneNext: 'Next: your application',
    continue: 'Continue to your application',
  },
}

export const proto = {
  open: 'Prototype',
  title: 'Prototype controls',
  notPart: 'Not part of GSA',
  scenario: 'Scenario',
  signInAs: 'Sign in as',
  milan: 'Milan (farmer)',
  jelena: 'Jelena (advisor)',
  notes: 'Show design notes',
  reset: 'Reset this scenario',
}

export const advisor = {
  nav: { queue: 'Problems sent to you', milan: "Milan's application" },
  title: 'Problems sent to you',
  shortcuts: 'J next, K previous, O open',
  listLabel: 'Cases',
  state: {
    assigned: 'Yours to act on',
    waiting_office: 'Waiting for another office',
    waiting_farmer: 'Waiting for the farmer',
    resolved: 'Resolved',
  } satisfies Record<CaseState, string>,
  next: {
    assigned: () => 'Next: you',
    waiting_office: (office: string) => `Next: ${office}`,
    waiting_farmer: () => 'Next: the farmer',
    resolved: () => 'Nothing left to do',
  } satisfies Record<CaseState, (office: string) => string>,
  reply: "Farmer's reply",
  blocks: 'Blocks submission',
  deadline: (d: string) => `Deadline ${d}`,
  owner: (office: string) => `The official record belongs to ${office}`,
  kind: {
    herd_discrepancy: 'Herd differs from the animal registry',
    inherited_parcel: "Parcel still in a late parent's name",
  },
  note: "Farmer's note",
  noNote: 'No note',
  record: 'Animal registry',
  his: 'Farmer declared',
  act: {
    referred: (office: string) => `Ask ${office} to check`,
    asked_farmer: 'Ask the farmer',
    resolved: 'Mark as resolved',
    openApp: 'Open his application',
  },
  historyTitle: 'Action history',
  historyHead: { when: 'When', who: 'Who', what: 'What' },
  history: {
    answer_herd: 'Answered the herd question',
    set_herd_count: 'Gave his own cattle count',
    send_to_jelena: 'Sent the problem to Jelena',
    ask_record_check: 'Asked for a record correction',
    answer_river: 'Answered the river field question',
    set_split: 'Split the river field',
    answer_road: 'Answered the road question',
    answer_upper: 'Answered the upper field question',
    set_upper_drawing: 'Drew where the upper field ends',
    answer_pigs: 'Answered the pigs question',
    choose_measures: 'Chose measures',
    save_measure: 'Added what a measure needs',
    reply_to_jelena: 'Replied to Jelena',
    undo: 'Undid his last answer',
    farmer_replied: 'Farmer replied',
    confirm: 'Confirmed part of the application',
    answer_bank: 'Answered the account question',
    set_bank_account: 'Gave his account for payments',
    answer_household: 'Answered the household question',
    answer_meadow: 'Answered the meadow question',
    attach_document: 'Attached a document',
    renew: 'Renewed active farmer status',
    sign_declarations: 'Signed the declaration',
    submit: 'Submitted the application',
    amend: 'Reopened the application to amend it',
    opened: 'Opened the case',
    referred: 'Asked the record owner to check',
    asked_farmer: 'Asked the farmer',
    resolved: 'Marked as resolved',
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
  left: (n: number) => (n === 1 ? '1 thing left' : `${n} things left`),
  done: 'Done',
  /** Under each part's name in the stepper. */
  status: (left: number) => (left === 1 ? '1 thing to do' : left ? `${left} things to do` : 'Done'),
  waiting: 'Waiting for a check',
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
  cattleChecking: (his: number, reg: number) => `${his} cattle, the registry shows ${reg}`,
  pigs: (n: number) => `${n} pigs`,
  pigsHousehold: (n: number) => `${n} pigs for the household`,
  measuresValue: (n: number, fit: number) => `${n} of ${fit} you can apply for`,
  source: { records: 'From government records', confirmed: 'Confirmed by you', checking: 'Waiting for a check' } satisfies Record<Source, string>,
  partly: (n: number, of: number) => `${n} of ${of} confirmed by you`,
  details: 'See each part',
}
