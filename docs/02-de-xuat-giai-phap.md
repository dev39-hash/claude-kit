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
      lib/                      # stdin, config loader, tokenizer, path normalize, decision JSON
      guard-shell.js            # gộp guard-delete (c1) + guard-bash (c2) + commit-guard (c1)
      guard-edit.js             # gộp guard-edit (c2) + protect-tree (c1)
      subagent-model-guard.js   # từ c5, đọc models từ config
      sync-memory.js            # từ c1, thêm --dry-run, không xóa khi restore
      format-cpp.js             # từ c1
      test-hooks.js             # từ c2 test-guards, mở rộng cho mọi hook
    templates/
      brief.md  task.md  report.md  adr.md  plan.md
      project-context.md  project-rules.md  task-classification.md  definition-of-done.md  build-env.md
  packs/
    cpp-cmake-gtest/            # c3: ECC common+cpp rules, cpp-testing, build.js, wt-slot.js, golden workflow
    cpp-qmake-qt/               # c2+c4: qmake-msvc-build, qttest-headless, qt-cpp-review, qt-cpp-docs, Qt rules, bảng lỗi qmake
    controller-kernel/          # c1 layer A: controller-* skills, kernel-laws, qt-shell, gate-check, kernel-gates
    work-package/               # c2: WP handoff, touch-list, /review-wp, bundle 2 máy
    docs-spec-driven/           # c4: docs-structure, code-comments, repo-boundaries, backlog, ADR Dn
    agent-skills-lite/          # c5: 6 skill generic + 2 references, giữ LICENSE
    hooks-powershell/           # bản ps1 tối thiểu cho máy cấm Node (c4)
  LICENSES/                     # ECC MIT, Qt pack, addyosmani MIT
```

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

## 5. Lộ trình

| Bước | Việc | Đầu vào |
|---|---|---|
| 0 | Bạn chốt 16 điểm ở mục 5 của `01-tong-hop-reference.md` | — |
| 1 | Dựng `core/`: rules (6 file), workflow + role lead, 5 agents, templates, `kit.config.schema.json` | c5 core, c1 delegation/project.md, c3 agents, c2 wp rules |
| 2 | Hooks Node tham số hóa + `test-hooks.js` (mục tiêu ≥ 120 case) | c1 guard-delete/commit-guard/protect-tree, c2 guard-bash/guard-edit/test-guards, c5 model guard |
| 3 | `install.js` + `CLAUDE.template.md` + `PORTING.md` | c5 PORTING |
| 4 | Packs: `cpp-cmake-gtest`, `cpp-qmake-qt` trước; `controller-kernel`, `work-package`, `docs-spec-driven`, `agent-skills-lite` sau | c1–c5 |
| 5 | Cài thử vào một project mới (dry-run), rồi retrofit image_matching (sạch nhất), sau đó controller-kernel, ncr_picking, mc_protocol | — |
| 6 | NichirinLaserMark: pack `hooks-powershell` hoặc cài Node portable | c4 |

## 6. Việc mình có thể làm ngay sau khi bạn chốt

- Viết bộ `core/` (rules, workflow, roles, agents, templates) bằng tiếng Anh, ASCII.
- Viết hooks Node tham số hóa và bộ test.
- Viết `install.js` và chạy dry-run vào một thư mục tạm.
