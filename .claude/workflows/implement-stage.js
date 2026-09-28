export const meta = {
  name: 'implement-stage',
  description: 'Run a PLAN.md stage: Opus orchestrator plans file-disjoint tasks, Sonnet workers build them in parallel git worktrees, orchestrator integrates into master, reviewers verify, then deliver',
  whenToUse: 'Run by /implement [stage] to deliver one PLAN.md stage end to end without confirmations',
  phases: [
    { title: 'Plan', detail: 'orchestrator writes the spec and returns waves of file-disjoint tasks', model: 'opus' },
    { title: 'Build', detail: 'one worker per task, each in its own git worktree', model: 'sonnet' },
    { title: 'Integrate', detail: 'orchestrator squash-merges each wave into master and runs the gates', model: 'opus' },
    { title: 'Review', detail: 'coverage and architecture review of the integrated stage', model: 'sonnet' },
    { title: 'Fix', detail: 'blocking findings go back to a worker, at most 2 rounds', model: 'sonnet' },
    { title: 'Deliver', detail: 'dead-code gate, advance the current stage, push', model: 'opus' },
  ],
}

const S = args.stage
const T = args.title
const D = args.scratch
const REPO = args.repo
const NEXT = args.next
const ROLE = 'You are the ORCHESTRATOR for the repository at ' + REPO + '. Read ' + REPO + '/.claude/agents/orchestrator.md and follow it. The owner runs this loop without confirmations: decide open questions yourself and record them.'
const CO = 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'

const TASK = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    brief: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    acceptance: { type: 'array', items: { type: 'string' } },
    ownsDeps: { type: 'boolean' },
  },
  required: ['id', 'title', 'brief', 'files', 'acceptance'],
}
const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    specPath: { type: 'string' },
    baseSha: { type: 'string' },
    summary: { type: 'string' },
    blocked: { type: 'string' },
    waves: { type: 'array', items: { type: 'object', properties: { tasks: { type: 'array', items: TASK } }, required: ['tasks'] } },
  },
  required: ['specPath', 'baseSha', 'summary', 'waves'],
}
const WORKER_SCHEMA = {
  type: 'object',
  properties: {
    taskId: { type: 'string' },
    status: { type: 'string', enum: ['done', 'blocked'] },
    branch: { type: 'string' },
    commit: { type: 'string' },
    worktreePath: { type: 'string' },
    gates: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['taskId', 'status', 'notes'],
}
const INTEG_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ok', 'failed'] },
    merged: { type: 'array', items: { type: 'string' } },
    head: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['status', 'notes'],
}
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'PARTIAL', 'FAIL'] },
    reportPath: { type: 'string' },
    blocking: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, line: { type: 'number' }, issue: { type: 'string' } }, required: ['issue'] } },
  },
  required: ['verdict', 'reportPath', 'blocking'],
}
const DELIVER_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['pushed', 'failed'] },
    head: { type: 'string' },
    shipped: { type: 'string' },
    stubbed: { type: 'string' },
    deferred: { type: 'string' },
  },
  required: ['status', 'shipped'],
}

function workerPrompt(t, plan, extra) {
  return [
    'Task ' + t.id + ': ' + t.title + ' (stage ' + S + ' of PLAN.md, "' + T + '").',
    'SPEC, absolute path; read the parts for your task: ' + plan.specPath,
    'Brief: ' + t.brief,
    'Files you own. Edit only these: ' + t.files.join(', '),
    'Acceptance checks: ' + t.acceptance.join(' | '),
    extra ? 'Previous attempt was blocked: ' + extra : '',
    'You are in a dedicated git worktree branched from master. The task contract is approved, so do not wait for approval. Protocol:',
    '1. cd to `git rev-parse --show-toplevel`. If HEAD is detached, run `git switch -c wt/' + S + '-' + t.id + '`.',
    '2. ' + (t.ownsDeps ? 'You own dependency changes: use `pnpm install` after editing package.json.' : 'Run `pnpm install --frozen-lockfile`. Do not change package.json or pnpm-lock.yaml.'),
    '3. Build the task. Follow AGENTS.md hard rules.',
    '4. Run the AGENTS.md ## Gates as SEPARATE commands. Run `pnpm test:e2e` only if you touched packages/ui or apps/web.',
    '5. `git add` your files and commit with the message "stage ' + S + ' ' + t.id + ': <summary>". The pre-commit hook runs typecheck, lint and test.',
    '6. Return: taskId, status, branch, commit sha, worktreePath (absolute), a gates summary, and notes with deviations, one line each.',
    'If the task is impossible as specified, return status "blocked" with the reason. Do not improvise.',
  ].filter(Boolean).join('\n')
}

