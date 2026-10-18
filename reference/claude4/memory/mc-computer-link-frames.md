---
name: mc-computer-link-frames
description: "MC 1C/3C computer-link wire facts confirmed on a real Mitsubishi PLC — sum-check ranges, which responses omit it, and the fields that fail silently"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 1755aee4-764a-4565-a94a-2f8acdf94b0d
  modified: 2026-08-28T00:42:57.121Z
---

Confirmed against the bench PLC (COM6, 3C, format 4, Q series) with a read-only
wire probe, 2026-08-27 — not read off a document alone. Implemented in
`src/device/plc/mc_frame_{1c,3c}.cpp`, pinned in `tests/mc_protocol_test`.

**Sum check ranges** (formats 1 and 4 alike):
- Request = frame ID + access route + request data.
- Response = frame ID + access route + response data + **ETX**.
- Value = the low byte of the character sum, as two UPPER-case hex characters,
  placed before the CR+LF terminator.

**Which responses carry NO sum check:** a response with no response data (frame ID
+ access route only, i.e. an ACK) and an abnormal response (NAK). Only the
`STX … ETX` data response has one. Getting this wrong reads an ACK's CR+LF as hex
and fails every WRITE — including the comms-heartbeat coil written once per poll
cycle — so the link dies the moment sum check is switched on, while reads keep
working.

**Fields that produce a frame the PLC ACCEPTS while being wrong:**
- `plcSeries` — iQ-R widens the device name (`M*`→`M***`), the address (6→8 decimal
  digits) AND the sub-command (`0000/0001`→`0002/0003`). Wrong series = right-looking
  values from a different device.
- Baud rate — a NON-STANDARD rate (56700 instead of 57600) is accepted by a
  USB-serial adapter and garbles framing, so the PLC sees one request as two
  messages and NAKs the first. Blame lands on whatever was changed last.

**Shipped defaults now match the bench module** (owner, 2026-08-28): 57600 8N1, no
flow control, **sum check ON**, format 4, Q series. The first answer recorded in the
phase-16 plan's O2 (38400, no sum check) was wrong — the module said otherwise.

**How to diagnose it in one run:** the app logs the request AND the raw reply
(hex + printable ASCII) whenever a response is refused. For anything deeper, a
read-only probe that drives the shipped `Frame3C` over the real port settles it —
batch-read (`0401`) frames only, never a write.

Related: [[project-status]], [[ja-installed-terms]].
