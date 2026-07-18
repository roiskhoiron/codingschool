import { writeMarkdown, ensureDir, readJson, writeJson } from "../utils/fs"
import { roadmapDir, topicRoadmapPath } from "../utils/paths"
import type { ProgressData } from "../utils/types"
import { join } from "path"
import { readdirSync, existsSync, readFileSync } from "fs"

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

export interface RoadmapItem {
  section: string
  text: string
  checked: boolean
}

export function listRoadmapItems(projectDir: string, topic: string): RoadmapItem[] {
  const dir = roadmapDir(projectDir)
  const topicDir = join(dir, topic.toLowerCase())
  if (!existsSync(topicDir)) return []

  const files = readdirSync(topicDir).filter(f => f.endsWith(".md"))
  if (files.length === 0) return []

  const content = readFileSync(join(topicDir, files[0]), "utf-8")
  const lines = content.split("\n")
  const items: RoadmapItem[] = []
  let currentSection = ""

  for (const line of lines) {
    const sectionMatch = line.match(/^## (.+)/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      continue
    }

    const checkMatch = line.match(/^(- \[[ x]\] )(.+)/)
    if (checkMatch) {
      items.push({
        section: currentSection,
        text: checkMatch[2],
        checked: line.startsWith("- [x]"),
      })
    }
  }

  return items
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
