# Đề xuất: bộ khởi tạo `.claude` dùng lại cho mọi project

Căn cứ: `docs/01-tong-hop-reference.md` và `docs/inventory/inv-claude1..5.md`.

## 1. Mục tiêu và nguyên tắc

1. Một nguồn gốc duy nhất (`claude-kit`), copy vào từng project; project không bao giờ sửa phần core, chỉ sửa phần project (nguyên tắc của c5 `agent-team`).
2. Ba lớp, không phải hai:
   - **core**: rule, vai trò, workflow, hook, template dùng cho mọi project.
   - **packs**: theo stack hoặc theo cách làm việc (cmake/gtest, qmake/qt, controller-kernel, work-package, docs-spec-driven...). Bật/tắt theo project.
   - **project**: context, hard rules, phân loại task, build-env, memory, docs của riêng project.
3. Mọi giá trị riêng (danh tính git, thư mục bảo vệ, tên process, đường dẫn toolchain, model) nằm trong **một file config**; hook và skill đọc từ đó, không ghi cứng.
4. Tất cả trong `.claude/` của project, loại khỏi repo bằng global gitignore như hiện nay. Repo chỉ chứa docs cho người dùng.
5. Hook là hàng rào, không phải phép; build và test là sự thật.

## 2. Cấu trúc đề xuất

### 2.1 Repo nguồn `claude-kit/` (chính là setup-project này)

```
claude-kit/
  kit.config.schema.json        # schema của file config
  install.js                    # node install.js --target <project> --packs a,b
  core/
    CLAUDE.template.md          # khung CLAUDE.md, điền từ config
    rules/
      00-roles-and-models.md    # lead/worker/reviewer, model, truyền model mọi tầng
      01-git-identity.md        # danh tính, no AI trailer, stage by path, push/force policy
      02-repo-hygiene.md        # không CLAUDE.md trong cây, docs tự đứng được, .claude ngoài repo
      03-language-ascii.md      # English in repo, ASCII in code, bảng thay thế
      04-file-process-safety.md # xóa/kill/hook policy
      05-memory.md              # auto-memory + decisions/lessons
      06-evidence.md            # report không phải bằng chứng, negative check, không sửa test để pass
    workflow/
      WORKFLOW.md               # intake → plan → Gate1 → develop → test → review → Gate2 → commit → close (từ c5)
      PORTING.md                # cách cài vào project mới (bổ sung settings/hook/pack/DoD/build-env)
    roles/
      team-leader.md            # phiên chính (không phải agent)
    agents/
      implementer.md  tester.md  reviewer.md  build-resolver.md  explorer.md
    skills/
      delegate-change/  tdd-workflow/  verification-loop/  architecture-decision-records/
      change-impact/  inherit-legacy-style/
    commands/
      plan.md  review.md  build.md  test.md
    hooks/
      lib/                      # io (stdin, decision JSON), config (defaults + merge), paths, shell (tokenizer)
      guard-shell.js            # gộp guard-delete (c1) + guard-bash (c2) + commit-guard (c1)
      guard-edit.js             # gộp guard-edit (c2) + protect-tree (c1); chặn cả bản kích hoạt theo kit.manifest.json
      subagent-model-guard.js   # từ c5, đọc models từ config, fail-closed
      sync-memory.js            # từ c1; --restore không xóa, --dry-run, --status có kết luận
      format.js                 # từ c1 format-cpp, chỉ chạy khi repo có config formatter
      test-hooks.js             # table-driven, 220 case + unit
      settings.template.json    # sinh settings.json; pack nối thêm qua settings.fragment.json
    templates/
      brief.md  task.md  report.md  adr.md  plan.md  decisions.md  lessons.md
      project-context.md  project-rules.md  task-classification.md  definition-of-done.md  build-env.md
  packs/                        # mỗi pack: README, rules/ skills/ agents/ commands/ hooks/ tools/ references/
    cpp-cmake-gtest/            # c3+c1: ECC rules adapted, cpp-testing, build.js, wt-slot.js, golden workflow
    cpp-qmake-qt/               # c2+c4: qmake-msvc-build, qttest-headless, qt-ui-probe, qt-cpp-review, qt-cpp-docs
    controller-kernel/          # c1 layer A: 5 controller-* skills + templates, kernel-verify, 3 rules, controller-reviewer,
                                #   /controller-review, gate-check.js (tham số hóa), hook kernel-gates
    work-package/               # c2: WP handoff, touch-list, /review-wp, worktree slots, wt-guard, bundle 2 máy
    docs-spec-driven/           # c4: docs-structure, code-comments, repo-boundaries, backlog, ADR Dn, docs-gate.js
    agent-skills-lite/          # c5: 6 skill + 2 references vendored nguyên văn, 1 rule "advisory"
    hooks-powershell/           # c4: guard-shell, subagent-model-guard, sync-memory bản ps1, 72 case test
  LICENSES/                     # ECC MIT, Qt BSD-3, agent-skills MIT + README chỉ file nào thuộc licence nào
```

