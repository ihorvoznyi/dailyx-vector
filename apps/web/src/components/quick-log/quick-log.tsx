'use client';

import type { ChannelPresetId } from '@dailyx/db';
import {
  Badge,
  Button,
  channels as CHANNEL_PRESETS,
  cn,
  Eyebrow,
  Icon,
  IconButton,
  Input,
  Monogram,
  Panel,
  PanelBody,
  PanelHead,
  PanelSection,
  SegmentedControl,
  Textarea,
} from '@dailyx/ui';
import Link from 'next/link';
import { useMemo, useRef, useState, useTransition } from 'react';

import { parseLeadList } from '../../lib/lead-list';
import { logOutreach, logOutreachList, type LogResult } from '../../server/outreach-actions';

export interface QuickLogChannel {
  id: string;
  preset: ChannelPresetId;
  name: string;
}

export interface QuickLogProps {
  channels: QuickLogChannel[];
  /** Preselects this channel (acquisition empty states). */
  defaultChannelId?: string;
  /** Trigger label; default 'Log outreach'. */
  label?: string;
}

type Mode = 'One' | 'Paste a list';

/** A native `<dialog>` quick-log: pick a channel, then one tap logs it, or paste a list. */
export function QuickLog({ channels, defaultChannelId, label = 'Log outreach' }: QuickLogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [channelId, setChannelId] = useState<string | undefined>(
    defaultChannelId ?? (channels.length === 1 ? channels[0]!.id : undefined),
  );
  const [mode, setMode] = useState<Mode>('One');
  const [contactName, setContactName] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState<LogResult | null>(null);
  const [pending, startTransition] = useTransition();

  const channel = channels.find((c) => c.id === channelId);
  const preset = channel ? CHANNEL_PRESETS[channel.preset] : null;

  const parsedList = useMemo(
    () => (mode === 'Paste a list' ? parseLeadList(text) : null),
    [mode, text],
  );

  const resetInputs = () => {
    setContactName('');
    setCompany('');
    setUrl('');
    setText('');
  };

  const submitOne = () => {
    if (!channel) return;
    startTransition(async () => {
      const next = await logOutreach({
        channelId: channel.id,
        contactName: contactName || undefined,
        company: company || undefined,
        url: url || undefined,
      });
      setResult(next);
      if (next.ok) resetInputs();
    });
  };

  const submitList = () => {
    if (!channel || !parsedList?.ok) return;
    startTransition(async () => {
      const next = await logOutreachList({ channelId: channel.id, text });
      setResult(next);
      if (next.ok) resetInputs();
    });
  };

  if (channels.length === 0) {
    return (
      <Link
        href="/setup"
        className="inline-flex h-28px items-center gap-2 rounded-sm bg-up px-10px font-sans text-12px font-medium text-on-up transition duration-fast ease-out hover:bg-up-hover"
      >
        Pick channels first
      </Link>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => {
          setResult(null);
          dialogRef.current?.showModal();
        }}
      >
        {label}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="quick-log-title"
        onClose={() => setResult(null)}
        className="m-0 ml-auto h-full max-h-none w-full max-w-364px border-0 bg-transparent p-3 text-ink backdrop:bg-bg-000/70"
      >
        <Panel mode="static" className="h-full w-full">
          <PanelHead>
            <div className="flex flex-1 flex-col gap-1">
              <Eyebrow>Quick log</Eyebrow>
              <h2 id="quick-log-title" className="text-title">
                Log outreach
              </h2>
            </div>
            <form method="dialog">
              <IconButton type="submit" aria-label="Close">
                <Icon name="close" size={16} />
              </IconButton>
            </form>
          </PanelHead>
          <PanelBody>
            <PanelSection>
              <Eyebrow>Channel</Eyebrow>
              <div className="grid grid-cols-2 gap-2">
                {channels.map((c) => {
                  const p = CHANNEL_PRESETS[c.preset];
                  const selected = c.id === channelId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setChannelId(c.id);
                        setResult(null);
                      }}
                      className={cn(
                        'flex items-center gap-2 rounded-md border border-line-control px-3 py-2 text-left text-14px text-ink transition-colors duration-fast ease-out hover:bg-bg-200',
                        selected && 'border-up bg-up-soft',
                      )}
                    >
                      <Monogram selected={selected}>{p.mark}</Monogram>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </PanelSection>

            {preset ? (
              <PanelSection>
                <SegmentedControl
                  label="Log mode"
                  options={['One', 'Paste a list']}
                  value={mode}
                  onChange={(v) => {
                    setMode(v as Mode);
                    setResult(null);
                  }}
                />

                {mode === 'One' ? (
                  <div className="flex flex-col gap-3">
                    <details className="rounded-md border border-line-control px-3 py-2">
                      <summary className="cursor-pointer text-caption text-ink-muted">
                        Add name, company, link
                      </summary>
                      <div className="mt-3 flex flex-col gap-2">
                        <Input
                          placeholder="Name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                        />
                        <Input
                          placeholder="Company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                        />
                        <Input
                          placeholder="Link"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>
                    </details>
                    <Button type="button" variant="primary" disabled={pending} onClick={submitOne}>
                      Log 1 {preset.verb}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      placeholder="Name, company, link — one per line"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                    />
                    {parsedList && !parsedList.ok ? (
                      <p className="text-caption text-down">{parsedList.error}</p>
                    ) : null}
                    <Button
                      type="button"
                      variant="primary"
                      disabled={pending || !parsedList?.ok}
                      onClick={submitList}
                    >
                      Log {parsedList?.ok ? parsedList.leads.length : 0} {preset.verb}s
                    </Button>
                  </div>
                )}
              </PanelSection>
            ) : null}

            {result ? (
              <Badge tone={result.ok ? 'up' : 'down'}>
                {result.ok ? `Logged ${result.count}` : result.error}
              </Badge>
            ) : null}
          </PanelBody>
        </Panel>
      </dialog>
    </>
  );
}
