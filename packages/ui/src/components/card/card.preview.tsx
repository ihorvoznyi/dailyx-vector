import { Button } from '../button';
import { Card } from './card';

/** Sample props from the Vector Card preview. */
export function CardPreview() {
  return (
    <div style={{ maxWidth: 420 }}>
      <Card
        eyebrow="Monthly"
        title="Revenue"
        meta="Upwork + direct · synced 4m ago"
        action={
          <Button variant="quiet" size="sm">
            Details
          </Button>
        }
      >
        <p className="text-ink-muted">
          Cards hold one question each. Title says what, meta says where the data came from and
          when.
        </p>
      </Card>
    </div>
  );
}
