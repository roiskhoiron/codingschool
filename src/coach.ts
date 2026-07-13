import type { CoachIntent, CoachChoice, ProgressData } from "./utils/types"
import { prerequisiteGateMessage, bloomStagePrompt } from "./utils/templates"
import { getLatestSessionDate, isProfileExists } from "./utils/paths"
import { readJson } from "./utils/fs"
import { join } from "path"

export interface CoachContext {
  projectDir: string
}

export interface CoachResponse {
  message: string
  shouldPromptChoice?: boolean
  intent: CoachIntent
}

export function createCoachContext(projectDir: string): CoachContext {
  return { projectDir }
}

export function handleGreeting(ctx: CoachContext): CoachResponse {
  if (!isProfileExists(ctx.projectDir)) {
    return { message: "", intent: "greeting" }
  }
  const latestSession = getLatestSessionDate(ctx.projectDir)
  if (latestSession) {
    return {
      message: `Welcome back! Your last session was on ${latestSession}.\nWould you like to continue or start a new topic?`,
      intent: "greeting",
    }
  }
  return {
    message: `Good to see you again!\nAnything you'd like to learn or ask today?`,
    intent: "greeting",
  }
}

export function handleLearnTopic(topic: string): CoachResponse {
  return {
    message: contextEstimation(topic),
    shouldPromptChoice: true,
    intent: "learn-topic",
  }
}

export function handleQuestionRoadmap(
  projectDir: string,
  topic: string,
  askedItem: string,
): CoachResponse {
  const progress = readJson<ProgressData>(
    progressPath(projectDir),
    { topics: {}, global: { softwareEngineering: 0, knowledge: 0, practice: 0, architecture: 0 }, xp: 0, level: 1 },
  )

  const activeTopic = Object.keys(progress.topics).find(
    t => progress.topics[t].percent > 0 && progress.topics[t].percent < 100,
  )

  if (activeTopic) {
    const plan = progress.topics[activeTopic]
    if (!plan.practice.includes(askedItem) && !plan.theory.includes(askedItem)) {
      return {
        message: `I see you're currently focused on **${activeTopic}**.\n\n"${askedItem}" is not in your active roadmap. Your next planned steps are:\n- ${plan.theory.filter(t => !plan.theory.includes(t)).join("\n- ")}\n\nStay focused on the current plan.`,
        intent: "question-roadmap",
      }
    }
    return {
      message: `Yes, "${askedItem}" is in your **${activeTopic}** roadmap. Go ahead and work on it. Let me know when you're done so I can review.`,
      intent: "question-roadmap",
    }
  }

  return {
    message: `You don't have an active roadmap yet. Would you like me to create a learning plan for you?`,
    intent: "question-roadmap",
  }
}

export function handlePrerequisiteQuestion(
  projectDir: string,
  askedTopic: string,
): CoachResponse {
  const missing = findMissingPrerequisite(projectDir, askedTopic)
  if (missing) {
    return {
      message: prerequisiteGateMessage(askedTopic, missing),
      intent: "question-prerequisite",
    }
  }
  return {
    message: `Great! You seem ready to learn ${askedTopic}.\n\n${bloomStagePrompt("remember", askedTopic)}`,
    intent: "question-prerequisite",
  }
}

export function handleAchievement(topic: string): CoachResponse {
  return {
    message: `Well done! That's solid understanding.\n\nI'll log your progress. Ready for the next challenge or want to review first?`,
    intent: "achievement",
  }
}

export function handleResume(projectDir: string): CoachResponse {
  const latestDate = getLatestSessionDate(projectDir)
  if (!latestDate) {
    return {
      message: `No previous sessions found. Start a new learning journey? Tell me a topic you'd like to study.`,
      intent: "resume",
    }
  }
  return {
    message: `Last checkpoint: session **${latestDate}**.`,
    intent: "resume",
  }
}

export function processCoachingChoice(choice: CoachChoice): CoachResponse {
  if (choice === "A") {
    return {
      message: "Alright, I'll help you get the task done. Tell me what needs to be done.",
      intent: "complete-task",
    }
  }
  return {
    message: "Great! Let's start your learning journey. What topic would you like to study?",
    intent: "learn-topic",
  }
}

function contextEstimation(topic: string): string {
  return `I will be your mentor.

Topic:
✔ ${topic}

Estimated context needed:

  Beginner    ≈ 25k context
  Intermediate ≈ 80k context
  Expert      ≈ 250k context

Pick a level to start.`
}

function progressPath(projectDir: string): string {
  return join(projectDir, ".codingschool", "progress.json")
}

function findMissingPrerequisite(projectDir: string, topic: string): string | null {
  return null
}
