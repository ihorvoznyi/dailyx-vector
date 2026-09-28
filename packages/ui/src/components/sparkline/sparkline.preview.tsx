import { Sparkline } from './sparkline';

/** Sample props from the Vector Sparkline preview. */
export function SparklinePreview() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Sparkline data={[3, 4, 4, 5, 4, 6, 7, 7, 8, 9, 9, 11]} />
      <Sparkline data={[11, 10, 10, 9, 9, 8, 8, 7, 7, 6]} />
      <Sparkline data={[5, 6, 5, 6, 5, 6, 5]} tone="flat" fill={false} width={120} />
    </div>
  );
}
