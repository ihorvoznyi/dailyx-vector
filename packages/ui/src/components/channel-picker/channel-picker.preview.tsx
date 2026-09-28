'use client';

import { Card } from '../card';
import { ChannelPicker } from './channel-picker';

/** Sample props from the Vector ChannelPicker preview. */
export function ChannelPickerPreview() {
  return (
    <Card
      eyebrow="Setup · step 1 of 2"
      title="Where do you get clients?"
      meta="Pick what you actually work. The dashboard speaks each channel’s language."
    >
      <ChannelPicker value={{ upwork: 8, email: 5 }} onDone={() => {}} />
    </Card>
  );
}
