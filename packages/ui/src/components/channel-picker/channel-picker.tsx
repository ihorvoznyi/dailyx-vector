export interface ChannelPickerProps {
  value?: Record<string, number>;
  onChange?: (v: Record<string, number>) => void;
  onDone?: (v: Record<string, number>) => void;
  options?: string[];
}

/** Stub until stage 3-6 task W2-channels builds it. The props above are the contract. */
export function ChannelPicker(props: ChannelPickerProps) {
  void props;
  return null;
}
