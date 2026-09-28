/** Something I could do this week, valued as amount × odds (× horizon if recurring). */
export interface Action {
  id: string;
  title: string;
  context?: string;
  kind?: string;
  amount: number;
  probability?: number;
  recurring?: boolean;
  hours: number;
  done?: boolean;
}

export interface ActionQueueProps {
  actions: Action[];
  onChange?: (a: Action[]) => void;
  baselineRate?: number;
  horizonMonths?: number;
}

/** Stub until stage 3-6 task W2-channels builds it. The props above are the contract. */
export function ActionQueue(props: ActionQueueProps) {
  void props;
  return null;
}