phase('Plan')
const plan = await agent([
  ROLE,
  'MODE: PLAN. Stage "' + S + '" ("' + T + '") in ' + REPO + '/PLAN.md. Read its "Resolved" bullets; they are settled.',
  'First record baseSha = `git rev-parse HEAD` in ' + REPO + '.',
  'Write the spec to ' + D + '/stage-' + S + '-spec.md in sections as you go. Workers read it from that absolute path, because PLAN.md is gitignored and absent from worktrees.',
  'Include every value a worker needs: exact types, signatures, file contents where they matter, and hand-computed expected values for tests.',
  'Verify anything version-sensitive by trial in a scratch copy under ' + D + ', never in the repo.',
  'Return waves of file-disjoint tasks. Use at most 6 tasks per wave, and give each task one clear owner of its files.',
  'Also append a short "#### Stage ' + S + ' orchestration" note to PLAN.md under the stage: the waves, the task ids, and the decisions you made.',
  'Set `blocked` only if the stage needs an owner-only input such as credentials or accounts.',
  args.notes ? 'Notes from the parent: ' + args.notes : '',
].filter(Boolean).join('\n'), { agentType: 'orchestrator', model: 'opus', effort: args.planEffort || 'high', schema: PLAN_SCHEMA, label: 'orchestrator: plan ' + S, phase: 'Plan' })

if (!plan) return { stage: S, error: 'orchestrator plan failed' }
if (plan.blocked) return { stage: S, blocked: plan.blocked, specPath: plan.specPath }
log('Plan: ' + plan.waves.length + ' wave(s), ' + plan.waves.reduce(function (n, w) { return n + w.tasks.length }, 0) + ' task(s). ' + plan.summary)

const shipped = []
for (let w = 0; w < plan.waves.length; w++) {
  const tasks = plan.waves[w].tasks
  let results = await parallel(tasks.map(function (t) {
    return function () { return agent(workerPrompt(t, plan), { agentType: 'implementer', model: 'sonnet', effort: 'medium', isolation: 'worktree', schema: WORKER_SCHEMA, label: 'worker: ' + t.id, phase: 'Build' }) }
  }))
  const retry = tasks.filter(function (t, i) { return !(results[i] && results[i].status === 'done' && results[i].branch) })
  if (retry.length) {
    log('Retrying ' + retry.length + ' task(s): ' + retry.map(function (t) { return t.id }).join(', '))
    const again = await parallel(retry.map(function (t) {
      const prev = results[tasks.indexOf(t)]
      return function () { return agent(workerPrompt(t, plan, prev ? prev.notes : 'worker died'), { agentType: 'implementer', model: 'sonnet', effort: 'high', isolation: 'worktree', schema: WORKER_SCHEMA, label: 'worker: ' + t.id + ' (retry)', phase: 'Build' }) }
    }))
    retry.forEach(function (t, i) { results[tasks.indexOf(t)] = again[i] })
  }
  const done = results.filter(function (r) { return r && r.status === 'done' && r.branch })
  const missing = tasks.filter(function (t) { return !done.find(function (r) { return r.taskId === t.id }) })
  if (missing.length) return { stage: S, failedAt: 'build wave ' + (w + 1), missing: missing.map(function (t) { return t.id }), results: results }

  const integ = await agent([
    ROLE,
    'MODE: INTEGRATE. Stage "' + S + '", wave ' + (w + 1) + ' of ' + plan.waves.length + '. Main working tree: ' + REPO + ', branch master. Spec: ' + plan.specPath,
    'Worker results (JSON): ' + JSON.stringify(done),
    'Squash-merge each task in this order: ' + tasks.map(function (t) { return t.id }).join(', ') + '. For each: `git merge --squash <branch>`, then commit "stage ' + S + ' ' + '<task id>: <title>", with a blank line and "' + CO + '" at the end. The pre-commit hook runs typecheck, lint and test.',
    'If a merge or a hook fails, fix only what the merge broke, within the tasks\' contracts.',
    'After the wave, run each AGENTS.md ## Gates command separately. Run `pnpm test:e2e` only if the wave touched packages/ui or apps/web. Run `pnpm install --frozen-lockfile` first if a lockfile changed.',
    'Then remove the merged worktrees (`git worktree remove --force <path>`) and delete their branches (`git branch -D <branch>`).',
    'Return status, the merged task ids, the head sha, and short notes.',
  ].join('\n'), { agentType: 'orchestrator', model: 'opus', effort: 'high', schema: INTEG_SCHEMA, label: 'orchestrator: integrate wave ' + (w + 1), phase: 'Integrate' })
  if (!integ || integ.status !== 'ok') return { stage: S, failedAt: 'integrate wave ' + (w + 1), integ: integ, results: results }
  shipped.push.apply(shipped, integ.merged || [])
}

