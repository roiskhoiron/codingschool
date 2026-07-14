# CodingSchool

**Learn Software Engineering with AI, not From AI.**

CodingSchool adalah OpenCode plugin yang berfungsi sebagai mentor pembelajaran software engineering. Fokusnya pada pemahaman konsep — bukan sekadar generasi kode otomatis.

## Installation

Tambahkan ke `opencode.json`:

```jsonc
{
  "plugin": ["@codingskuy/coding-school"]
}
```

Plugin secara otomatis mendaftarkan agent `coding-school`, system prompt, dan permission tool — tidak perlu konfigurasi manual.

> Requires OpenCode v0.7+ (Plugin V2 API).

## How It Works

1. Pilih agent **coding-school** di OpenCode
2. Ceritakan topik yang ingin dipelajari
3. Plugin membuat roadmap belajar di `.codingschool/roadmap/`
4. Belajar melalui 6 tahap Bloom Taxonomy (Remember → Create)
5. Progress tersimpan otomatis di `.codingschool/progress.json`

**Prinsip utama**: Semua kode ditulis oleh student. Agent hanya membimbing, mengevaluasi, dan memberikan feedback — tidak mengeksekusi command yang memodifikasi state.

## Tools

Plugin menyediakan 5 tools yang dapat dipanggil oleh agent:

| Tool | Fungsi | Argumen |
|------|--------|---------|
| `cs_coach_dialog` | Mulai dialog dengan coach | `message`, `choice` (opsional) |
| `cs_create_roadmap` | Buat learning contract `.md` di `.codingschool/roadmap/` | `topic`, `level` |
| `cs_update_progress` | Update progress + XP + level | `topic`, `item`, `status` |
| `cs_assess_quiz` | Evaluasi jawaban dengan rubrik Bloom | `answers`, `topic`, `stage` |
| `cs_resume_session` | Load checkpoint sesi terakhir | `date` (opsional) |

Tools mengembalikan instruksi model (bukan teks langsung ke user) yang memicu agent untuk memanggil native `question` tool — menampilkan pilihan sebagai interactive button di TUI.

## TUI Sidebar

Plugin menyertakan sidebar widget yang tampil otomatis di OpenCode TUI ketika folder `.codingschool/` terdeteksi:

```
┌─ CodingSchool ──────────┐
│ Level 2  XP 450/3000    │
│ ████░░░░░░░░            │
│ 0/1 topics done         │
├─ Git ───────────────────┤
│ beginner  0%            │
│ ░░░░░░░░░░░░            │
│ T 0/5                   │
│ P 0/2                   │
└─────────────────────────┘
```

Sidebar diperbarui otomatis setiap 2 detik tanpa perlu restart.

## Agent Behavior

Agent **dilarang**:
- Menulis atau mengedit file kode milik student
- Mengeksekusi command yang memodifikasi state: `git init`, `git add`, `git commit`, `mkdir`, `rm`, `npm install`, `brew`, dll.

Agent **boleh**:
- Menulis pseudocode atau komentar sebagai panduan
- Menjalankan perintah read-only: `git log`, `git diff`, `git status`, `ls`
- Menjalankan test/linter untuk evaluasi hasil kerja student

## Data Structure

```
.codingschool/
├── progress.json           # Progress per-topik + XP + level global
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

Semua direktori dibuat **secara lazy** — hanya terbentuk saat tool pertama kali digunakan.

## Development

```bash
bun install          # Install dependencies
bun test             # Run 66 tests
bun run typecheck    # TypeScript check
bun run build        # Build ke dist/
bun run build:quick  # Build tanpa declarations (lebih cepat)
```

## License

MIT — see [LICENSE.md](LICENSE.md)