Khác với đề xuất ban đầu: `format-cpp.js` thành `format.js` tool-neutral; `decisions.md`, `lessons.md` là template của core;
pack có thêm thư mục `tools/` (cài vào `.claude/tools/<pack>/`) và `references/` (cài phẳng vào `.claude/references/`);
`agent-skills-lite` giữ nguyên văn (có non-ASCII) và được miễn rule ASCII như skill Qt; `hooks-powershell` khi bật tự đặt
`hooks.runtime = powershell` và installer bỏ các hook Node khỏi `settings.json`.

### 2.2 Kết quả trong một project sau khi cài

```
<project>/.claude/
  CLAUDE.md                     # sinh từ template + 10–20 dòng riêng project
  kit.config.json               # mọi giá trị riêng
  settings.json                 # hooks (dùng $CLAUDE_PROJECT_DIR), env model
  core/                         # copy nguyên, không sửa (rules, agents, skills, hooks, templates, workflow)
  packs/<tên>/                  # copy nguyên, không sửa
  project/
    context.md  rules.md  task-classification.md  definition-of-done.md  build-env.md
  rules/                        # bản "kích hoạt" từ core + packs (Claude Code chỉ đọc .claude/rules/*.md)
  agents/  skills/  commands/   # tương tự
  memory/                       # mirror auto-memory (Stop hook)
  docs/
    plan/  adr/  briefs/  notes/
    decisions.md  lessons.md    # do lead biên tập (từ c5)
  tasks/active/  tasks/done/    # file baton T-xxx.md (từ c5)
```

Ghi chú: Claude Code chỉ tự động đọc `.claude/rules/`, `.claude/agents/`, `.claude/skills/`, `.claude/commands/`. Vì vậy `install.js` phải "kích hoạt" bằng cách copy từ `core/` và `packs/` vào các thư mục đó; `core/` và `packs/` là bản gốc để so sánh/cập nhật (`install.js --update` chỉ ghi đè phần core/packs, không đụng vào `project/`).

### 2.3 `kit.config.json` (các khóa rút từ bảng "parameterization candidates")

