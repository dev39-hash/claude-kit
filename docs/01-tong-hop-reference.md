# Tổng hợp 5 folder `.claude` trong `reference/`

Bản chi tiết từng folder (do sub agent Sonnet đọc toàn bộ file) nằm trong `docs/inventory/inv-claude1..5.md`.
File này là bản rút gọn để ra quyết định. Folder `.claude/temp/` không được dùng làm căn cứ.

## 1. Năm folder là gì

| Folder | Project | Stack | Đặc điểm nổi bật | Tình trạng |
|---|---|---|---|---|
| claude1 | controller-kernel | C++17, CMake, Qt6, MSVC VS18 | Hooks tốt nhất (`guard-delete` có tokenizer thật, `commit-guard`, `protect-tree`, `kernel-gates`), tools `build.js` / `gate-check.js` / `wt-slot.js`, skill chia "layer A" (portable) và "layer B" (repo) | Bị trộn: ~25 file là bản sao của claude2 (agents `wp-*`, `guard-bash/edit`, skills qmake, `pm-agent-memory/`, `settings.local.json` trỏ vào computer-vision-app) |
| claude2 | ncr_picking (repo `computer-vision-app`) | Qt app, qmake/MSVC, 2 máy dev/deploy | Quy trình Work Package (handoff, touch-list, report 6 mục, evidence, stop rules), `guard-bash.js` + `guard-edit.js` với giao thức JSON allow/ask/deny và 87 test case, đồng bộ 2 máy bằng git bundle | Là tập con của claude1 (chỉ khác `CLAUDE.md`, `settings.json`, `sync-memory.js`). Đường dẫn hook ghi cứng tuyệt đối |
| claude3 | image_matching | OpenCV C++ lib, CMake, GoogleTest | Bộ rules ECC `common/*` + `cpp/*` đầy đủ, agents `cpp-implementer/tester/reviewer/build-resolver`, skills `tdd-workflow`, `verification-loop`, ADR + briefs + plan trong `.claude/docs/`, `preview.js` | Sạch nhất về cấu trúc; `CLAUDE.md` status cũ; hook dùng đường dẫn tương đối |
| claude4 | NichirinLaserMark | Qt 5.15, MSVC2019 32-bit, qmake | Không có `CLAUDE.md` (memory + rules thay thế), hook bằng PowerShell (máy này cấm Node), quy ước docs theo spec (`docs/spec`, `docs/history`, `backlog`, ADR dạng `Dn`), skill `inherit-legacy-style`, lệnh `/plan` `/feature-dev`, memory rất nhiều bài học kỹ thuật | Hook ghi cứng `C:\Users\BAO`; agent/command mô tả layout build cũ |
| claude5 | mc_protocol | C++17 lib, CMake + qmake, Qt5/6 | Hệ `agent-team/` đã tách sẵn `core/` (dùng lại) và `project/` (riêng): 4 vai trò, file baton `tasks/active/T-xxx.md`, 2 cổng duyệt của người, phân loại task; pack `agent-skills` (addyosmani, MIT) và `skill-pack/` 6 skill vendored; hook `subagent-model-guard.ps1` + env ép model sonnet | Thiết kế đúng hướng mục tiêu của bạn nhất. `rules.md` trộn log ủy quyền với rule; core và project mâu thuẫn (commit theo task vs theo phase) |

Nguồn bên ngoài đã dùng: ECC (affaan-m/ECC, MIT) ở c1/c2/c3/c4; Qt skill pack (TheQtCompanyRnD, BSD-3/Qt Commercial) ở c1/c2; addyosmani/agent-skills v0.6.10 (MIT) ở c5. Phải giữ file LICENSE và ghi nguồn.

## 2. Rule chung (xuất hiện ở ≥ 3 folder) — ứng viên cho phần CORE

