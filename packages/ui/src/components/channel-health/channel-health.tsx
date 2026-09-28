export interface ChannelHealthProps {
  items: {
    label: string;
    value: string;
    unit?: string;
    status?: 'ok' | 'watch' | 'fix' | 'info';
    note?: string;
    meter?: [number, number];
  }[];
}

/** Stub until stage 3-6 task W2-status builds it. The props above are the contract. */
export function ChannelHealth(props: ChannelHealthProps) {
  void props;
  return null;
}
