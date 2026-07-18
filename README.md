# CodingSchool

**AI Engineering Mentor — dual-agent OpenCode plugin.**

CodingSchool is an OpenCode plugin with two specialized agents: **Learn** (student diagnosis, scaffolding, competency tracking) and **Coach** (code review, architecture, GRC). It builds real understanding — not just auto-generated code you don't comprehend.

## Installation

Add to your `opencode.json`:

```jsonc
{
  "plugin": ["@codingskuy/coding-school"]
}
```

The plugin automatically registers both agents, system prompts, and tool permissions — zero manual config needed.

> Requires OpenCode v0.7+ (Plugin V2 API).

## Agents

### Learn Agent (`learn`)

Student-focused agent for structured learning:

- **Diagnoses** your current level and misconceptions before teaching
- **Scaffolds** learning with 5 levels: Socratic question → nudge → analogy → pseudocode → solution
- **Tracks** per-topic competency across 4 dimensions: knowledge, implementation, debugging, teaching
- **Persists** a global student model (`~/.config/opencode/codingschool/student-model.json`) across sessions
- **Bilingual** content and misconception patterns (English + Indonesian)

### Coach Agent (`coach`)

Mentor-focused agent for project work:

- **Reviews** code quality, error handling, type safety, console statements
- **Assesses** architecture (monolithic patterns, failure handling, separation of concerns)
- **Scans** GRC compliance: hardcoded secrets, SQL injection, XSS, eval usage, input validation
- **Tracks** engineering competency across 8 dimensions: code quality, architecture, git process, testing, documentation, collaboration, GRC, risk assessment

### Legacy Agent (`coding-school`)

The original single agent. Redirects to the `learn` agent for backward compatibility.

## Tools

### Learn Tools

| Tool | Purpose | Arguments |
|------|---------|-----------|
| `cs_diagnose_student` | Record student responses, detect misconceptions | `topic`, `response`, `questions` (optional) |
| `cs_teach_concept` | Deliver scaffolded hints and solutions | `topic`, `studentAnswer` (optional), `hintLevel` (optional), `concept` (optional) |
| `cs_update_competency` | Update per-topic competency scores | `topic`, `knowledge`, `implementation`, `debugging`, `teaching` |
| `cs_reflect` | Session reflection and insight extraction | `topic`, `reflection`, `type` |
| `cs_create_roadmap` | Create a learning roadmap | `topic`, `level`, `content` |
| `cs_update_progress` | Update progress, XP, and level | `topic`, `item`, `status` |
| `cs_assess_quiz` | Evaluate answers using Bloom's rubric | `answers`, `topic`, `stage` |
| `cs_resume_session` | Load the last checkpoint | `date` (optional) |

### Coach Tools

| Tool | Purpose | Arguments |
|------|---------|-----------|
| `cs_code_review` | Review code quality and flag issues | `code`, `language` (optional) |
| `cs_architecture_review` | Assess project architecture | `directory` |
| `cs_grc_scan` | Scan for GRC compliance issues | `directory` (optional) |
| `cs_mentoring_plan` | Generate a learning plan for a topic | `topic` |
| `cs_engineering_status` | Display engineering competency summary | (none) |
| `cs_coach_dialog` | Conversation with coach | `message`, `choice` (optional) |

## TUI Sidebar

The sidebar widget auto-refreshes when a `.codingschool/` folder is detected:

```
┌─ AI Mentor ─────────────────────┐
│ 🌱 Beginner  Conf 45%           │
│ Style: example-first            │
│ Goal: Learn TypeScript          │
│ 3 topics  1 active misconceptions│
├─ Competency ────────────────────┤
│ typescript  ★★★★☆  62/100      │
│ testing     ★★☆☆☆  35/100      │
├─ Engineering ───────────────────┤
│ Code Quality    ★★★★☆          │
│ Architecture    ★★★☆☆          │
│ Testing         ★★☆☆☆          │
│ Documentation   ★★★☆☆          │
└─────────────────────────────────┘
```

## Philosophy

**Mentor optimizes long-term growth, not short-term task completion.**

- **Diagnosis-first**: understand the student before teaching
- **Scaffolding**: always start with minimal hints, escalate only when stuck
- **Mandatory reflection**: every session ends with structured reflection
- **Backward-compatible**: old roadmaps, progress, and sessions still work

## Data Structure

```
.codingschool/
├── competency.json          # Per-topic competency (knowledge/implementation/debugging/teaching)
├── engineering.json         # Engineering competency (8 dimensions)
├── progress.json            # Legacy XP + level
├── roadmap/
│   ├── git/
│   │   └── beginner.md
│   └── typescript/
│       ├── beginner.md
│       └── intermediate.md
├── sessions/
│   ├── 2026-07-13.md
│   └── 2026-07-14.md
├── quizzes/
├── reports/
└── certificates/

~/.config/opencode/codingschool/
└── student-model.json       # Global student model (cross-project)
```

All directories are created **lazily** — only when a tool first needs them.

## Development

```bash
bun install          # Install dependencies
bun test             # Run tests (184 tests)
bun run typecheck    # TypeScript check
bun run build        # Build to dist/
bun run build:quick  # Build without declarations (faster)
```

## License

MIT — see [LICENSE.md](LICENSE.md)
