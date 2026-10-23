// All UI text. British spelling, plain language, short sentences, no em dashes.
import type { Crop, FieldId, MeasureId, Office, ScenarioId } from '../data/scenarios'
import type { DrawingProblem } from '../logic/geometry'
import type { RemovalReason, WorkId } from '../logic/application'
import type { CaseState } from '../logic/advisor'
import type { ApplicationState } from '../logic/readiness'
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
    left: (n: number) => (n === 1 ? '1 thing left before you can submit' : `${n} things left before you can submit`),
    headline: {
      waiting_for_renewal: 'Renew your status to submit',
      ready_to_submit: 'Ready to submit',
      submitted: 'Submitted',
    } satisfies Record<Exclude<ApplicationState, 'action_required'>, string>,
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
  } satisfies Record<ImpactReason, (ha: string, about: string) => string>,

  estimate: {
    title: 'Estimated subsidy',
    basis: "Based on what you've told us so far",
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
  greeting: 'Welcome back, Milan',
  deadline: (n: number, closes: string) =>
    `${n === 1 ? '1 day' : `${n} days`} left to apply for subsidies (closes ${formatDateYear(closes)})`,
  activeFarmer: "You're an active farmer for this year",
  listTitle: 'Your application',
  changes: (n: number) => (n === 1 ? '1 thing looks different from last year' : `${n} things look different from last year`),
  waiting: (n: number) => `Waiting for a check (${n})`,
  done: (n: number) => `Done (${n})`,
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

/** GSA's one line on what to do next and why, in his own numbers. */
export const nudge = {
  label: 'What to do next',
  line: {
    herd_unanswered: (reg: number, last: number) => `Start with your herd: the animal registry shows ${reg} cattle and you declared ${last} last year`,
    herd_needs_count: "Tell us how many cattle you have today, and we'll keep your number next to the registry's",
    herd_jelena_asks: 'Jelena needs more from you about your herd, so answer her question',
    pigs_unanswered: (n: number) => `The registry shows ${n} pigs you didn't declare last year, so tell us what they're for`,
    river_unanswered: 'The satellite photo shows the lower part of the river field looks different, so tell us what you planted',
    river_needs_split: "We drew a line where the photo changes. Move it if it's not quite right and pick a crop for each part",
    road_unanswered: 'The land map now marks a strip of the road field as road, so check it before it changes your area',
    upper_unanswered: 'Your neighbour declared a strip of your upper field this year, and only one of you can get support for it',
    upper_needs_drawing: 'Show where your upper field really ends by dragging its corners on the map',
    measures_to_choose: (fit: number, last: number) => `You can apply for ${fit} measures this year, and we've ticked the ${last} you had last year`,
    measure_needs_input: (name: string, n: number) => `${name} needs ${n === 1 ? 'one more thing' : `${n} more things`} from you`,
    measure_ruled_out: (name: string) => `${name} can't be paid on your answer, so leave it out or change the answer`,
    receipts_missing: 'Plant production support needs your input receipts, and a photo is enough',
    same: 'The rest is the same as last year, so have a look and confirm it in one go',
    renewal: 'Renew your active farmer status first. You can prepare everything else meanwhile',
    submit: 'Everything is filled in, so sign the declaration and submit',
  },
}

/** What his last answer changed in the application, shown until his next answer. */
export const after = {
  title: 'After your answer',
  done: (task: string, outcome: string) => `${task}: ${outcome}`,
  waiting: (task: string) => `${task} waits for a check, and you can still submit`,
  removed: (work: string, reason: string) => `No longer needed: ${work.toLowerCase()}, ${reason}`,
  undo: 'Undo',
  undoLabel: 'Undo your last answer',
}

export const tasks = {
  title: {
    renewal: 'Renew your active farmer status',
    same: 'Same as last year',
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

  work: {
    river_split: 'Split the field',
    road_redraw: 'Redraw the field',
    upper_redraw: 'Redraw the field',
    pigs_declare: 'Declare your pigs',
  } satisfies Record<WorkId, string>,
  mightNeed: (work: string) => `Might also need: ${work.toLowerCase()}`,
  reason: {
    one_crop: 'one crop in the whole field (the state may still check it)',
    edge_moved: 'GSA moved the edge to the road for you',
    kept_until_checked: 'we asked for a correction instead',
    neighbour_line: "GSA moved your edge to your neighbour's line",
    household: "household pigs don't need declaring",
  } satisfies Record<RemovalReason, string>,

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
    context: 'The satellite photo shows the lower part looks different',
    source: 'Source: satellite photo',
    question: 'Are you growing two crops in the river field?',
    hint: "The photo can't see what you planted, so you decide",
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
    done: (left: string) => `Now ${left}`,
    correctionAsked: "Correction asked for, and until it's checked the land map's area counts",
  },

  upper: {
    context: 'Your neighbour declared a strip along the bottom of this field this year',
    source: "Source: this year's applications",
    overlap: (ha: string) => `${ha} is declared by both of you, and only one of you can get support for it`,
    question: "Should we move your edge back to your neighbour's line?",
    hint: 'Choose No if the strip is yours, then show where your field ends',
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

  same: {
    confirm: 'Yes, all the same as last year',
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
    lead: (fit: number) => `You can apply for ${fit} measures`,
    leadHint: (last: number) => `The ${last} you had last year are ticked. Each one says what it needs from you`,
    chosen: (n: number, fit: number) => `${n} of ${fit} chosen`,
    lastYear: 'You had it last year',
    plant: (ha: string, rate: string, total: string) => `${ha} × ${rate} dinars, about ${total}`,
    cows: (n: number, rate: string, total: string) => `${n} cows that calved × ${rate} dinars, about ${total}`,
    fromRecords: 'Nothing to add, GSA has it from your records',
    youAdd: (list: string) => `You add: ${list}`,
    others: (n: number) => `Don't fit your farm (${n})`,
    confirm: (n: number) => (n === 1 ? 'Apply for 1 measure' : `Apply for ${n} measures`),
    noneError: 'Choose at least one measure to apply for',
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
    needs: (list: string) => `Add: ${list}`,
    ready: 'Everything added',
    ruledOut: "Can't be paid this year",
    save: 'Save',
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

  submit: {
    go: 'Sign and submit',
  },
}

export const map = {
  title: 'Map of your fields',
  strip: (ha: string) => `${ha} road`,
  edge: "The line stops at your field's edge, because land outside it can't get support",
  neighbour: 'Neighbour',
  both: (ha: string) => `${ha} both`,
}

/** Drawing where a field ends, on a real map. */
export const draw = {
  label: (field: string) => `Map: drag the corners of the ${field.toLowerCase()} to where it ends`,
  how: 'Drag a corner, or drag an edge to add a corner. Corners stick to the lines nearby',
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
  chooseError: 'Choose a crop for this part',
  sameError: 'Choose a different crop from the other part',
  undo: 'Undo',
  confirm: 'Confirm the split',
}

export const finish = {
  submit: {
    title: 'Sign and submit',
    readyTitle: 'Ready to submit. The state still checks:',
    blockedTitle: 'Before you submit:',
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
    signError: 'Tick the box to confirm the declaration, then you can submit',
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
  sent: (d: string) => `Sent ${d}`,
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
    confirm_same: 'Confirmed what is the same as last year',
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

export const readinessCopy = {
  needs: (n: number) => `Needs you (${n})`,
  waiting: (n: number) => `Waiting for a check (${n})`,
  waitingNote: "These don't stop you submitting",
  done: (n: number) => `Done (${n})`,
  open: 'Open',
  change: 'Change',
}

export const bar = {
  label: 'Application',
  back: 'Back',
  next: (task: string) => `Next: ${task}`,
  toSubmit: 'Sign and submit',
}

/** His farm as GSA knows it now, updated by every answer. */
export const farm = {
  title: 'Your farm this year',
  land: 'Land',
  crops: 'Crops',
  animals: 'Animals',
  measures: 'Measures',
  landValue: (ha: string, n: number) => `${ha} in ${n} fields`,
  crop: (crop: string, ha: string) => `${crop} ${ha}`,
  cattle: (n: number) => `${n} cattle`,
  cattleChecking: (his: number, reg: number) => `${his} cattle (registry ${reg}, being checked)`,
  pigs: (n: number) => `${n} pigs`,
  pigsHousehold: (n: number) => `${n} pigs for the household`,
  measuresValue: (n: number, fit: number) => `${n} of ${fit} you can apply for`,
}
