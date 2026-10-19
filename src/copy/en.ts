// All UI text. British spelling, plain language, short sentences, no em dashes.
import type { Crop, FieldId, MeasureId, ScenarioId } from '../data/scenarios'
import type { ApplicationState } from '../logic/readiness'
import type { ImpactReason, ItemDetail, Status, StepId } from '../logic/status'
import type { Fate, StepMode, TestedStepId } from '../logic/wizard'

const num = new Intl.NumberFormat('en-GB')
export const formatDinars = (n: number) => `${num.format(Math.round(n))} dinars`
export const formatHa = (ha: number) => `${ha.toFixed(2)} ha`

export const en = {
  appName: 'GSA',
  footer: 'North Star concept by Aleksa Simeunović. Not built or tested. Not part of the UN engagement.',
  saved: 'Saved',

  status: {
    complete: 'Complete',
    action_required: 'Needs your action',
    awaiting_verification: 'Awaiting verification',
  } satisfies Record<Status, string>,

  applicationState: {
    waiting_for_renewal: 'Renew your active farmer status first',
    action_required: 'Needs your action',
    ready_to_submit: 'Ready to submit',
    submitted: 'Submitted',
  } satisfies Record<ApplicationState, string>,

  thingsNeedAction: (n: number) => (n === 1 ? '1 thing needs your action' : `${n} things need your action`),
  daysLeft: (n: number) => (n === 1 ? '1 day left' : `${n} days left`),

  steps: {
    herd: 'Herd',
    land: 'Land',
    everything_else: 'Everything else',
    submit: 'Submit',
  } satisfies Record<StepId, string>,

  stepMode: {
    confirm: 'One confirmation',
    open_on_change: 'Opens on the change',
    full: 'All questions',
  } satisfies Record<StepMode, string>,

  testedSteps: {
    general_data: 'General data',
    measures: 'Measures',
    parcels: 'Parcels',
    animal_measures: 'Animal measures',
    attachments: 'Attachments',
    declarations: 'Declarations',
    conditionality: 'Conditionality',
    summary: 'Summary',
  } satisfies Record<TestedStepId, string>,

  fate: {
    folded_read_only: 'Folded in. Records shown read-only, confirmed once',
    kept_fitting_first: "Last year's kept. Ones that fit come first, with reasons",
    opens_on_change: 'Opens on what changed. Everything else still shown',
    one_confirmation: 'One confirmation',
    asked: 'Asked, because a document is missing',
    asked_only_if_missing: 'Asked only if a document is missing',
    signed_once: 'Signed once',
    left_out: "Rules that don't apply to your farm are left out",
    replaced_by_readiness: 'Replaced by readiness on every screen',
    hidden_no_animals: 'Hidden. No animals on your farm',
    asked_in_full: 'Asked in full. There is no last year to start from',
  } satisfies Record<Fate, string>,

  fields: {
    river: 'River field',
    road: 'Road field',
    upper: 'Upper field',
    meadow: 'Meadow',
    house: 'House field',
  } satisfies Record<FieldId, string>,

  crops: {
    wheat: 'Wheat',
    maize: 'Maize',
    sunflower: 'Sunflowers',
    grassland: 'Grassland and fodder',
    barley: 'Barley',
    soya: 'Soya',
  } satisfies Record<Crop, string>,

  items: {
    herd: 'Herd',
    general_data: 'General data',
    measures: 'Measures',
    documents: 'Documents',
  } as Record<string, string>,

  itemDetail: {
    herd_unanswered: 'The animal registry shows a different number.',
    herd_needs_count: 'Tell us how many cattle you have today.',
    herd_confirmed: 'Herd confirmed.',
    herd_differs: "Your number and the registry's are both kept until the registry checks it.",
    river_unanswered: 'The satellite photo shows part of this field looks different.',
    river_needs_split: 'Draw one line where the second crop starts, then pick both crops.',
    river_split_done: 'Split into two parts, each with its crop.',
    river_needs_choice: 'Redraw the field, or ask for a field check.',
    river_needs_redraw: 'Redraw the field.',
    river_redrawn: 'Field redrawn.',
    river_field_check: "Field check asked for. This part won't count unless it is checked.",
    road_unanswered: 'The land map shows part of this field is now road.',
    road_confirmed: 'The road took part of this field.',
    road_needs_correction: 'Mark the strip and ask for a correction.',
    road_correction_requested: 'Correction asked for. The land map stays the official record until it is checked.',
    field_unchanged: 'Same as last year.',
    field_to_draw: 'Draw this field once. Next year it will be your starting point.',
    records_from_registry: 'From government records. Read-only.',
    measures_kept: "Last year's measures, kept.",
    measures_to_choose: 'Choose your measures.',
    documents_attached: 'Input receipts attached.',
    documents_missing: 'Input receipts are missing. Upload them from your computer or phone.',
  } satisfies Record<ItemDetail, string>,

  impact: {
    road_took_area: (ha: string, about: string) => `The road took ${ha}. About ${about} less.`,
    road_pending_correction: (ha: string, about: string) =>
      `Shown with the land map's area until your correction is checked: ${ha}, about ${about} less.`,
    field_check_pending: (ha: string, about: string) => `${ha} won't count unless it is checked. About ${about} less.`,
  } satisfies Record<ImpactReason, (ha: string, about: string) => string>,

  measures: {
    plant_production: 'Basic support for plant production',
    cows_raising_calves: 'Cows raising calves for fattening',
    eco_scheme: 'Eco-scheme: green cover over winter',
  } satisfies Record<MeasureId, string>,

  estimate: {
    title: 'Estimated subsidy based on current information',
    about: (d: string) => `About ${d}`,
    scope: 'Covers only this application.',
    caveat: 'The payment still depends on inspection and final eligibility.',
  },

  scenarios: {
    second_year: 'Second year',
    second_year_not_renewed: 'Second year, not renewed',
    first_year: 'First year',
    no_animals: 'No animals',
    missing_document: 'Missing document',
  } satisfies Record<ScenarioId, string>,
}

