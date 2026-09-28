import { Delta } from './delta';

/** Sample props from the Vector Delta preview. */
export function DeltaPreview() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Delta value={12.4} />
      <Delta value={-3.1} />
      <Delta value={0} />
      <Delta value={840} format="abs" prefix="$" />
      <Delta value={-6.2} invert />
      <Delta value={2.3} plain />
    </div>
  );
}
