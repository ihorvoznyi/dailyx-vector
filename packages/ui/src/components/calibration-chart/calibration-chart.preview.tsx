import { Card } from '../card';
import { CalibrationChart } from './calibration-chart';

const PREDICTIONS = [
  { confidence: 0.6, correct: true },
  { confidence: 0.65, correct: false },
  { confidence: 0.55, correct: true },
  { confidence: 0.58, correct: false },
  { confidence: 0.62, correct: true },
  { confidence: 0.7, correct: false },
  { confidence: 0.72, correct: true },
  { confidence: 0.75, correct: false },
  { confidence: 0.7, correct: true },
  { confidence: 0.78, correct: false },
  { confidence: 0.8, correct: true },
  { confidence: 0.85, correct: false },
  { confidence: 0.82, correct: true },
  { confidence: 0.88, correct: true },
  { confidence: 0.9, correct: false },
  { confidence: 0.92, correct: true },
  { confidence: 0.95, correct: true },
  { confidence: 0.9, correct: true },
];

/** Sample props from the Vector CalibrationChart preview. */
export function CalibrationChartPreview() {
  return (
    <div style={{ maxWidth: 460 }}>
      <Card
        eyebrow="Me as a forecaster"
        title="Calibration"
        meta="When I say 80% sure, am I right 80% of the time?"
      >
        <CalibrationChart predictions={PREDICTIONS} />
      </Card>
    </div>
  );
}
