---
name: backend-engineering
description: >
  Build and review server-side work — HTTP handlers, jobs, queue consumers, data access,
  third-party integrations, webhooks, auth. Load BEFORE writing a route, a repository, a background
  job or an external-service call, and before reviewing one. Covers where to validate, when layering
  earns its keep, async and event-loop choices, the failure contract for every external call,
  what to log and what to alert on, and the boundary security checklist. Trigger on: "add an
  endpoint", "write the API", "background job", "queue consumer", "webhook handler", "call the X
  API", "rate limit", "this times out", "add an index", "is this query slow", "what should I log".
---

# Backend engineering

`.claude/ENGINEERING.md` is the charter — § External services, § Money and other irreversible state,
§ Security and privacy are binding and are not repeated here. This is the decision procedure for
the parts that vary per change.

## Trust boundaries — the only places validation belongs

Validate where data enters the process, once, and then trust it inward. Validating in every layer is
noise; validating in none is the bug.

| Boundary | Validate |
|---|---|
| HTTP request | body, params, query, headers you act on |
| Environment | at startup, and **fail to boot** — never at first use in production |
| External API response | shape, not just status. A 200 with a changed payload is the common outage |
| Queue message / webhook | signature first against the **raw body**, then shape |
| File upload | type, size, and name, before it reaches disk |

"Internal" data crossing a process boundary is external data. A message your own service published
last week was published by last week's code.

## Layering earns its keep, or it doesn't

The useful split is **transport → logic → data**: the handler knows HTTP and nothing else, the logic
is framework-agnostic and testable without a server, the data layer owns queries.

Take it when: the logic has branches worth testing in isolation, or a second transport (job, CLI,
another route) will call the same logic.

Skip it when: the handler is a validated read-through. A three-file ceremony around
`SELECT * WHERE id = ?` is the over-design the charter forbids. One file is correct there; extract
on the second real caller, not in anticipation of one.

## Async

| Pattern | When |
|---|---|
| sequential `await` | each step needs the previous result |
| `Promise.all` | independent, all required — one failure should fail the set |
| `Promise.allSettled` | independent, partial success is a valid outcome |
| `Promise.race` + timeout | first response wins, or the call is capped |

Async only helps **I/O-bound** work — queries, HTTP, filesystem, network. It does nothing for
CPU-bound work: hashing, image processing, large parses. Those block the loop for everyone; move
them to a worker or a job. No synchronous filesystem or crypto calls on a request path.

Anything that can be slow gets a **timeout**. A call with no timeout is an outage waiting for its
dependency.

## Failure

- **Never swallow.** Every catch logs with full context or rethrows. An empty catch is a defect,
  not a style preference.
- **Throw typed errors from any layer, format the response in exactly one place.** A per-route error
  shape drifts within a month.
- **Separate the two audiences.** The client gets a stable code, a safe message, and a correlation
  id. The log gets the stack, the inputs (minus secrets), and the upstream response.
- **Never leak** internal messages, stack traces, SQL, or upstream vendor errors through the API.
- **Retry only idempotent operations**, with backoff and a ceiling. Retrying a non-idempotent write
  is how one charge becomes three.

| Situation | Status |
|---|---|
| Failed validation | 400 |
| Unauthenticated / authenticated but not allowed | 401 / 403 |
| Not found, or found but not yours | 404 — do not confirm existence to someone without access |
| Conflicting state, duplicate idempotency key | 409 |
| Rate limited | 429 + `Retry-After` |
| Upstream failed or timed out | 502 / 504 — never 500 for someone else's fault |

## Observability

One wrapper emits `{ event, durationMs, status, correlationId }` for every external call — grep for
it before writing a second (charter, § External services).

Watch four signals, and alert only on what a human would act on at 3am:

| Signal | Alert on |
|---|---|
| Latency | p95/p99 against the stated SLO — never the mean, which hides everything |
| Traffic | absence as well as spikes. Zero requests is an outage, not calm |
| Errors | rate, not count. 50 errors in 50k requests is not the same event as 50 in 200 |
| Saturation | connection pool, queue depth, disk, memory headroom |

A dashboard nobody reads and an alert nobody can act on both cost more than they return. Queue depth
that only grows and pool exhaustion are the two that page.

## Data

The schema outlives every line of code around it.

- Constrain in the database — `NOT NULL`, unique, foreign keys, checks. Application-level invariants
  are advisory; a concurrent write does not read your validator.
- Index what you filter, join and sort by; confirm with the query plan, not by intuition.
- Migrations are forward-only and reversible in deploy order: add a column, backfill, switch reads,
  drop later. Never in one release.
- Money as integer minor units, terms snapshotted at purchase (charter, § Money).

## Boundary security checklist

- [ ] Every input validated at its boundary
- [ ] Parameterized queries only — no string-built SQL, anywhere
- [ ] Authorization checked on the **object**, not just the route. "Can this user act on *this* row"
- [ ] Passwords hashed with a slow KDF (argon2/bcrypt); tokens verified for signature *and* expiry
- [ ] Rate limits on anything unauthenticated, anything that sends mail, anything that costs money
- [ ] Secrets from the environment, never in source, logs, error payloads or client bundles
- [ ] Webhooks: signature over the raw body, event id recorded, handler idempotent

## Before saying it works

Run the `## Gates` from `AGENTS.md` as separate calls, then prove the behaviour:

1. The success path, executed — not inferred from a passing type check.
2. One real failure path: dependency down, timeout, malformed payload.
3. The boundary: empty set, missing optional field, duplicate submit, expired token.

A test that never failed proves nothing. Break the code once and watch it go red.
