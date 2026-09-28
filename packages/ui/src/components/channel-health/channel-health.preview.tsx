import { Card } from '../card';
import { ChannelHealth } from './channel-health';

/** Sample props from the Vector ChannelHealth preview. */
export function ChannelHealthPreview() {
  return (
    <Card eyebrow="Cold email" title="Channel health">
      <ChannelHealth
        items={[
          {
            label: 'Bounce rate',
            value: '1.8%',
            note: 'Keep under 2% or verify the list',
            status: 'ok',
          },
          {
            label: 'Positive replies',
            value: '1.3%',
            unit: 'of sent',
            note: 'Down from 2.1% in July',
            status: 'watch',
          },
          {
            label: 'Sends / inbox / day',
            value: '38',
            note: 'Cap I set: 40',
            status: 'ok',
            meter: [38, 40],
          },
          {
            label: 'Domains ready',
            value: '2 of 3',
            note: 'Domain 3 still warming',
            status: 'watch',
            meter: [2, 3],
          },
        ]}
      />
    </Card>
  );
}