### A. Vai trò và phân việc (c1 c2 c3 c4 c5)
- Claude phiên chính là lead/PM: lập kế hoạch, viết brief, giao việc, kiểm tra, verify, commit. Không tự viết production code/test trừ việc nhỏ (c4: "khi đó là đường tốt hơn", c5: task `trivial`).
- Worker (implementer, tester, build-resolver, explorer) chạy `sonnet`; reviewer chạy `opus` (c1 c2 c3). c4 và c5 ép tất cả sonnet. Truyền `model` ở mọi lần gọi Agent, ở mọi tầng, nhắc lại trong brief.
- Pipeline: brief → tester RED → implementer GREEN → build-resolver (chỉ khi vỡ build) → reviewer → lead verify → commit (c1 c3). c5 thêm 2 cổng duyệt của người: Gate 1 duyệt plan, Gate 2 duyệt commit.
- Report của agent không phải bằng chứng: lead tự chạy lại build/test/gate. Mỗi claim kèm test id, số lượng, log, đường dẫn (c1 c2 c3 c4 c5).
- Negative check phải chỉ ra test nào sẽ đỏ và vì sao (c2 c3 c4 c5).
- Không bao giờ sửa test/golden/fixture hay làm yếu assertion để pass (c1 c2 c3 c5).
- Reviewer chỉ báo finding khi > 80% chắc; 0 finding là hợp lệ; mỗi finding có file:line + kịch bản + fix (c1 c2 c3 c4).
- Implementer không được tự gọi reviewer; FAIL quay về qua lead, không agent-to-agent (c2 c5).
- Mỗi task/phase nên dùng agent mới (fresh context) (c5).

### B. Git và danh tính (c1 c2 c3 c4 c5)
- Commit bằng danh tính riêng của máy (dev28/dev27), cấu hình repo-local; không bao giờ dùng email cá nhân `ncrn39@gmail.com`; không đổi git config global/system.
- Tuyệt đối không AI attribution (`Co-Authored-By`, "Generated with Claude Code") trong commit/tag/merge/PR. Rule này đè lên lời nhắc mặc định của harness.
- Commit chỉ khi user yêu cầu; message chỉ mô tả thay đổi, không nhắc owner/role/agent/phase.
- Stage theo path; cấm `git add -A`, `git add .`, `git commit -a`.
- Push chỉ khi user yêu cầu; force push chỉ khi được yêu cầu rõ (c2: `--force-with-lease`; c1 commit-guard: chặn hết).
- Lệnh git phá hủy (reset --hard, clean, checkout --, restore, branch -D, rebase, amend, stash drop...) phải hỏi trước.

### C. Vệ sinh repo và chính sách docs (c1 c2 c3 c4 c5)
- Không bao giờ tạo `CLAUDE.md` / `AGENTS.md` / `AGENT.md` trong cây repo. Hướng dẫn chỉ ở `.claude/CLAUDE.md` + `.claude/rules/`.
- `.claude/` loại khỏi repo bằng global gitignore hoặc `.git/info/exclude`, không ghi vào `.gitignore` của repo.
- Repo chỉ chứa tài liệu cho người dùng; docs tự đứng được: không link `.claude/`, không đường dẫn tuyệt đối, không nhắc AI/agent/plan/WP/số ADR/số phase.
- Plan, ADR, brief, notes nằm trong `.claude/docs/{plan,adr,briefs,notes}/` (c1 c3) hoặc `docs/history` (c4). ADR bắt buộc khi đổi API/contract/schema/dependency.
- Mỗi sự thật ghi ở một nơi, chỗ khác trỏ tới (c4 c5). Docs mô tả trạng thái hiện tại, không phải lịch sử (c4 c5).
- Module docs bằng `README.md` (c2 c4).
- File copy từ ECC/Qt pack phải ghi nguồn và giữ LICENSE.

