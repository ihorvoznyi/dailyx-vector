'use client';

import { useId, useState } from 'react';

import { Button } from '../button';
import { Input } from '../../atoms/input';
import type { SkillDef } from '../../lib/skill';

/**
 * The goal-naming form for an unnamed goal slot. Keyed by `node.id` in SkillPanel so the draft
 * resets with the node instead of an effect.
 */
export function GoalForm({ onSave }: { onSave: (patch: Partial<SkillDef>) => void }) {
  const [draft, setDraft] = useState('');
  const inputId = useId();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const title = draft.trim();
        if (!title) return;
        onSave({
          title,
          icon: 'flag',
          steps: [{ id: 's1', label: 'Define what done looks like', done: false }],
        });
      }}
    >
      <label htmlFor={inputId} className="font-mono text-eyebrow text-ink-faint uppercase">
        Your goal
      </label>
      <Input
        id={inputId}
        value={draft}
        placeholder="e.g. Land a $20K contract"
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
      />
      <Button variant="primary" type="submit" disabled={!draft.trim()}>
        Save goal
      </Button>
    </form>
  );
}