```json
{
  "project": { "name": "", "root": "$CLAUDE_PROJECT_DIR", "leadTitle": "Project Leader", "replyLanguage": "vi", "artifactLanguage": "en" },
  "models": { "worker": "sonnet", "reviewer": "opus", "forceAll": false },
  "git": {
    "identity": { "name": "dev28", "email": "devgbit@gmail.com" },
    "deniedEmails": ["ncrn39@gmail.com"],
    "aiAttribution": "deny",
    "conventionalCommits": true,
    "commitCadence": "task",
    "push": "ask", "forcePush": "ask-with-lease",
    "integrationBranch": "main"
  },
  "gates": { "plan": "human", "commit": "human" },
  "paths": {
    "readOnly": ["reference_source/"],
    "askBeforeEdit": ["3rdparty/"],
    "localOnly": [".wt/", "product_release/"],
    "protectedDelete": [".git/", ".claude/", ".claude/memory/"],
    "memoryMirror": ".claude/memory",
    "docs": ".claude/docs", "tasks": ".claude/tasks"
  },
  "processes": { "neverKill": [], "neverLaunch": [], "busyBeforeTests": ["cl", "link", "nmake", "jom"] },
  "encoding": { "asciiExtensions": [".cpp", ".h", ".hpp", ".cc", ".cxx", ".inl", ".ui", ".qrc", ".pro", ".pri", ".cmake", ".bat", ".cmd", ".ps1", ".py"], "asciiExempt": ["components/", "3rdparty/", "*.ts"] },
  "build": { "slots": { "dir": "build-wt", "count": 8, "staleHours": 3 }, "toolchain": { "vsRoot": "", "qtDir": "", "generator": "" } },
  "packs": ["cpp-cmake-gtest"]
}
```

## 3. Các quyết định thiết kế (đề xuất cụ thể)

### 3.1 Workflow chung = agent-team của c5 + brief/evidence của c1–c3
- Một task = một file baton `tasks/active/T-xxx.md` (Plan / Dev notes / Test report / Review verdict / Commit record). Trạng thái nằm trong file, không nằm trong hội thoại; section trống = bước bị bỏ qua.
- Hai cổng duyệt của người mặc định. Project có thể ủy quyền Gate 1 cho lead trong `project/rules.md` (như c2 Phase 11, c5 "delegated like phase N-1"), nhưng ghi rõ phạm vi.
- Phân loại task (`full`, `docs`, `trivial`, `hil` + lớp riêng) quyết định có tester/reviewer hay không.
- Section Plan dùng đúng các trường brief của c1/c3: GOAL, CONTEXT, DELIVERABLES, CONSTRAINTS, ACCEPTANCE (đánh số), OUT OF SCOPE, BUILD, MODEL, cộng touch-list "May edit / Must not touch" của c2.
- Pipeline trong task `full`: tester RED (nếu TDD) → implementer → build-resolver khi cần → tester GREEN-verify → reviewer → lead verify (verification-loop) → Gate 2 → commit → close → distill vào `decisions.md`/`lessons.md`.
- Bằng chứng: mỗi claim có test id/số lượng/log/path; negative check nêu tên test sẽ đỏ; tester đọc Plan trước Dev notes; reviewer đọc Plan, diff, rules, rồi mới đọc Dev notes.
- Verdict thống nhất: `APPROVE / WARN / BLOCK`; severity `BLOCK / HIGH / MEDIUM / LOW`. Zero finding hợp lệ. FAIL hai lần liên tiếp → lead dừng, hỏi người.

### 3.2 Vai trò và model
- Lead = phiên chính, có file role, không có agent file. Worker sonnet, reviewer opus (config). `subagent-model-guard.js` chặn model lệch config và chặn `fork`. Không dùng `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` vì nó ép reviewer về sonnet.
- Mọi agent có dòng `tools:` (reviewer/explorer không có Write/Edit). Bỏ đoạn "Prompt Defense Baseline" của ECC.
- Agent mới cho mỗi task (fresh context); lead không dán ý kiến của mình vào prompt của reviewer.

