/** How sure an amount is, from money in the bank to proposals weighted by odds. */
export type Certainty = 'received' | 'secured' | 'committed' | 'pipeline';

/** Amounts per certainty; missing parts are zero. */
export type Payout = Partial<Record<Certainty, number>>;

/**
 * The four certainties in display order, with the fill classes for HTML (`bg`) and SVG (`svg`).
 * Pipeline is hatched and never counted as income.
 */
export const CERTAINTY = [
  {
    key: 'received',
    label: 'Received',
    note: 'in the bank',
    bg: 'bg-sure-received',
    svg: 'fill-sure-received',
  },
  {
    key: 'secured',
    label: 'Secured',
    note: 'prepaid, escrow or invoiced',
    bg: 'bg-sure-secured',
    svg: 'fill-sure-secured',
  },
  {
    key: 'committed',
    label: 'Committed',
    note: 'agreed, not funded',
    bg: 'bg-sure-committed',
    svg: 'fill-sure-committed',
  },
  {
    key: 'pipeline',
    label: 'Pipeline',
    note: 'proposed, weighted by odds',
    bg: 'bg-hatch inset-ring inset-ring-sure-pipeline',
    svg: 'fill-sure-pipeline/22 stroke-sure-pipeline',
  },
] as const satisfies readonly {
  key: Certainty;
  label: string;
  note: string;
  bg: string;
  svg: string;
}[];
