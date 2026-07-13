# CodingSchool

**Learn Software Engineering with AI, not From AI.**

CodingSchool adalah plugin OpenCode yang berfungsi sebagai mentor pembelajaran software engineering. Fokus pada pengembangan pemahaman konsep, bukan sekadar generasi kode otomatis.

## Instalasi

### Dari npm (recommended)

```bash
# Install plugin
npm install @codingskuy/coding-school

# Atau via bun
bun add @codingskuy/coding-school
```

Lalu tambahkan ke `opencode.json`:

```jsonc
{
  "agent": {
    "coding-school": {
      "description": "Mentor pembelajaran software engineering",
      "prompt": "Kamu adalah mentor CodingSchool. Tugasmu adalah mengajar user untuk memahami konsep, bukan hanya memberikan jawaban. Selalu tawarkan pilihan A (selesaikan pekerjaan) atau B (belajar) sebelum memulai sesi belajar.",
      "tools": { "write": false, "edit": false }
    }
  },
  "plugin": ["@codingskuy/coding-school"]
}
```

### Dari local folder

```jsonc
{
  "agent": {
    "coding-school": { /* ... */ }
  },
  "plugin": ["./path/to/coding-school-plugin"]
}
```

## Tools

Plugin menyediakan 5 tools yang bisa dipanggil oleh agent Coach:

| Tool | Fungsi | Arguments |
|------|--------|-----------|
| `cs_coach_dialog` | Mulai dialog dengan coach | message, choice (optional) |
| `cs_create_roadmap` | Buat learning contract `.md` di `.codingschool/roadmap/` | topic, level |
| `cs_update_progress` | Update progress + XP + level | topic, item, status |
| `cs_assess_quiz` | Beri penilaian rubrik berdasarkan analisis jawaban | answers, topic, stage |
| `cs_resume_session` | Load checkpoint sesi sebelumnya | date (optional) |

## Struktur Data

```
.codingschool/
├── profile.md              # Profil & goal user
├── progress.json           # Progress per topik + global + XP
├── roadmap/
│   ├── dart/
│   │   ├── beginner.md
│   │   ├── intermediate.md
│   │   └── expert.md
│   ├── rust/
│   └── flutter/
├── sessions/
│   ├── 2026-07-13.md
│   └── 2026-07-14.md
├── quizzes/
├── reports/
└── certificates/
```

## Development

```bash
bun install          # Install dependencies
bun run typecheck    # TypeScript check
bun run build        # Build ke dist/
bun run build:quick  # Build tanpa deklarasi (lebih cepat)
```

## Lisensi

MIT — lihat [LICENSE.md](LICENSE.md)