### 3.3 Hooks: một runtime, một giao thức, một config
- Runtime Node (4/5 project). Giao thức JSON `permissionDecision: allow|ask|deny` của c2 (có "ask", thay vì chỉ exit 2). Guard an toàn fail-open + stderr; model-guard fail-closed.
- `guard-shell.js` = tokenizer + đệ quy nested shell của c1 `guard-delete` + bảng chính sách git/kill/delete của c2 `guard-bash` + kiểm tra commit message/PR body/identity của c1 `commit-guard`. Thêm: `mv/cp/>/sed -i/robocopy` vào thư mục bảo vệ; `gh pr` body; `git -C`; normalize `..`.
- `guard-edit.js` = c2 (ASCII trên nội dung, read-only paths) + c1 `protect-tree` (CLAUDE.md/AGENTS.md trong cây) + bảo vệ `.claude/settings.json`, `.claude/hooks/`, `.claude/core/` khỏi bị agent sửa.
- `test-hooks.js` table-driven, mỗi rule mới phải có case; chạy trên một thư mục tạm, không ghi cứng path.
- `settings.json` sinh từ config, luôn dùng `"$CLAUDE_PROJECT_DIR"`.
- Pack `hooks-powershell`: bản ps1 tối thiểu (push block, PS write block, model guard) cho máy không có Node; đọc cùng `kit.config.json` qua `ConvertFrom-Json`.

### 3.4 Memory: hai cơ chế, vai trò rõ
- Auto-memory của Claude (user / feedback / project / reference) mirror vào `.claude/memory/` bằng Stop hook; `--restore` không xóa file, chỉ copy.
- `decisions.md` và `lessons.md` trong `.claude/docs/`: lead ghi 1–2 dòng sau mỗi task close, gắn task ID; là nơi "biên tập", không phải log. Log dài (như `project-status.md` 82 KB của c4, nửa sau `rules.md` của c5) tách ra `.claude/docs/notes/`.
- Rule: không SHA, không số test, không ngày "status" trong CLAUDE.md/skill; những thứ đó ở `docs/plan/` hoặc task file.

### 3.5 Docs trong repo
- Core chỉ giữ nguyên tắc (user docs only, tự đứng được, một sự thật một nơi, README per module, không phase/agent/owner).
- Pack `docs-spec-driven` (c4) cho project cần spec ID/backlog/history. Pack `work-package` (c2) cho project 2 máy.
- ADR: skill c3 làm chuẩn, đường dẫn `.claude/docs/adr/`; pack docs-spec-driven override sang `Dn` trong repo.

### 3.6 C++ packs
- Core không ép framework test, không ép CMake hay qmake. Chỉ giữ 6 rule chất lượng chung (warning=error, RAII/ownership, untrusted input, naming theo codebase, Doxygen public, hàm ngắn).
- `cpp-cmake-gtest`: ECC rules đã adapt của c3 (bỏ tham chiếu picking/robot), `build.js` + `wt-slot.js` của c1, `tdd-workflow` + `verification-loop` của c3, golden/preview tùy chọn.
- `cpp-qmake-qt`: c2 skills + c4 bài học (Release loop, offscreen probe, QSS token, `/utf-8`, CP932, `_data` trap) + bảng lỗi qmake của c4 `cpp-build-resolver`.
- `cpp-coding-standards` ECC giữ verbatim; addendum project đè lên và nằm trong `project/rules.md`, không chèn vào file ECC.

## 4. Cách cài vào project (PORTING, sửa lại từ c5)

1. `node claude-kit/install.js --target C:/DGB/Project/<x> --packs cpp-qmake-qt,docs-spec-driven`
   - copy `core/`, `packs/`; kích hoạt vào `rules/ agents/ skills/ commands/ hooks/`; sinh `kit.config.json` từ schema + `settings.json`; tạo `project/*.md` từ template; tạo `docs/`, `tasks/`, `memory/`.
2. Điền `kit.config.json` (danh tính, path bảo vệ, process, toolchain) và 5 file `project/*.md` (context, rules, task-classification, DoD, build-env).
3. `node .claude/hooks/test-hooks.js` phải 0 fail.
4. Điền 10–20 dòng riêng vào `CLAUDE.md` (read-first list, build commands, packs đang bật).
5. Chạy thử một task nhỏ qua đủ 2 gate trước khi tin.
6. Cập nhật kit: sửa ở `claude-kit`, chạy `install.js --update` (chỉ ghi đè core/packs).

## 5. Lộ trình và trạng thái (cập nhật 2026-10-18)