export const itemLabel = (id: string) =>
  id.startsWith('field_') ? en.fields[id.slice(6) as FieldId] : en.items[id] ?? id

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const dateYearFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
export const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`))
export const formatDateYear = (iso: string) => dateYearFmt.format(new Date(`${iso}T00:00:00Z`))

export const ui = {
  yes: 'Yes',
  no: 'No',
  why: 'Why am I seeing this?',
  changeAnswer: 'Change answer',
  close: 'Close',
  goToIt: 'Go to it',
  back: 'Back to your application',

  welcome: {
    greeting: 'Welcome back, Milan',
    greetingFirst: 'Welcome, Milan',
    window: (opens: string, closes: string) => `Applications are open from ${formatDate(opens)} to ${formatDate(closes)}.`,
    activeFarmer: "You're an active farmer. Your status is renewed for this year.",
    notRenewed:
      'Your active farmer status needs renewing before you can submit. You can prepare your application now.',
    changesIntro: (n: number) =>
      n === 1 ? 'One thing may have changed since last year.' : `${WORDS[n] ?? n} things may have changed since last year.`,
    changesSub: 'We found these in government records. Only you know what is true. Answer each one and your application adapts.',
    firstYear: "This is your first application in GSA. We've filled in what government records show. Check each part as you go.",
    noChanges: 'Nothing seems to have changed since last year.',
    continue: 'Continue to your application',
  },

  herd: {
    title: 'Herd',
    record: (reg: number, last: number) => `The animal registry shows ${reg} cattle. Last year you declared ${last}.`,
    question: (reg: number) => `Do you have ${reg} cattle now?`,
    why: 'The animal registry counts cattle by ear tag. It knows how many it has today, not what happened in between. Only you know if this is your herd now.',
    done: (n: number) => `Herd confirmed: ${n} cattle.`,
    replaced: 'Before, this meant changing nine ear tags one by one.',
    countLabel: 'How many cattle do you have today?',
    countHint: 'Count every animal you keep, calves included.',
    countError: 'Enter a whole number, for example 41.',
    countSave: 'Save my number',
  },

  conflict: {
    title: 'Your number and the registry are different',
    record: 'Animal registry',
    yours: 'You declared',
    explain: "The registry stays the official record until it's checked. We keep both numbers. You don't have to settle this yourself.",
    nonBlocking: "This doesn't stop you submitting. Only the herd part waits for the check.",
    askCheck: 'Ask the registry to check',
    checkAsked: 'The registry has been asked to check. You will see the result here.',
    sendJelena: 'Send to Jelena',
    carryOn: 'Carry on with your application',
  },

  jelena: {
    title: 'Send this problem to Jelena',
    who: 'Jelena, your advisor at PSSS Čačak, will see only this problem, with both numbers.',
    problem: (reg: number, his: number) => `Herd: the animal registry shows ${reg} cattle. Milan declared ${his}.`,
    noteLabel: 'Add a note (optional)',
    noteHint: 'For example, what happened to the animals.',
    send: 'Send to Jelena',
    cancel: 'Cancel',
    sent: 'Sent. Jelena will see this problem and your note.',
  },

  river: {
    title: 'River field',
    record: 'The satellite photo shows the lower part of the river field looks different from the rest.',
    question: 'Are you growing two crops in the river field?',
    why: "Satellite photos are taken through the season. They can see that part of a field looks different. They can't see what you planted. You decide.",
    done: 'Two crops in the river field.',
    next: 'Your land step will open on the river field. Draw one line where the second crop starts.',
    choose: 'What would you like to do?',
    redraw: 'Redraw the field',
    redrawHint: 'If the field itself has a different shape now.',
    fieldCheck: 'Ask for a field check',
    fieldCheckHint: "An inspector checks the field. This part won't count unless it is checked.",
    redrawNext: 'Your land step will open on the river field so you can redraw it.',
    fieldCheckDone: "Field check asked for. This part won't count unless it is checked. This doesn't stop you submitting.",
    openLand: 'Go to the river field',
  },

  road: {
    title: 'Road field',
    record: (ha: string) => `The land map now marks ${ha} of the road field as road. The road was widened.`,
    question: 'Did the road take part of this field?',
    why: 'The land map is the official record of land that can get support. When it changes, the area you can claim may change too.',
    done: (ha: string, left: string) => `The road took ${ha}. Your field is now ${left}.`,
    noIntro: "If the road didn't take this land, ask for a correction. You'll mark the strip on the map in the Land step.",
    askCorrection: 'Ask for a correction',
    correctionAsked: "Correction asked for. The land map stays the official record until it's checked. This doesn't stop you submitting.",
  },

  preview: {
    title: 'Your application this year',
    count: (n: number, tested: number) => `${n} steps this year. The tested version had ${tested}.`,
    waiting: 'Waiting for your answer above',
    includes: 'Includes',
    leftOut: 'Left out this year',
  },

  readiness: {
    label: 'Is my application ready?',
    counts: (action: number, awaiting: number, complete: number) =>
      `${action} need your action · ${awaiting} awaiting verification · ${complete} complete`,
    open: 'See all items',
    drawerTitle: 'Your application, item by item',
    groupHint: {
      action_required: 'These stop you submitting until they are done.',
      awaiting_verification: "These don't stop you submitting. Only that part waits for the check.",
      complete: 'Nothing left to do here.',
    } satisfies Record<Status, string>,
    renewal: 'Renew your active farmer status',
    readyNote: 'Ready to submit means nothing needs your action. It does not mean approved.',
    empty: 'None',
  },

  estimateHow: {
    toggle: 'How is this worked out?',
    plant: (ha: string, rate: string, total: string) => `${ha} × ${rate} per hectare = ${total}`,
    cows: (n: number, from: string, to: string, rate: string, total: string) =>
      `${n} cows that calved between ${from} and ${to} × ${rate} = ${total}`,
    total: (t: string) => `Total: ${t}`,
    receipts: 'Plant production support is justified with your input receipts.',
  },

  placeholder: {
    title: (step: string) => `${step}`,
    body: 'This step is built in the next phase of the prototype.',
  },
}

export const wiz = {
  stepOf: (i: number, n: number) => `Step ${i} of ${n}`,
  progressLabel: 'Your progress',
  next: 'Continue',
  confirmNext: 'Confirm and continue',
  back: 'Back',
  backToOverview: 'Back to the overview',
  compareToggle: 'Compare with the tested 8-step wizard',
  compareTitle: 'What happened to the tested steps',
  compareSummary: (tested: number, now: number) => `The tested wizard had ${tested} steps. Yours has ${now}, built around your farm.`,
  compareHead: { tested: 'Tested step', now: 'This year', what: 'What happened' },
  notThisYear: 'Not a step this year',

  herd: {
    confirm: (n: number) => `You have ${n} cattle.`,
    confirmHint: 'Nothing else to do here. Confirm and continue.',
    firstYear: (n: number) => `The animal registry shows ${n} cattle on your farm. Is that your herd today?`,
  },

  land: {
    intro: 'Your five fields from last year. Choose a field to see or change it.',
    introFirst: 'Draw each field once. Next year it will be your starting point.',
    fieldsTitle: 'Your fields',
    mapTitle: 'Map of your fields',
    mapDesc: 'Your fields drawn on the land map, with physical blocks and cadastral parcels for reference.',
    fieldSummary: (name: string, area: string, crop: string, status: string) => `${name}, ${area}, ${crop}, ${status}`,
    lastYearCrop: (crop: string) => `Last year: ${crop}`,
    onParcels: (labels: string) => `Lies on ${labels}. For reference only.`,
    inBlock: (labels: string) => `Inside ${labels}.`,
    unchanged: 'Same as last year. Nothing to do.',
    roadArea: (left: string) => `Area you can claim now: ${left}.`,
    redrawSimplified: 'In this prototype, redrawing is simplified to one confirmation.',
    redrawConfirm: 'Confirm the new shape',
    legendTitle: 'What the lines mean',
    legend: {
      field: { name: 'Your field', text: 'What you sow. You work with these.' },
      block: { name: 'Physical block', text: 'Land that can get support. Your fields must stay inside it.' },
      parcel: { name: 'Cadastral parcel', text: 'The legal plot from the land register. Shown for reference only.' },
      road: { name: 'Now road', text: 'Land the land map now marks as road.' },
      satellite: { name: 'Looks different', text: 'Where the satellite photo shows something different. It only flags.' },
    },
  },

  split: {
    title: 'Split the river field',
    instruction: 'Draw one line where the sunflowers start. Drag the two ends of the line across the field.',
    keyboardHint: 'Or choose an end and move it with the arrow keys.',
    handleStart: 'Start of the line',
    handleEnd: 'End of the line',
    useSlider: 'Use a slider instead',
    useDrag: 'Draw the line instead',
    sliderLabel: 'Where the second crop starts, from the top of the field',
    noCross: 'The line must cross the field from edge to edge. Move one of its ends.',
    part: (letter: string, area: string) => `Part ${letter}: ${area}`,
    cropFor: (letter: string, area: string) => `Crop in part ${letter} (${area})`,
    choose: 'Choose a crop',
    undo: 'Undo',
    confirm: 'Confirm the split',
    missing: 'Choose a crop for both parts to confirm.',
    done: (a: string, b: string) => `Split confirmed: ${a} and ${b}.`,
    edit: 'Change the split',
    guardrail: 'The line stays inside your field. Nothing outside land that can get support is counted.',
  },
}

export const finish = {
  ee: {
    intro: 'Everything here is the same as last year. Check it once and confirm.',
    recordsTitle: 'Your records',
    recordsNote: 'From government records. You can’t change them here.',
    holder: 'Holder',
    place: 'Place',
    year: 'Application year',
    status: 'Active farmer status',
    renewed: 'Renewed',
    notRenewed: 'Needs renewing',
    recordsWrong: 'Records wrong? Ask for a correction',
    recordsAsked: 'Correction asked for. The office that keeps the record will check it.',
    measuresTitle: 'Your measures',
    measuresNote: "Last year's measures are kept. The ones that fit your farm come first.",
    paysFor: 'What it pays for',
    yourPart: 'Your part',
    whyFits: 'Why it fits your farm',
    otherMeasures: 'Other measures',
    condition: 'Condition',
    doesNotFit: "Doesn't fit your farm this year",
    documentsTitle: 'Documents',
    missing: 'Input receipts are missing. Plant production support needs them.',
    upload: 'Upload your input receipts',
    uploadHint: 'A photo from your phone or a file from your computer. PDF or picture.',
  },
  measureText: {
    plant_production: {
      paysFor: (rate: string) => `${rate} for each hectare of arable land you farm.`,
      yourPart: 'Keep the receipts for seed, fertiliser and other inputs, and attach them.',
      why: 'You farm arable land.',
    },
    cows_raising_calves: {
      paysFor: (rate: string, from: string, to: string) => `${rate} for each cow that calved between ${from} and ${to}.`,
      yourPart: 'Keep the calves registered in the animal registry.',
      why: (n: number) => `${n} of your cows calved in that period.`,
    },
    eco_scheme: {
      paysFor: 'Support for keeping green cover on arable land over winter.',
      condition: 'Your arable fields must stay covered with a crop or cover crop from autumn to spring.',
    },
  },
  submit: {
    readyTitle: 'Ready to submit',
    readyNote: 'Nothing needs your action. This does not mean approved.',
    blockedTitle: "You can't submit yet",
    reasons: {
      renewal: 'Renew your active farmer status.',
      action_required: (n: number) => (n === 1 ? '1 thing needs your action:' : `${n} things need your action:`),
      declarations: 'Confirm the declaration below.',
    },
    goRenew: 'Renew now',
    awaitingNote: "This doesn't stop you submitting. Only that part waits for the check.",
    checksTitle: 'What the state will still check',
    checks: {
      eligibility: 'That you and each measure are eligible.',
      records: 'Your answers against the animal registry and the land map.',
      inspection: 'Some farms are inspected on the ground.',
      payment: 'The final amount. The estimate may change.',
    },
    declarationTitle: 'Declaration',
    declaration: 'I confirm under full criminal and material liability that the information in this application is true.',
    button: 'Submit application',
  },
  receipt: {
    title: 'Your application is submitted.',
    when: (d: string) => `Submitted on ${d}.`,
    reference: 'Reference number',
    referenceNote: 'Keep this number. (Prototype value.)',
    nextTitle: 'What happens next',
    next: [
      'The state checks your application against its records.',
      'Some farms are inspected on the ground.',
      'You will be told the decision and the payment in GSA.',
    ],
    awaitingTitle: 'Still awaiting verification',
    nothingAwaiting: 'Nothing is awaiting verification.',
    amendTitle: 'Need to change something?',
    amendText: 'You can amend your application until the national deadline. You will sign the declaration again.',
    amend: 'Amend your application',
  },
  renewal: {
    title: 'Renew your active farmer status',
    why: 'You need an active farmer status to submit. Renewing is a separate step, not your application.',
    prepare: 'You can prepare your application before you renew. Only submitting waits.',
    button: 'Renew my status',
    mockNote: 'In this prototype, renewal is one click.',
    doneTitle: "You're an active farmer.",
    doneNext: 'Next: your application.',
    continue: 'Continue to your application',
  },
}

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))
