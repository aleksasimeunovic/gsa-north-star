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