function review(kind) {
  const isCov = kind === 'plan-verifier'
  const report = D + '/stage-' + S + '-' + (isCov ? 'verify' : 'arch') + '.md'
  return agent([
    (isCov ? 'Coverage only' : 'Design review') + ' of stage "' + S + '" ("' + T + '") in ' + REPO + '.',
    'Requirements: ' + REPO + '/PLAN.md, the stage "' + S + '" section and its orchestration note, and the spec at ' + plan.specPath + '.',
    'Diff: `git diff ' + plan.baseSha + '..HEAD` in ' + REPO + '.',
    isCov ? 'Run the AGENTS.md ## Gates as separate commands. Missing or partial requirements are blocking.' : 'Only flag real defects in this diff: boundaries, contracts, correctness of encoded formulas against docs/SPEC.md, needless complexity. Mark only true defects as blocking.',
    'Write the report to ' + report + '. Return the verdict, the reportPath, and the blocking findings with file, line and issue.',
  ].join('\n'), { agentType: kind, model: 'sonnet', effort: 'medium', schema: REVIEW_SCHEMA, label: kind, phase: 'Review' })
}

phase('Review')
const kinds = ['plan-verifier', 'architecture-reviewer']
let reviews = await parallel(kinds.map(function (k) { return function () { return review(k) } }))
for (let round = 1; round <= 2; round++) {
  const bad = kinds.filter(function (k, i) { return !reviews[i] || reviews[i].verdict !== 'PASS' })
  if (!bad.length) break
  const blocking = reviews.filter(Boolean).flatMap(function (r) { return r.verdict === 'PASS' ? [] : r.blocking })
  if (blocking.length) {
    await agent([
      'Fix round ' + round + ' for stage "' + S + '" in ' + REPO + ', working on master directly in the main tree, with no worktree. The contract is approved; do not wait.',
      'Spec: ' + plan.specPath + '. Blocking findings (JSON): ' + JSON.stringify(blocking),
      'Fix exactly these and nothing else. Run the AGENTS.md ## Gates as separate commands. Commit "stage ' + S + ' fix round ' + round + ': <summary>", with a blank line and "' + CO + '" at the end.',
    ].join('\n'), { agentType: 'implementer', model: 'sonnet', effort: 'high', schema: WORKER_SCHEMA, label: 'worker: fix round ' + round, phase: 'Fix' })
  }
  const rerun = await parallel(bad.map(function (k) { return function () { return review(k) } }))
  bad.forEach(function (k, i) { reviews[kinds.indexOf(k)] = rerun[i] })
}
const stillBad = kinds.filter(function (k, i) { return !reviews[i] || reviews[i].verdict !== 'PASS' })
if (stillBad.length) return { stage: S, failedAt: 'review', shipped: shipped, reviews: reviews }

phase('Deliver')
const del = await agent([
  ROLE,
  'MODE: DELIVER. Stage "' + S + '" ("' + T + '") in ' + REPO + ' on master.',
  'Run `pnpm knip`. Fix only dead code this stage introduced, and commit it with "' + CO + '".',
  'In PLAN.md, set the line starting "**Current stage:" to "**Current stage: ' + NEXT + '** (stage ' + S + ' done: <short sha>)". PLAN.md is gitignored; do not commit it.',
  'Push with `git push origin master`.',
  'Return status, the head sha, and one short line each for shipped, stubbed and deferred.',
].join('\n'), { agentType: 'orchestrator', model: 'opus', effort: 'medium', schema: DELIVER_SCHEMA, label: 'orchestrator: deliver', phase: 'Deliver' })

return { stage: S, plan: plan.summary, specPath: plan.specPath, shipped: shipped, reviews: reviews.map(function (r) { return r && { verdict: r.verdict, reportPath: r.reportPath } }), deliver: del }