| Bước | Việc | Đầu vào | Trạng thái |
|---|---|---|---|
| 0 | Chốt 16 điểm ở mục 5 của `01-tong-hop-reference.md` | — | Xong, đã đưa vào core |
| 1 | Dựng `core/`: 7 rules, workflow + role lead, 5 agents, 6 skills, 4 commands, 12 templates, `kit.config.schema.json` | c5 core, c1 delegation/project.md, c3 agents, c2 wp rules | Xong |
| 2 | Hooks Node tham số hóa + `test-hooks.js` (mục tiêu ≥ 120 case) | c1 guard-delete/commit-guard/protect-tree, c2 guard-bash/guard-edit/test-guards, c5 model guard | Xong, 220 case |
| 3 | `install.js` + `CLAUDE.template.md` + `PORTING.md` | c5 PORTING | Xong: `--update`, `--dry-run`, `--test`, `--add-exclude`, manifest, merge config viết tay |
| 4 | 7 packs: `cpp-cmake-gtest`, `cpp-qmake-qt`, `controller-kernel`, `work-package`, `docs-spec-driven`, `agent-skills-lite`, `hooks-powershell` | c1–c5 | Xong cả 7; mỗi pack có README, pack có hook/tool thì có test riêng |
| 5 | Cài thật và chạy một task qua đủ workflow | — | Đã làm trên ncr_picking (dev machine, 2026-10-18): T-001 qua 2 gate, 15 dòng hook kiểm chứng, 16 kit issue K1–K16 đã sửa và merge vào `main`. Còn: image_matching, controller-kernel, mc_protocol |
| 6 | NichirinLaserMark: pack `hooks-powershell` | c4 | Pack xong; `test-hooks.ps1` 75/75 xanh trên Windows PowerShell 5.1 (máy dev, 2026-10-18) sau khi sửa harness; chưa chạy trên máy NichirinLaserMark |

## 6. Tiến độ hiện tại và việc tiếp theo

Tình trạng repo `claude-kit` (`main` = `d68394b`): 8 commit sau bản khởi tạo; bộ test
`node core/hooks/test-hooks.js` 304/304, `packs/controller-kernel/hooks/test-kernel-gates.js`,
`packs/work-package/hooks/test-wt-guard.js` 18/18, `packs/docs-spec-driven/tools/test-docs-gate.js`,
`packs/hooks-powershell/hooks/test-hooks.ps1` 96/96 (Windows PowerShell 5.1.26100) đều 0 fail. Cài thử 5 pack cùng lúc
vào thư mục tạm và `--update` lại đều đúng layout.

Bài học từ dry-run ncr_picking đã vào kit:

- Bản kích hoạt (`.claude/rules|agents|skills|commands|tools|references`) được bảo vệ theo
  `kit.manifest.json`; file project tự viết trong các thư mục đó vẫn sửa được (K1).
- Reviewer không có Write/Edit: trả khối verdict, leader dán vào task file (K14).
- Trường **Baseline** ở Gate 1 cho thay đổi git không thấy; gate "chỉ diff" với số nợ cũ (K4, K15).
- Gate 2 đổi deliverable là ruling: ghi `decisions.md`, quay lại implement, review lại (K16).
- Pack work-package nới lệnh cấm từ vựng của rule 02 cho tài liệu plan được track (K3).
- Kiểm tra AI attribution / forbidden phrase chỉ quét nội dung message (`-m`, `-F`, `--trailer`,
  heredoc, `gh pr --body/--body-file/--title`), không quét cả dòng lệnh: `git commit -F msg.txt;
  git log -1 | grep -ciE "co-authored"` không còn bị deny oan; message có trailer vẫn deny (K17, đã sửa).
- `sed -i` / `perl -i` lên file trong project (ngoài scratchpad, temp của Claude và thư mục build)
  → ask, vì qua shell file mất CRLF và encoding; readOnly và file kit vẫn deny; dùng Edit tool (K18, đã sửa).
