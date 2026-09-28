import type { ReactNode } from 'react';

import { Icon } from '../components/icon';
import { IconButton } from './icon-button';
import { Num } from './num';

/** Zoom out, the zoom percentage, zoom in and fit, plus any extra canvas buttons after them. */
export function ZoomControls({
  zoom,
  onZoomOut,
  onZoomIn,
  onFit,
  children,
}: {
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit: () => void;
  children?: ReactNode;
}) {
  return (
    <>
      <IconButton aria-label="Zoom out" onClick={onZoomOut}>
        <Icon name="minus" size={16} />
      </IconButton>
      <Num className="min-w-40px text-center text-12px text-ink-muted">
        {Math.round(zoom * 100)}%
      </Num>
      <IconButton aria-label="Zoom in" onClick={onZoomIn}>
        <Icon name="plus" size={16} />
      </IconButton>
      <IconButton aria-label="Fit to screen" onClick={onFit}>
        <Icon name="fit" size={16} />
      </IconButton>
      {children}
    </>
  );
}
