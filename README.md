# CodingSchool

**Learn Software Engineering with AI, not From AI.**

CodingSchool is an OpenCode plugin that acts as your personal software engineering mentor. It focuses on building real understanding — not just auto-generating code you don't comprehend.

## Installation

Add to your `opencode.json`:

```jsonc
{
  "plugin": ["@codingskuy/coding-school"]
}
```

The plugin automatically registers the `coding-school` agent, system prompt, and tool permissions — zero manual config needed.

> Requires OpenCode v0.7+ (Plugin V2 API).

## How It Works

1. Select the **coding-school** agent in OpenCode
2. Tell it what topic you want to learn
3. The plugin generates a learning roadmap in `.codingschool/roadmap/`
4. Learn through 6 Bloom Taxonomy stages (Remember → Create)
5. Progress is automatically tracked in `.codingschool/progress.json`

**Core principle**: You write all the code. The agent guides, evaluates, and gives feedback — it never executes commands that modify your project state.

## Tools

The plugin provides 5 tools that the agent can call:

| Tool | Purpose | Arguments |
|------|---------|-----------|
| `cs_coach_dialog` | Start a conversation with the coach | `message`, `choice` (optional) |
| `cs_create_roadmap` | Create a learning roadmap `.md` in `.codingschool/roadmap/` | `topic`, `level` |
| `cs_update_progress` | Update progress, XP, and level | `topic`, `item`, `status` |
| `cs_assess_quiz` | Evaluate answers using Bloom's rubric | `answers`, `topic`, `stage` |
| `cs_resume_session` | Load the last checkpoint | `date` (optional) |

Tools return model instructions (not direct text to the user) that trigger the agent to call the native `question` tool — displaying choices as interactive buttons in the TUI.

## TUI Sidebar

The plugin includes a sidebar widget that automatically appears in the OpenCode TUI when a `.codingschool/` folder is detected:

```
┌─ CodingSchool ──────────┐
│ Level 2  XP 450/3000    │
│ ████░░░░░░░░            │
│ 0/1 topics done         │
├─ Git ───────────────────┤
│ beginner  45%           │
│ ████░░░░░░░░            │
│ T 3/5                   │
│ P 1/2                   │
└─────────────────────────┘
```

The sidebar auto-refreshes every 2 seconds — no restart needed.

## Agent Behavior

The agent is **forbidden** from:
- Writing or editing your source code files
- Executing state-modifying commands: `git init`, `git add`, `git commit`, `mkdir`, `rm`, `npm install`, `brew`, etc.

The agent **may**:
- Write pseudocode or comments as guidance
- Run read-only commands: `git log`, `git diff`, `git status`, `ls`
- Run tests/linters to evaluate your work

## Data Structure

```
.codingschool/
├── progress.json           # Per-topic progress + global XP + level
├── roadmap/
│   ├── git/
│   │   └── beginner.md
│   ├── dart/
│   │   ├── beginner.md
│   │   └── intermediate.md
│   └── flutter/
├── sessions/
│   ├── 2026-07-13.md
│   └── 2026-07-14.md
├── quizzes/
├── reports/
└── certificates/
```

All directories are created **lazily** — only when a tool first needs them.

## Development

```bash
bun install          # Install dependencies
bun test             # Run tests
bun run typecheck    # TypeScript check
bun run build        # Build to dist/
bun run build:quick  # Build without declarations (faster)
```

## License

MIT — see [LICENSE.md](LICENSE.md)
