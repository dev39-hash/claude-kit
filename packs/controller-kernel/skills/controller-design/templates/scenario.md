# Scenario: <short name>   (recipe step 8)

One scenario is one event sequence with the State delta and the Effects after each step. It
doubles as the specification of one table test and as an end-to-end read of the design.

**Purpose:** one sentence -- which rule or law this scenario exercises.
**Laws touched:** e.g. L3 (stale id), L4 (stale timer), L7 (outputs follow State), L11 (batch order).
**Given (prepared State):** the shortest event sequence that reaches it, or a named helper
(e.g. "the controller is ready: setup, master connected, snapshot, devices connected").
**Policy used:** defaults, or the fields shrunk for the test (never a constant in the test body
that the core should read from Policy).

| # | Event | State delta | Effects (in order) | Outputs / display after |
|---|---|---|---|---|
| 1 | `<Event{fields}>` | `<field: old -> new>` | `<Effect{...}>, ...` | `<signal=value>, display=<Name>` |
| 2 | | | | |

**Expected end state:** display name, readiness (Ready or NotReady[reasons]), fault register,
job phase, armed timers.
**Must NOT happen:** the stale or wrong action this scenario guards against (for example "no
second RequestConnect on a connected role", "no publish from a handler").
**Invariants checked at every step:** list (at least `readiness().ok()` iff the ready output,
fault latched iff the fault output).
**Test name:** `<snake_case sentence stating the rule>`.

---

## Minimum set every controller design carries

1. The normal run (every stage completes, outputs follow, the controller re-arms).
2. A role lost mid-job (held, aborted, or faulted -- whichever the policy says -- and what the
   late completion of the lost run does: dropped by id, with a Trace).
3. The master lost (and returned): outputs republished, edge levels forgotten until the next
   snapshot, dependents parked and restored.
4. An acknowledge while a role is still down (the fault clears; the role's own recovery
   window is handled exactly as the rule says; nothing else changes).
5. A stop during start-up (Stop while Starting: never blocks, ends Idle, timers disarmed).

Add as the controller needs: a stale timer; a late completion from an older job; a status from
a previous binding (older epoch); a batch from the master in which several signals change at
once (adapter test, law L11); a synchronous refusal from a runner (executor test, laws L5, L6).
