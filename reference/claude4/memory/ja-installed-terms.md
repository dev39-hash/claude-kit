---
name: ja-installed-terms
description: "Japanese for NichirinLaserMark: the shipped strings decide the term, not merit; quote app messages verbatim from the .ts"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1755aee4-764a-4565-a94a-2f8acdf94b0d
  modified: 2026-08-24T07:32:33.947Z
---

When writing ANY Japanese for this project — UI strings or the manual — measure
against `app/translations/NichirinLaserMark_ja_JP.ts` first. Do not pick terms on
merit.

**Why:** in phase 14 the glossary was first written on merit and was wrong on eight
of the product's most frequent terms. The shipped vocabulary is `刻印` (56 uses, not
`マーキング`), `品番` (30, not `品種`), `レッドライト` (not `ガイド光`), `ハッチング`,
`読み取り`, `インデックス`, `トリガー`, `スキャナー`. Phase names on screen are
`待機 / 手動 / 実行 / 再接続` — **not** the literal `待機 / 調整 / 運転 / 復旧`.
475 strings already ship and the operator has learned them; a "better" term means
retranslating the file to fix nothing anyone experiences as broken.

**How to apply:**
- Look the term up in [[project-status]]'s phase-14 entry or `docs/rules/ja_glossary.md`
  before using it; that file records the measurement, not a preference.
- **Quote application messages verbatim from the `.ts`, never re-translate them.**
  Eight re-translations in the manual's first draft were grammatical, close, and
  none matched the shipped string.
- Count with a quick XML parse of the `.ts` (`$x.TS.context.message`) before
  claiming any term dominates.
- Watch for entries marked translated with an EMPTY string — `lrelease` counts them
  as finished and they render blank, not as an English fallback.
