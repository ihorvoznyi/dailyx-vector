import { Icon } from '../components/icon';
import { cn } from '../lib/cn';

/**
 * The 18px square check mark used by step lists, the action queue and the channel picker.
 * Presentational: the clickable element around it owns the role and state.
 */
export function CheckBox({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'mt-1px grid size-18px flex-none place-items-center rounded-5px border border-line-control text-on-up transition-colors duration-fast ease-out',
        checked && 'border-up bg-up',
        className,
      )}
    >
      {checked ? <Icon name="check" size={12} stroke={2.5} /> : null}
    </span>
  );
}
