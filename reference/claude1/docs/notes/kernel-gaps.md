# Kernel gaps found while writing the layer-A skills (2026-10-14)

Input for the repo plan. Each item: docs vs code mismatch or a missing enforcement.

1. Test kit thinner than docs section 9: only registry, KT_TEST, KT_CHECK, completenessSweep in
   `tests/kernel_test_support.h`. No `given().when().expect()` fixture, no stale-probe helper,
   no executor harness, no shared invariant checker (Harness and checkInvariants live in
   `tests/main.cpp`). L12 has no string test.
2. Sweep samples not enforced: a new Event can be left out of the sample list. Add a
   `std::variant_size_v<Event>` check on the sample count. The `changed` predicate is
   hand-maintained per State field.
3. L8 wording: docs say `Trace{note="unspecified"}` or `Log{Warn}`; code uses Log at Dev/Info
   and the sweep accepts any Trace/Log or a state change. Align docs or code.
4. Section 3.1 says the core appends Trace, PublishOutputs and Notify itself; `finish()` only
   does Trace, PublishOutputs, Notify(Ready/Recovering). Handlers push other Notifies.
5. Purity: `m_lastImage`, `m_hasPublished` live outside State but drive PublishOutputs;
   `onRoleConnected` clears `m_hasPublished` and emits ResetOutputImage.
6. L4 bookkeeping duplicated: `CancelTimer` + `timers.disarm` pasted in six places; there is
   an `arm()` helper but no cancel helper.
7. Epoch ownership split between adapter (bind time) and core (Setup, SelectCamera rebind);
   not documented or tested.
8. `plcEverConnected` documented as read by one function; read in three places.
9. Job block says "stage deadlines" but only GrabDeadline exists; Matching/Sending have none;
   AwaitTriggerFall waits indefinitely (intended? state it).
11. L9 smell in the example: `RolePolicy::parksOthersWhenLost` and the PLC's
    `attemptsBeforeFault = 0` are never read; behaviour is keyed on `Role::PrimaryPlc`
    (localization_core.cpp ~730, 763, 835, 870) and the reconnect order is hard-coded (~887).
12. FaultRegister docs say `Latched{code, origin}` + "code precedence"; code has `latched` +
    `raisedAtJob`, first raise wins.
13. Missing tests (from review 2026-10-14): fault raised while work is held discards it and
    latches that code; deliberate disconnect while idle (no fault, no StartTimer); PLC lost
    during Starting (no 300, retry only); L12 string tests.
14. **HIGH, L3/L4 hole**: `LocalizationCore::on(Setup)` does `m_s = State{}`
    (localization_core.cpp ~240), resetting job ids, attempt ids, timer tokens and epochs to
    their initial values. A completion or timer left over from the previous session can carry
    an id equal to a fresh one and be accepted. Fix: keep the id/token/epoch counters across
    Setup (reset only the facts), plus a probe test "a completion from the previous session is
    dropped after Setup". The scaffold templates already keep ids monotonic.
15. Section 9 "table fixture" row names a `given(State).when(Event).expect(...)` API that does
    not exist (tests use the per-file Harness); part of item 1.
10. Docs referenced `architecture_contract_test` and origin layout paths (being cleaned now);
    the include rules should become a real CMake/ctest check in this repo.
