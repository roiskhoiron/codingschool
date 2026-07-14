import { writeMarkdown, ensureDir, readJson, writeJson } from "../utils/fs"
import { roadmapDir, topicRoadmapPath } from "../utils/paths"
import type { ProgressData } from "../utils/types"
import { join } from "path"

export interface CreateRoadmapOptions {
  projectDir: string
  topic: string
  level: "beginner" | "intermediate" | "expert"
  content: string
}

export function createRoadmap(options: CreateRoadmapOptions): string {
  const { projectDir, topic, level, content } = options

  ensureDir(roadmapDir(projectDir))
  const path = topicRoadmapPath(projectDir, topic.toLowerCase(), level)
  writeMarkdown(path, content)

  const progress = readJson<ProgressData>(
    join(projectDir, ".codingschool", "progress.json"),
    { topics: {}, global: { softwareEngineering: 0, knowledge: 0, practice: 0, architecture: 0 }, xp: 0, level: 1 },
  )

  if (!progress.topics[topic]) {
    const theory = extractChecklist(content, "Theory")
    const practice = extractChecklist(content, "Practice")
    const quizzes = extractChecklist(content, "Quiz")
    const finalProject = extractChecklist(content, "Final Project")

    progress.topics[topic] = {
      name: topic,
      percent: 0,
      theory,
      practice,
      quizzes: [...quizzes, ...finalProject],
      completedTheory: [],
      completedPractice: [],
      currentBloomStage: null,
    }
  }

  writeJson(join(projectDir, ".codingschool", "progress.json"), progress)

  return path
}

function extractChecklist(content: string, section: string): string[] {
  const lines = content.split("\n")
  let inSection = false
  const items: string[] = []

  for (const line of lines) {
    if (line.startsWith(`## ${section}`)) {
      inSection = true
      continue
    }
    if (inSection && line.startsWith("## ")) {
      break
    }
    if (inSection) {
      const match = line.match(/^-\s+\[[ x]\]\s+(.+)/)
      if (match) {
        items.push(match[1])
      }
    }
  }

  return items
}
