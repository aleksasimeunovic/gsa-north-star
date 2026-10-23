// All UI text. British spelling, plain language, short sentences, no em dashes.
import type { Crop, FieldId, MeasureId, Office, ScenarioId } from '../data/scenarios'
import type { RemovalReason, TaskId, WorkId } from '../logic/application'
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
  continue: 'Continue',
  close: 'Close',

  status: {
    complete: 'Complete',
    action_required: 'Needs your action',
    awaiting_verification: 'Awaiting verification',
  } satisfies Record<Status, string>,

  readiness: {
    label: 'Is my application ready?',
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
    eco_scheme: 'Eco-scheme: green cover over winter',
  } satisfies Record<MeasureId, string>,
  offices: { animal_registry: 'the animal registry', land_registry: 'the land registry' } satisfies Record<Office, string>,

  impact: {
    road_took_area: (ha: string, about: string) => `The road took ${ha}. About ${about} less.`,
    road_pending_correction: (ha: string, about: string) => `Until the correction is checked, ${ha} doesn't count. About ${about} less.`,
  } satisfies Record<ImpactReason, (ha: string, about: string) => string>,

  estimate: {
    title: 'Estimated subsidy based on current information',
    about: (d: string) => `About ${d}`,
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
  deadline: (closes: string) => `Submit by ${formatDate(closes)}.`,
  daysLeft: (n: number) => (n === 1 ? '1 day left' : `${n} days left`),
  activeFarmer: "You're an active farmer for this year.",
  intro: (n: number) => `We've filled in your application from last year and the state's records. Check ${n} changes and confirm the rest.`,
  listTitle: 'Your application',
  changes: (n: number) => (n === 1 ? '1 change since last year' : `${n} changes since last year`),
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
  },
}

export const tasks = {
  title: {
    renewal: 'Renew your active farmer status',
    same: 'Same as last year',
    herd: 'Your herd',
    field_river: 'River field',
    field_road: 'Road field',
    fields_other: 'Your other fields',
    details: 'Your details',
    measures: 'Your measures',
    receipts: 'Your input receipts',
    submit: 'Sign and submit',
  } as Record<TaskId | 'submit', string>,
  receiptsMissingTitle: 'Upload your input receipts',

  work: {
    herd_by_tag: 'Update each animal by ear tag',
    river_split: 'Split the field',
    road_redraw: 'Redraw the field',
  } satisfies Record<WorkId, string>,
  mayBeNeeded: 'May be needed',
  notNeeded: 'Not needed',
  reason: {
    registry_has_count: 'The registry already has your 38 cattle.',
    both_kept: "Your number is kept beside the registry's.",
    one_crop: 'One crop in the whole field. The state may still check it.',
    edge_moved: 'GSA moved the edge to the road for you.',
    kept_until_checked: 'We asked for a correction instead.',
  } satisfies Record<RemovalReason, string>,

  renewal: {
    body: 'You need it to submit. You can prepare everything else first.',
    button: 'Renew now',
  },

  herd: {
    lastYear: 'Last year you declared',
    registry: 'Animal registry today',
    registryShort: 'Animal registry',
    yoursToday: 'You, today',
    question: (n: number) => `Do you have ${n} cattle now?`,
    summary: (reg: number, last: number) => `Registry ${reg}. Last year you declared ${last}.`,
    done: (n: number) => `${n} cattle`,
    countLabel: 'How many cattle do you have today?',
    countHint: 'Include calves.',
    countError: 'Enter a whole number, like 41.',
    countSave: 'Save my number',
    keepBoth: 'We keep both numbers. The registry stays the official record until it has checked.',
    canSubmit: 'You can still submit.',
    sameEstimate: "This doesn't change your estimate.",
    differs: (his: number, reg: number) => `You: ${his}. Registry: ${reg}.`,
    willCheck: 'The registry will check.',
    sendJelena: 'Send this to Jelena',
  },

  jelena: {
    who: 'Jelena, your advisor at PSSS Čačak, sees only this problem.',
    noteLabel: 'Add a note (optional)',
    noteHint: 'For example, what happened to the animals.',
    send: 'Send to Jelena',
    cancel: 'Cancel',
    state: {
      assigned: 'Jelena has your problem.',
      waiting_office: 'Jelena asked the animal registry to check.',
      waiting_farmer: 'Jelena needs more from you. She will call you.',
      resolved: 'Jelena has sorted this out.',
    } satisfies Record<CaseState, string>,
  },

  river: {
    context: 'The satellite photo shows the lower part looks different.',
    source: 'Source: satellite photo',
    question: 'Are you growing two crops in the river field?',
    hint: "The photo can't see what you planted. You decide.",
    answerYes: 'Two crops',
    answerNo: 'One crop',
    mayCheck: 'The state may still check it.',
    split: (a: string, b: string) => `${a}, ${b}`,
    part: (crop: string, area: string) => `${crop} ${area}`,
  },

  road: {
    context: 'The land map now marks a strip of this field as road.',
    area: (from: string, to: string) => `${from} becomes ${to}`,
    payment: (about: string) => `About ${about} less`,
    question: 'Did the road take part of this field?',
    done: (left: string) => `Now ${left}`,
    correctionAsked: "Correction asked for. Until it's checked, the land map's area counts.",
  },

  fields: {
    row: (area: string, crop: string) => `${area} · ${crop}`,
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
    asked: 'Correction asked for. The office that keeps the record will check it.',
  },

  measures: {
    plant: (ha: string, rate: string, total: string) => `${ha} × ${rate} = about ${total}`,
    cows: (n: number, rate: string, total: string) => `${n} cows that calved × ${rate} = about ${total}`,
    plantPart: 'Keep your receipts for seed, fertiliser and other inputs.',
    cowsPart: 'Keep the calves registered in the animal registry.',
    plantWhy: 'You farm arable land.',
    cowsWhy: (from: string, to: string) => `Calved between ${from} and ${to}.`,
    others: (n: number) => `Other measures (${n})`,
    doesNotFit: "Doesn't fit your farm this year.",
    ecoCondition: 'Your arable fields stay covered from autumn to spring.',
    done: (n: number) => `${n} measures`,
  },

  receipts: {
    needed: 'Plant production support needs them.',
    upload: 'Choose a photo or PDF',
    files: (n: number) => `${n} files attached`,
  },

  submit: {
    go: 'Sign and submit',
  },
}

