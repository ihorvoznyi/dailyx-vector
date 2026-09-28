import { EvidenceMeter } from './evidence-meter';

/** Sample props from the Vector EvidenceMeter preview. */
export function EvidenceMeterPreview() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 24,
        maxWidth: 1000,
      }}
    >
      <EvidenceMeter value={0.97} />
      <EvidenceMeter value={0.87} />
      <EvidenceMeter value={0.58} />
      <EvidenceMeter value={0.04} />
      <EvidenceMeter value={0.71} compact label="H-09 · compact" />
    </div>
  );
}
