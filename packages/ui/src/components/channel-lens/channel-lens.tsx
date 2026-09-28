export interface ChannelLensProps {
  items: {
    id: string;
    name: string;
    mark?: string;
    sub?: string;
    badge?: string;
    badgeTone?: 'warn';
  }[];
  value: string;
  onChange?: (id: string) => void;
  label?: string;
}

/** Stub until stage 3-6 task W2-status builds it. The props above are the contract. */
export function ChannelLens(props: ChannelLensProps) {
  void props;
  return null;
}