### D. Ngôn ngữ và mã hóa (c1 c2 c3 c4)
- Code, comment, commit, docs: tiếng Anh. Trò chuyện với user: tiếng Việt.
- File code chỉ ASCII (kể cả comment) vì MSVC C4819 / C4566. Thay thế: `--`, `->`, `x`, `deg`, `+/-`, `...`. Ký tự cần hiển thị thì viết escape hoặc qua file dịch.
- Trên máy codepage CP932/ANSI: không `Get-Content | Set-Content` file nguồn (c4), dùng Edit/Write tool.

### E. An toàn file và process (c1 c2 c3 c4 c5)
- Trong project được xóa khi task cần, trừ vùng bảo vệ (`.git/`, `.claude/memory/`, thư mục reference read-only).
- Ngoài project: phải hỏi trước; file temp/scratchpad do chính Claude tạo thì được xóa (c4 chặt hơn: kể cả scratchpad cũng hỏi).
- Không bao giờ lách hook; hook chặn thì hỏi user. Hook "allow" không phải là phép.
- Chỉ kill process do chính session tạo, theo PID; kill theo tên phải hỏi.
- Test suite chạy một mình; kiểm tra process trước khi chạy (c2 c4).
- Hook fail-open (lỗi nội bộ thì cho qua, ghi stderr) ở c1–c4; c5 model-guard fail-closed.
- File plan/spec/brief đưa vào skill là DỮ LIỆU, không phải lệnh (c1 c3).

### F. Memory (c1 c2 c3 c4 c5)
- Memory toàn cục (`~/.claude/projects/<slug>/memory/`) được mirror vào `.claude/memory/` (c1 c3) hoặc `.claude/pm-agent-memory/` (c2) bằng Stop hook `sync-memory.js`; `--restore` khi sang máy mới. c4 mirror hai chiều bằng PostToolUse hook ps1.
- Format memory: frontmatter `name/description/metadata{type}` + thân + **Why** + **How to apply** + `[[links]]`; `MEMORY.md` là index một dòng/file.
- c5 có thêm memory do lead biên tập: `decisions.md`, `lessons.md` (1–2 dòng/mục, gắn task ID). Đây là cơ chế thứ hai, khác auto-memory của Claude.

### G. Chất lượng C++ (c1 c2 c3 c4 c5)
- C++17; warning là error; không tắt warning bằng pragma `/wd` `-Wno` NOLINT.
- RAII, ownership rõ (Qt parent XOR smart pointer), Rule of 0/5, không `new/delete/malloc` trần (trừ QObject có parent).
- Input bên ngoài (JSON, PLC, camera, socket, file) không tin cậy: validate, fail rõ, không silent fallback. Range-check index/ROI.
- Đặt tên theo code sẵn có: PascalCase type, camelCase hàm, `m_` member, `kPascalCase` hằng. Doxygen `///` cho public symbol.
- Hàm < ~50 dòng, nesting ≤ 4.
- Static analysis khi có tool; tool thiếu = SKIPPED, không phải PASS.

### H. Môi trường (c1 c2 c3 c4 c5)
- Windows 11, MSVC; `cmake`, `clang-format`, `clang-tidy` chỉ trong thư mục VS, không trên PATH; tool phải degrade gracefully.
- Không tự cài tool/package; không đổi biến môi trường Windows.
- Agent build song song dùng build slot (`wt-slot.js` → `build-wt/slotN` ở c1/c3; `.wt/slotN` worktree ở c2/c5). c4: không worktree được (vendored untracked), chạy tuần tự.
- Script `.bat` viết bằng Write tool, không heredoc; chạy `cmd /c file.bat`; không chain `vcvars && set PATH && jom` trên một dòng.

## 3. Rule riêng từng project — thành "pack" tùy chọn

