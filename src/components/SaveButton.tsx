import { en, formatTime } from '../copy/en'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

const copy = en.saveButton

/**
 * Autosave keeps every answer already; farmers still want to press Save and see it done. It runs the same save,
 * then says so with the time. Answers kept from a last visit already read Saved; a fresh start reads Save; if storage
 * fails it says so plainly.
 */
export function SaveButton({ savedAt, restored, failed, tap, onSave }: { savedAt: string | null; restored: boolean; failed: boolean; tap: number; onSave: () => void }) {
  const time = savedAt ? formatTime(savedAt) : null
  return (
    <>
      <Button
        variant="secondary"
        className="save-button"
        data-state={failed ? 'failed' : time || restored ? 'saved' : 'idle'}
        title={failed ? copy.failedHint : undefined}
        aria-label={!failed && time ? `${copy.saved} ${copy.at(time)}` : undefined}
        onClick={onSave}
      >
        {failed ? (
          <>
            <Icon name="warning" size="sm" /> {copy.failed}
          </>
        ) : time || restored ? (
          <>
            {/* Keyed by the tap, so the tick pops again each time he presses it. */}
            <span key={tap} className="save-tick"><Icon name="check" size="sm" /></span> {copy.saved}
            {time && <span className="save-time">{copy.at(time)}</span>}
          </>
        ) : (
          <>
            <Icon name="save" size="sm" /> {copy.save}
          </>
        )}
      </Button>
      {/* Said once per tap, not on every autosave; the alternating invisible character makes a repeat tap heard. */}
      <span className="visually-hidden" role="status">
        {tap > 0 && (failed ? copy.failedHint : time ? copy.announce(time) + (tap % 2 ? '​' : '') : '')}
      </span>
    </>
  )
}
