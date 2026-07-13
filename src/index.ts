import { type Plugin, tool } from "@opencode-ai/plugin" // v2

import { createCoachContext, handleGreeting, processCoachingChoice } from "./coach"
import { createRoadmap } from "./roadmap/generator"
import { getProgress, updateProgress, renderDashboard } from "./progress/tracker"
import { assessQuiz, renderAssessment } from "./assessment/engine"
import { resumeSession, createOrUpdateSession, getLatestSessionInfo } from "./session/resume"
import { isProfileExists, readProfile } from "./utils/paths"
import { writeMarkdown, ensureDir } from "./utils/fs"
import { onboardingMessage, choicePrompt } from "./utils/templates"

export const CodingSchoolPlugin: Plugin = async ({ project, directory, $ }) => {
  const projectDir = directory || project?.path || "."

  return {
    tool: {
      cs_coach_dialog: tool({
        description: "Mulai dialog dengan coach CodingSchool. Panggil ketika user ingin belajar atau butuh bimbingan.",
        args: {
          message: tool.schema.string({description: "Pesan dari user"}),
          choice: tool.schema.string().optional().describe("Pilihan A (selesaikan pekerjaan) atau B (belajar)"),
        },
        async execute(args) {
          const ctx = createCoachContext(projectDir)

          if (args.choice) {
            const result = processCoachingChoice(args.choice as "A" | "B")
            return result.message
          }

          if (!isProfileExists(projectDir)) {
            return onboardingMessage()
          }

          const greeting = handleGreeting(ctx)
          return greeting.message || "Ada yang bisa saya bantu untuk belajar hari ini?"
        },
      }),

      cs_create_roadmap: tool({
        description: "Buat roadmap pembelajaran baru untuk topik tertentu. Buat learning contract di .codingschool/roadmap/",
        args: {
          topic: tool.schema.string().describe("Topik yang ingin dipelajari, contoh: Dart, Flutter, Rust"),
          level: tool.schema.enum(["beginner", "intermediate", "expert"]).describe("Level pembelajaran"),
        },
        async execute(args) {
          const path = createRoadmap({
            projectDir,
            topic: args.topic,
            level: args.level,
          })
          return `Learning plan berhasil dibuat di \`${path}\`\n\n${choicePrompt()}`
        },
      }),

      cs_update_progress: tool({
        description: "Update progress belajar user. Catat penyelesaian item di roadmap.",
        args: {
          topic: tool.schema.string().describe("Topik yang diupdate"),
          item: tool.schema.string().describe("Item yang diselesaikan"),
          status: tool.schema.enum(["done", "skipped", "in-progress"]).describe("Status penyelesaian"),
        },
        async execute(args) {
          const progress = updateProgress({
            projectDir,
            topic: args.topic,
            item: args.item,
            status: args.status,
          })
          return `Progress diupdate.\n\n${renderDashboard(progress)}`
        },
      }),

      cs_assess_quiz: tool({
        description: "Berikan penilaian rubrik terhadap jawaban user di quiz atau sesi belajar.",
        args: {
          answers: tool.schema.string().describe("Jawaban user dalam format JSON atau teks"),
          topic: tool.schema.string().describe("Topik yang dinilai"),
          stage: tool.schema.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).describe("Tahap Bloom saat ini"),
        },
        async execute(args) {
          let answers: Record<string, string> = {}
          try {
            answers = JSON.parse(args.answers)
          } catch {
            answers = { response: args.answers }
          }

          const rubric = assessQuiz({
            answers,
            topic: args.topic,
            stage: args.stage,
          })

          return renderAssessment(rubric)
        },
      }),

      cs_resume_session: tool({
        description: "Load sesi belajar sebelumnya. Cek .codingschool/sessions/ untuk checkpoint terakhir.",
        args: {
          date: tool.schema.string().optional().describe("Tanggal sesi (YYYY-MM-DD). Kosongkan untuk sesi terbaru"),
        },
        async execute(args) {
          if (args.date) {
            const result = resumeSession(projectDir)
            if (result.hasSession && result.session) {
              return `Checkpoint sesi **${result.date}**:
- Topik: ${result.session.topic}
- Level: ${result.session.level}
- Progress: ${result.session.progressPercent}%
- Tahap: ${result.session.bloomStage}
- Terakhir: ${result.session.lastActivity}

Lanjutkan dari sini?`
            }
            return `Tidak ada sesi untuk tanggal ${args.date}.`
          }

          const latest = getLatestSessionInfo(projectDir)
          if (latest) {
            return `Checkpoint terakhir: sesi **${latest.date}**.
- Topik: ${latest.data.topic}
- Progress: ${latest.data.progressPercent}%
- Tahap Bloom: ${latest.data.bloomStage}

Lanjutkan belajar atau mulai topik baru?`
          }

          return "Belum ada sesi belajar sebelumnya. Mulai petualangan belajarmu sekarang!"
        },
      }),
    },

    event: async ({ event }) => {
      if (event.type === "session.created") {
        ensureDir(join(projectDir, ".codingschool", "sessions"))
      }
    },
  }
}

function join(...args: string[]): string {
  const { join: pathJoin } = require("path")
  return pathJoin(...args)
}