| Pack | Nguồn | Nội dung |
|---|---|---|
| `controller-kernel` | c1 layer A | 12 luật L1–L12, 5 contracts, blocks, skills `controller-*`, `gate-check.js`, `kernel-gates.js`, rules `kernel-laws.md`, `qt-shell.md`, test kit KT_TEST |
| `cpp-cmake-gtest` | c3 | ECC `common/*` + `cpp/*`, `cpp-testing`, `verification-loop`, `tdd-workflow` (GoogleTest), golden JSON + `--update-golden`, `preview.js`, allocation budget, SIMD scalar twin |
| `cpp-qmake-qt` | c2, c4 | `qmake-msvc-build`, `qttest-headless`, `qt-cpp-review`, `qt-cpp-docs`, rules Qt ownership/threads, `/utf-8`, shape check `-functions`, UI test loop Release 25–40 lần, offscreen probe, QSS token theming |
| `work-package` | c2 | Handoff WP + touch-list + report 6 mục + `/review-wp`, bundle 2 máy, checkpoint tags |
| `docs-spec-driven` | c4 | `docs-structure.md`, `code-comments.md`, `repo-boundaries.md`, spec ID, backlog `BL-nnn`, ADR `Dn`, phase chỉ ở `docs/history` |
| `legacy-style` | c4 | skill `inherit-legacy-style` |
| `agent-skills` (chọn lọc) | c5 | 6 skill generic: TDD, incremental-implementation, source-driven-development, debugging-and-error-recovery, code-review-and-quality, doubt-driven-development; references `definition-of-done`, `orchestration-patterns` |

Domain thuần túy (laser/PLC/EzCad/MC frame của c4, camera/robot của c2, angle convention của c3) ở lại trong memory của từng project, không vào kit.

## 4. Thành phần kỹ thuật — nên lấy bản nào

### Hooks

| Thành phần | Bản tốt nhất | Lý do | Cần sửa |
|---|---|---|---|
| Chặn xóa file | c1 `guard-delete.js` (23 KB) | Tokenizer thật, đệ quy vào `bash -c`, `cmd /c`, `powershell -EncodedCommand`, node/python `-e`; theo dõi `cd` | Không bắt `mv/cp/>/sed -i/robocopy`; chưa xử lý `..`; chưa có chế độ "ask" |
| Chặn git nguy hiểm | c2 `guard-bash.js` + c1 `commit-guard.js` gộp lại | c2 có giao thức JSON allow/ask/deny + 87 test; c1 commit-guard đọc được `-F` file, heredoc, here-string, PR body | Thống nhất chính sách force-push; bỏ email/path ghi cứng; thêm `gh pr` vào c2 |
| Chặn sửa file | c2 `guard-edit.js` + c1 `protect-tree.js` | guard-edit có ASCII check trên nội dung ghi; protect-tree chặn CLAUDE.md trong cây | Danh sách extension thống nhất; bỏ RobotKinematics/reference_source ra config |
| Ép model sub agent | c5 `subagent-model-guard.ps1` | Ý tưởng đúng (matcher `Agent`) | Viết lại bằng Node, đọc model từ config, cho phép reviewer opus |
| Mirror memory | c1 `sync-memory.js` + rule giữ README của c2 | Tự suy slug, có `--restore` | `--restore` xóa file; nên thêm `--dry-run` và không xóa |
| Format C++ | c1 `format-cpp.js` | Chỉ format khi có `.clang-format` | Bỏ qua `build-*`, cache đường dẫn tool |
| Gate theo rule | c1 `kernel-gates.js` + `gate-check.js` | Có thể tái dùng cơ chế (ASCII, DOCS, WARN-PRAGMA) | Tách gate chung khỏi gate L1–L12 của kernel |
| Test hook | c2 `test-guards.js` | Table-driven, chạy được | Mở rộng cho mọi hook; bỏ path ghi cứng |

Runtime: 4/5 project dùng Node. c4 cấm Node trên máy đó; c4 và c5 dùng PowerShell 5.1 (phải ASCII, bẫy CP932, chậm vài trăm ms mỗi lệnh).

### Agents