export const map = {
  title: 'Map of your fields',
  yours: 'Your fields',
  registered: 'Land the government has registered',
  plots: 'Show land register plots',
  strip: (ha: string) => `${ha} road`,
  edge: "The line stops at your field's edge. Land outside it can't get support.",
}

export const split = {
  proposed: 'Line placed where the satellite photo changes.',
  moveLine: 'Drag the line to move it',
  handleStart: 'Left end of the line',
  handleEnd: 'Right end of the line',
  keys: 'Arrow keys move it.',
  useSlider: 'Use a slider instead',
  useDrag: 'Drag the line instead',
  sliderLabel: 'Where the second crop starts, from the top',
  noCross: 'The line needs to cross the whole field. Move one end.',
  part: { top: 'Top part', bottom: 'Bottom part', left: 'Left part', right: 'Right part' },
  partArea: (part: string, area: string) => `${part}: ${area}`,
  cropFor: (part: string, area: string) => `Crop in the ${part.toLowerCase()} (${area})`,
  choose: 'Choose a crop',
  chooseError: 'Choose a crop for this part.',
  sameError: 'Choose a different crop from the other part.',
  undo: 'Undo',
  confirm: 'Confirm the split',
}

export const finish = {
  submit: {
    title: 'Sign and submit',
    readyTitle: "You're ready to submit, Milan.",
    readyNote: 'Nothing needs your action. Ready does not mean approved.',
    blockedTitle: 'Before you submit:',
    goTo: (what: string) => `Go to: ${what}`,
    awaitingTitle: 'Awaiting verification',
    awaitingNote: 'These wait for a check. You can still submit.',
    checksTitle: 'What the state will still check',
    checks: {
      eligibility: 'That you and each measure are eligible.',
      records: 'Your answers against the animal registry and the land map.',
      inspection: 'Some farms are inspected on the ground.',
      payment: 'The final amount. The estimate may change.',
    },
    declarationTitle: 'Declaration',
    signError: 'Tick the box to confirm the declaration. Then you can submit.',
    declaration: 'I confirm under full criminal and material liability that the information in this application is true.',
    button: 'Submit application',
    back: 'Back to your application',
  },
  receipt: {
    title: 'Your application is submitted.',
    thanks: 'Thank you, Milan. There is nothing more you need to do now.',
    when: (d: string) => `Submitted on ${d}.`,
    reference: 'Reference number',
    referenceNote: 'Keep this number.',
    nextTitle: 'What happens next',
    next: [
      'The state checks your application against its records.',
      'Some farms are inspected on the ground.',
      'You will be told the decision and the payment in GSA.',
    ],
    amendTitle: 'Need to change something?',
    amendText: 'You can amend your application until the national deadline. You will sign the declaration again.',
    amend: 'Amend your application',
  },
  renewal: {
    title: 'Renew your active farmer status',
    why: 'You need it to submit. It is separate from your application.',
    button: 'Renew my status',
    doneTitle: "You're an active farmer.",
    doneNext: 'Next: your application.',
    continue: 'Continue to your application',
  },
}

export const proto = {
  open: 'Prototype',
  title: 'Prototype controls',
  notPart: 'Not part of GSA. These controls exist only to explore the prototype.',
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
  waitingFor: (office: string) => `Waiting for ${office}`,
  blocks: 'Blocks submission',
  deadline: (d: string) => `Deadline ${d}`,
  kind: {
    herd_discrepancy: 'Herd differs from the animal registry',
    inherited_parcel: "Parcel still in a late parent's name",
  },
  owner: (office: string) => `The official record belongs to ${office}.`,
  sent: (d: string) => `Sent ${d}`,
  note: "Farmer's note",
  noNote: 'No note.',
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
