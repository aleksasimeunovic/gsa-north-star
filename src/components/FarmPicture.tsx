import { en, farm as copy, formatHa } from '../copy/en'
import { Card } from '../ui/Card'
import { KeyValues } from '../ui/Layout'
import { useApp } from './AppContext'

/** His farm as GSA knows it right now. Every answer changes it, so he sees what he is confirming. */
export function FarmPicture() {
  const { derived } = useApp()
  const f = derived.farm
  const animals = [
    f.cattle && (f.cattle.checking ? copy.cattleChecking(f.cattle.count, f.cattle.registry) : copy.cattle(f.cattle.count)),
    f.pigs && (f.pigs.household ? copy.pigsHousehold(f.pigs.count) : copy.pigs(f.pigs.count)),
  ].filter(Boolean)
  return (
    <Card id="farm" title={copy.title} headingLevel={2} emphasis="low">
      <div aria-live="polite">
        <KeyValues
          items={[
            { label: copy.land, value: copy.landValue(formatHa(f.totalHa), f.fieldCount) },
            { label: copy.crops, value: f.crops.map((c) => copy.crop(en.crops[c.crop], formatHa(c.ha))).join(', ') },
            ...(animals.length ? [{ label: copy.animals, value: animals.join(', ') }] : []),
            { label: copy.measures, value: copy.measuresValue(f.measures.chosen, f.measures.fitting) },
          ]}
        />
      </div>
    </Card>
  )
}