| Vai trò | Bản gốc tốt nhất | Ghi chú |
|---|---|---|
| implementer | c3 `cpp-implementer` + kỷ luật touch-list/evidence của c2 `wp-implementer` + vai trò c5 `developer` | Có `tools:` rõ; không commit; report block cố định |
| tester | c3 `cpp-tester` + c5 `tester` (đọc Plan trước Dev notes) | RED/GREEN-verify; `unverifiable here` |
| reviewer | c2 `code-reviewer` (opus, đọc cả handoff/report/diff) + c3 `cpp-reviewer` | Read-only bằng `tools:`; verdict thống nhất |
| build-resolver | c1 `cpp-build-resolver` (bảng lỗi MSVC) | Bản c4 có bảng lỗi qmake, gộp vào pack qmake |
| explorer | ECC `code-explorer` (c1 c2 c4) | Giữ nguyên, bỏ đoạn "Prompt Defense Baseline" |
| silent-failure-hunter | c4 (tổng quát hơn) | Đưa vào pack C++ |
| planner / code-architect | c4 | Tùy chọn |

### Skills

| Skill | Bản gốc | Ghi chú |
|---|---|---|
| delegate-change (lead viết brief) | c1 | Brief template: GOAL / SKILL / CONTEXT / DELIVERABLES / CONSTRAINTS / ACCEPTANCE / OUT OF SCOPE / BUILD / MODEL |
| tdd-workflow | c3 (placeholder `<build>/<test>/<test-one>`) | c1 bản cho KT_TEST vào pack kernel |
| verification-loop | c3 (7 phase, READY/NOT READY) | c1 `kernel-verify` là biến thể |
| architecture-decision-records | c3 (đầy đủ nhất) | c4 có override dạng `Dn` |
| change-impact | c2 | Tách phần qmake ra |
| cpp-coding-standards | ECC verbatim + addendum riêng project | Addendum phải lên trên và nói rõ đè lên |
| inherit-legacy-style | c4 | Portable |
| 6 skill addyosmani | c5 skill-pack | Advisory, rule project đè lên |

### Tools
`build.js` (c1, tìm cmake trong VS), `wt-slot.js` (c1: lock nguyên tử; c3 có race), `gate-check.js` (c1), `preview.js` (c3, domain-specific).

## 5. Mâu thuẫn bạn cần quyết