- Ghi biến môi trường bền (`setx`, `[Environment]::SetEnvironmentVariable(.., "User"|"Machine")`,
  khóa registry `HKCU\Environment` / `HKLM\...\Environment`) → ask vì sống lâu hơn session và đổi môi
  trường build của mọi tool trên máy; tên trong `environment.protectedVars` (vd `BINPICK_*`) → deny; tên
  không đọc được → ask; `$env:X` (process scope) vẫn tự do. Cả bản Node lẫn bản PowerShell (K19, đã sửa,
  phát hiện khi retrofit bin-picking: rule cấm đổi `BINPICK_*` nhưng hook không chặn).
- Dry-run image_matching (2026-10-19, K20–K30), đã sửa:
  - K20 (nghiêm trọng): ở chế độ `auto` một `ask` của hook không giữ được vai trò cổng: ở image_matching
    `git push` đã chạy mà không ai thấy dialog; ở mc_protocol dialog có hiện và được duyệt bằng một click,
    ngoài chat (chỉnh lại 2026-10-19 theo report mc_protocol). Mỗi
    `ask` giờ có category; khi `permission_mode` thuộc `hooks.autoMode.modes` (mặc định `auto`,
    `bypassPermissions`), các category trong `hooks.autoMode.askToDeny` (push, envWrite, askBeforeEdit,
    localOnlyDelete, destructiveGit) thành deny kèm lời dặn hỏi người trong chat. Cả Node lẫn PowerShell.
  - K21: `core/hooks/probe.js` cho xem quyết định của hook với config thật mà không chạy lệnh (`--batch`,
    `--mode auto`); rule 04 và PORTING cấm "thử ask bằng lệnh thật".
  - K22/K28: `build.js` ghi log từng bước vào `<scratch>/build-logs/`, in thời gian, số warning/error,
    tổng ctest; `--fresh`; dừng khi cache thuộc cây khác; `MSBUILDDISABLENODEREUSE=1`; `build`/`all` tự
    configure khi input CMake mới hơn cache hoặc tập file nguồn đổi; `packConfig.suppressRegeneration`
    cho race `generate.stamp` của VS generator.
  - K23: `configureArgs` nhận `$env{NAME}` và `${sourceDir}`; skill `cmake-build` sửa lời "luôn từ biến
    môi trường".
  - K24: `wt-slot.js acquire --empty`, `reset <tag>`, `status` báo slot có cache hay rỗng;
    `build.js --empty-slot`.
  - K25: rule `cpp-testing` không còn giả định `tests/synthetic/`; template rules có bảng tolerance.
  - K26: thông báo ASCII cho Markdown nêu đúng `encoding.asciiRepoMarkdown`.
  - K27: reviewer giữ Bash nhưng ghi rõ read-only là hợp đồng, liệt kê lệnh được và cấm.
  - K29: `install.js` cảnh báo một path nằm ở hai danh sách mâu thuẫn và `configureArgs` ghi cứng path
    project; PORTING dặn đánh dấu "unverified" số liệu chép từ ghi chú cũ.
  - K30: WORKFLOW / team-leader: sau session limit, kiểm tra process, slot, sub agent và dừng agent thừa trước.
  - Không cần sửa: report mục 4 (wt-slot mới không hồi quy) và mục 13 (`sync-memory` đã so tên thư mục
    không phân biệt hoa thường).
