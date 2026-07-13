# CodingSchool — Learn with AI, not From AI

CodingSchool adalah plugin OpenCode yang berfungsi sebagai mentor pembelajaran software engineering.

## Instalasi

1. Clone atau copy folder ini ke project kamu
2. Tambahkan ke `opencode.json`:

```jsonc
{
  "agent": {
    "coding-school": {
      "description": "Mentor pembelajaran software engineering",
      "prompt": "Kamu adalah mentor CodingSchool. Tanyakan pilihan A/B sebelum memulai.",
      "tools": { "write": false, "edit": false }
    }
  },
  "plugins": [
    "./path/to/coding-school-plugin"
  ]
}
```

## Tools

| Tool | Fungsi |
|------|--------|
| `cs_coach_dialog` | Mulai dialog dengan coach |
| `cs_create_roadmap` | Buat learning plan |
| `cs_update_progress` | Update progress belajar |
| `cs_assess_quiz` | Penilaian rubrik |
| `cs_resume_session` | Resume sesi belajar |

## Struktur Data

```
.codingschool/
├── profile.md
├── progress.json
├── roadmap/
├── sessions/
├── quizzes/
├── reports/
└── certificates/
```