| # | Vấn đề | Các bản đang làm | Đề xuất |
|---|---|---|---|
| 1 | Model reviewer | c1/c3: opus; c2: chỉ code-reviewer opus; c4/c5: tất cả sonnet (c5 ép bằng env + hook) | Config `models.worker=sonnet`, `models.reviewer=opus`, hook đọc từ config |
| 2 | Ai commit | c1/c3/c4/c5: lead; c2: implementer commit trên branch WP | Lead commit (core); pack work-package cho phép implementer commit trên branch riêng |
| 3 | Cổng duyệt của người | c5: Gate 1 (plan) + Gate 2 (commit); c1/c3: chỉ "commit khi user bảo"; c2: PM tự merge trong phạm vi được ủy quyền | Lấy 2 gate của c5 làm mặc định; project có thể ủy quyền Gate 1 cho lead bằng `rules.md` |
| 4 | Nhịp commit | c5 core: mỗi task; c5 project: mỗi phase; c2: mỗi WP | Config `commit.cadence` = task / phase / wp |
| 5 | Force push | c1 commit-guard: chặn hết; c2 guard-bash: ask nếu `--force-with-lease` | Ask với `--force-with-lease`, deny còn lại |
| 6 | Conventional Commits | c1/c3: dùng; c2: từ chối | Config `commit.conventional` true/false |
| 7 | Bộ verdict | APPROVE/WARN/BLOCK (c1); Approve/Warning/Block (c2 c3 c4); ACCEPT/ACCEPT WITH CHANGES/REJECT (c2 wp-reviewer); PASS/FAIL + blocker/should-fix/nit (c5); APPROVE/REQUEST CHANGES (agent-skills) | Một bộ: verdict `APPROVE / WARN / BLOCK`; severity `BLOCK / HIGH / MEDIUM / LOW` |
| 8 | Reviewer có được build/test | c1: cấm; c3: được; c2: chỉ khi được bảo | Được chạy lệnh read-only + build/test khi brief cho phép; không bao giờ Edit/Write |
| 9 | Include guard | `#pragma once` (c3) vs `#ifndef` (c1) | Theo codebase sẵn có; mặc định `#pragma once` |
| 10 | Auto-format | c1: chỉ khi có `.clang-format`; c3: fallback LLVM; c2/c4: không | Chỉ khi có `.clang-format` (c1) |
| 11 | Test framework / coverage | GoogleTest + 80% mục tiêu (c3); QtTest (c2 c4); KT_TEST (c1) | Core không ép framework; pack quyết định; coverage là mục tiêu, không phải gate |
| 12 | Xóa file ngoài project | c1–c3: scratchpad của mình được xóa; c4: kể cả scratchpad phải hỏi | Scratchpad được xóa (c1), còn lại hỏi |
| 13 | Hook runtime | Node (c1 c2 c3) vs PowerShell (c4 c5) | Node là chuẩn; giữ bản ps1 tối thiểu cho máy cấm Node |
| 14 | Hai cơ chế memory | auto-memory Claude (c1–c4) vs `decisions.md`/`lessons.md` do lead biên tập (c5) | Giữ cả hai với vai trò rõ: auto-memory = feedback/user/project context; decisions/lessons = kết quả task, trong `.claude/docs/` |
| 15 | ASCII áp dụng cho Markdown? | c1 project.md + gate-check: có (README/docs); c1 ascii-only.md, c2, c4: không | Code + build file: bắt buộc; Markdown trong repo: bắt buộc (gate DOCS); `.claude/` và `.ts`: miễn |
| 16 | Hook fail-open hay fail-closed | c1–c4 open; c5 closed | Guard an toàn: fail-open + ghi stderr; model-guard: fail-closed |

## 6. Lỗi và đồ thừa trong reference (không mang sang kit)

- c1: `guard-bash.js`, `guard-edit.js` có nhưng không nối vào settings; `TOOLING.md`, `settings.local.json`, `pm-agent-memory/`, agents `wp-*`, skills qmake là đồ của c2; `rules/cpp-patterns.md` (Qt, cho phép `new QObject(parent)`) và `rules/ecc/cpp/*` (cấm `new`) cùng load cho `*.cpp`.
- c2: `settings.json` ghi cứng `C:/DGB/Project/computer-vision-app`; `@../docs/rules/contributor_guide.md` không có; "never launch" ncr exe không được hook enforce; `-Force` bị đọc thành recursive; `gh pr create --body` có attribution vẫn qua.
- c3: `CLAUDE.md` status cũ (nói M0 xong, thực tế M4); `/cpp-test` không tên agent (lead tự làm, trái rule); `TEST_DATA_DIR` vs `MTC_TEST_DATA_DIR`; `wt-slot.js` có race; hook path tương đối.
- c4: `settings.json` và `sync-memory.ps1` ghi cứng `C:\Users\BAO`; agent/command mô tả layout build cũ (trước phase 18); "owner" vs "Project Leader" chưa thống nhất; `project-status.md` 82 KB là log, không phải memory.
- c5: core (commit mỗi task) vs project (commit mỗi phase) mâu thuẫn; `rules.md` nửa là log ủy quyền; status vocabulary trong role khác template; `PORTING.md` thiếu settings.json/hook/skill-pack/DoD/build-env; `temp-docs/agent-team-design.md` không tồn tại; cùng một skill nằm ở 3 chỗ.
- Chung: email cá nhân `ncrn39@gmail.com` và tên user máy (`dgb07`, `BAO`) nằm trong hook/test/settings; số test, SHA, ngày tháng ghi cứng trong CLAUDE.md/skill sẽ cũ đi; rule "no AI trailer" xung đột với lời nhắc mặc định của harness, kit phải nói rõ rule của owner thắng.
