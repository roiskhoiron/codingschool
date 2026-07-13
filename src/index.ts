import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "path"

import { createCoachContext, handleGreeting, processCoachingChoice } from "./coach"
import { createRoadmap } from "./roadmap/generator"
import { getProgress, updateProgress, renderDashboard } from "./progress/tracker"
import { assessQuiz, renderAssessment } from "./assessment/engine"
import { resumeSession, createOrUpdateSession, getLatestSessionInfo } from "./session/resume"
import { isProfileExists, readProfile } from "./utils/paths"
import { writeMarkdown, ensureDir } from "./utils/fs"
import { onboardingMessage, choicePrompt } from "./utils/templates"

export const CodingSchoolPlugin: Plugin = async ({ directory }) => {
  const projectDir = directory || "."

  return {
    tool: {
      cs_coach_dialog: tool({
        description: "Start a dialog with the CodingSchool coach. Call when the user wants to learn or needs guidance.",
        args: {
          message: tool.schema.string(),
          choice: tool.schema.string().optional(),
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
          return greeting.message || "How can I help you learn today?"
        },
      }),

      cs_create_roadmap: tool({
        description: "Create a new learning roadmap for a specific topic. Creates a learning contract in .codingschool/roadmap/",
        args: {
          topic: tool.schema.string(),
          level: tool.schema.enum(["beginner", "intermediate", "expert"]),
        },
        async execute(args) {
          const path = createRoadmap({
            projectDir,
            topic: args.topic,
            level: args.level,
          })
          return `Learning plan created at \`${path}\`\n\n${choicePrompt()}`
        },
      }),

      cs_update_progress: tool({
        description: "Update the user's learning progress. Mark items as completed in the roadmap.",
        args: {
          topic: tool.schema.string(),
          item: tool.schema.string(),
          status: tool.schema.enum(["done", "skipped", "in-progress"]),
        },
        async execute(args) {
          const progress = updateProgress({
            projectDir,
            topic: args.topic,
            item: args.item,
            status: args.status,
          })
          return `Progress updated.\n\n${renderDashboard(progress)}`
        },
      }),

      cs_assess_quiz: tool({
        description: "Provide a rubric-based assessment of the user's answers in a quiz or learning session.",
        args: {
          answers: tool.schema.string(),
          topic: tool.schema.string(),
          stage: tool.schema.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]),
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
        description: "Load the previous learning session. Check .codingschool/sessions/ for the last checkpoint.",
        args: {
          date: tool.schema.string().optional(),
        },
        async execute(args) {
          if (args.date) {
            const result = resumeSession(projectDir)
            if (result.hasSession && result.session) {
              return `Checkpoint session **${result.date}**:
- Topic: ${result.session.topic}
- Level: ${result.session.level}
- Progress: ${result.session.progressPercent}%
- Stage: ${result.session.bloomStage}
- Last activity: ${result.session.lastActivity}

Continue from here?`
            }
            return `No session found for date ${args.date}.`
          }

          const latest = getLatestSessionInfo(projectDir)
          if (latest) {
            return `Last checkpoint: session **${latest.date}**.
- Topic: ${latest.data.topic}
- Progress: ${latest.data.progressPercent}%
- Bloom Stage: ${latest.data.bloomStage}

Continue learning or start a new topic?`
          }

          return "No previous learning sessions found. Start your learning journey now!"
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
