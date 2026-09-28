import { StatTile } from './stat-tile';

const spark = [3, 4, 4, 5, 4, 6, 7, 7, 8, 9, 9, 11];

/** Sample props from the Vector StatTile preview. */
export function StatTilePreview() {
  return (
    <div className="grid grid-cols-4 gap-6 max-960:grid-cols-2 max-960:gap-4 max-520:grid-cols-1">
      <StatTile
        label="Net worth"
        value={48210}
        format={{ prefix: '$' }}
        delta={4.2}
        deltaLabel="30d"
        spark={[40, 41, 40, 42, 43, 42, 44, 45, 46, 47, 48, 48.2]}
      />
      <StatTile
        label="Revenue MTD"
        value={6840}
        format={{ prefix: '$' }}
        delta={18.6}
        deltaLabel="vs Aug"
        spark={spark}
        delay={60}
      />
      <StatTile
        label="Followers"
        value={12480}
        format={{ compact: true }}
        delta={3.4}
        deltaLabel="30d"
        spark={[10, 10.4, 10.8, 11, 11.2, 11.5, 11.9, 12, 12.2, 12.48]}
        delay={120}
      />
      <StatTile
        label="Burn / mo"
        value={1920}
        format={{ prefix: '$' }}
        delta={6.2}
        invert
        deltaLabel="vs Aug"
        spark={[16, 17, 17, 18, 18, 19, 19.2]}
        delay={180}
      />
    </div>
  );
}
