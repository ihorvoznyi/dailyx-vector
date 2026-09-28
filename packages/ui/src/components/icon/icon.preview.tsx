import { Icon, iconNames } from './icon';

/** Sample props from the Vector Icon preview: every icon at 22px with its name. */
export function IconPreview() {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))' }}
    >
      {iconNames.map((n) => (
        <div
          key={n}
          className="flex flex-col items-center gap-2 rounded-md border border-line bg-bg-100 px-1 py-3 font-mono text-11px leading-none font-medium text-ink"
        >
          <Icon name={n} size={22} />
          <span className="text-ink-faint">{n}</span>
        </div>
      ))}
    </div>
  );
}