- Dry-run mc_protocol (2026-10-19), đã sửa:
  - K31 (nặng): `install.js --update` lọc hook theo cả entry nên xóa hook riêng của project khi nó nằm chung
    matcher với hook kit (`deny-kill-build-tools.js` của mc_protocol). Giờ lọc từng hook, gộp hook project vào
    entry cùng matcher, báo "kept project hook"; chạy `--update` hai lần không nhân đôi.
  - K32 (hồi quy của K20): đóng task bằng `mv .claude/tasks/active/T.md .claude/tasks/done/` bị coi là xóa dữ
    liệu `localOnly` nên bị deny ở chế độ auto (mc_protocol K-003, controller-kernel T-001). Move nằm trong cùng
    root `localOnly`/`protectedDelete` không còn tính là xóa; ra khỏi root, file kit, mirror, readOnly, glob vẫn như cũ.
  - K33: `taskkill /FI "IMAGENAME eq x"` (và `//FI`, `//IM`, `-IM`) trước đây lọt qua như kill theo PID; giờ là kill
    theo tên (ask, deny nếu thuộc `neverKill`).
  - K34: `build.js build` đếm file được compile; build không compile gì in `NOTHING COMPILED (... not compile evidence)`.
  - Lời giải thích của K20 sửa lại: ở auto mode `ask` là dialog một click ngoài chat, không phải "không tới người".
    mc_protocol giữ `ask` theo phán quyết của owner (`hooks.autoMode.askToDeny: []`).
  - Không phải lỗi kit hoặc đã hết hiệu lực: mục 4, 7, 8 (project đã chuyển task và record vào `.claude/`),
    mục 9 (lỗi dữ liệu của retrofit, project đã sửa trong K-001), mục 10 (classifier của harness; `probe.js`
    thay thế), mục 11 (scratch giờ chứa log của `build.js`). Mục 3 (kill theo tên tool build là deny) và mục 5
    (khái niệm batch) để project tự giữ: hook riêng của mc_protocol và quy tắc trong `project/rules.md`.
- `test-hooks.ps1` chạy xanh trên Windows PowerShell 5.1: 5.1 biến stderr của tiến trình con thành
  `NativeCommandError` khi stream bị redirect, harness đặt `ErrorActionPreference = Stop` nên chết ở case
  fail-open. Harness hạ xuống `Continue` quanh mỗi lời gọi hook; bản thân ba hook không bị ảnh hưởng
  (Claude Code chạy thẳng `powershell -File`, đọc stderr như text). Chi tiết trong README của pack.

Việc tiếp theo, theo thứ tự:

1. **ncr_picking**: `install.js --update` để nhận K1–K18; chạy lại `test-hooks.js`; chốt ba câu hỏi
   mở của report (commit T-002 `.gitignore`, bundle note cho máy deploy, test đỏ một lần phía deploy).
2. **image_matching** (`cpp-cmake-gtest`, sạch nhất): cài, điền `kit.config.json` và 5 file
   `project/*.md`, một task nhỏ qua 2 gate, report kit issue theo mẫu của ncr_picking.
3. **controller-kernel** (`cpp-cmake-gtest,controller-kernel`): kiểm chứng gate-check và hook
   kernel-gates trên mã thật (ví dụ hố L3/L4 trong `kernel-gaps.md` mục 14); so bảng `L9-literal`
   với `packConfig.controller-kernel.walkDirs` của repo.
4. **mc_protocol** (`cpp-cmake-gtest,agent-skills-lite`, có thể thêm `docs-spec-driven`): retrofit từ
   `agent-team/`, giữ `decisions.md`/`lessons.md` cũ; đây là nơi so sánh workflow kit với bản gốc c5.
5. **NichirinLaserMark** (`cpp-qmake-qt,docs-spec-driven,hooks-powershell`): cài từ máy có Node
   hoặc copy `.claude/`; chạy lại `test-hooks.ps1` trên PowerShell 5.1 của máy đó (harness đã xanh trên
   5.1 ở máy dev); sửa những gì chỉ máy đó mới lộ.
6. Sau mỗi lần cài: issue về kit đi vào `.claude/docs/notes/<date>_kit-dry-run-report.md` mục 5
   như ncr_picking đã làm, rồi sửa ở kit và `--update` cho mọi project.

Chưa có trong lộ trình, cân nhắc sau: `guard-edit` bản PowerShell (máy cấm Node hiện không có hook
cho edit); gate ASCII chạy trên diff trong hook thay vì chỉ trong verification-loop; versioning kit
(`package.json`, `kitVersion` trong manifest đã có chỗ) để `--update` báo được bản nào sang bản nào.
