import { existsSync, readFileSync, readdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { box, text } from "./element-helpers"
import type { ViewNode } from "./element-helpers"
import type { StudentModel, CompetencyScores, CompetencyData, EngineeringCompetency } from "../utils/types"

type ThemeColor = unknown

type ThemeLike = {
  readonly primary?: ThemeColor
  readonly accent?: ThemeColor
  readonly error?: ThemeColor
  readonly warning?: ThemeColor
  readonly success?: ThemeColor
  readonly info?: ThemeColor
  readonly text?: ThemeColor
  readonly textMuted?: ThemeColor
  readonly border?: ThemeColor
  readonly borderSubtle?: ThemeColor
  readonly background?: ThemeColor
  readonly backgroundPanel?: ThemeColor
}

type RoadmapDetail = {
  topic: string
  level: string
  percent: number
  status: string
  theory: number
  theoryDone: number
  practice: number
  practiceDone: number
}

type ProgressData = {
  xp: number
  level: number
  topics: Record<string, TopicData>
  global: GlobalMetrics
}

type TopicData = {
  name: string
  percent: number
  theory: string[]
  completedTheory: string[]
  practice: string[]
  completedPractice: string[]
  quizzes: string[]
}

type GlobalMetrics = {
  softwareEngineering: number
  knowledge: number
  practice: number
  architecture: number
}

// --- File readers ---

function findProjectDir(directory: string, worktree: string): string {
  for (const dir of [directory, worktree]) {
    const path = join(dir, ".codingschool", "progress.json")
    if (existsSync(path)) return dir
  }
  return directory
}

function readJsonSafe<T>(path: string): T | null {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T
  } catch { return null }
}

function readStudentModel(): StudentModel | null {
  const p = join(homedir(), ".config", "opencode", "codingschool", "student-model.json")
  return readJsonSafe<StudentModel>(p)
}

function readCompetency(projectDir: string): CompetencyData | null {
  return readJsonSafe<CompetencyData>(join(projectDir, ".codingschool", "competency.json"))
}

function readEngineering(projectDir: string): EngineeringCompetency | null {
  return readJsonSafe<EngineeringCompetency>(join(projectDir, ".codingschool", "engineering.json"))
}

function readProgress(projectDir: string): ProgressData | null {
  return readJsonSafe<ProgressData>(join(projectDir, ".codingschool", "progress.json"))
}

function parseMdRoadmap(content: string): {
  topic: string
  level: string
  percent: number
  status: string
  theory: number
  theoryDone: number
  practice: number
  practiceDone: number
} {
  const lines = content.split("\n")
  let topic = ""
  let level = ""
  let percent = 0
  let status = "not-started"
  let inQuizOrFinal = false
  let theory = 0, theoryDone = 0
  let practice = 0, practiceDone = 0

  for (const line of lines) {
    if (line.startsWith("# ")) {
      const parts = line.replace(/^#\s+/, "").split("—").map(s => s.trim())
      topic = parts[0] || ""
      level = parts[1] || ""
    } else if (line.startsWith("## ")) {
      const sectionTitle = line.replace(/^##\s+/, "").toLowerCase()
      inQuizOrFinal = sectionTitle.includes("quiz") || sectionTitle.includes("final project") || sectionTitle.includes("key takeaway")
    } else if (line.startsWith("Status:")) {
      if (line.includes("Completed") || line.includes("✅")) status = "completed"
      else if (line.includes("In Progress") || line.includes("🟨")) status = "in-progress"
    } else if (line.match(/^\s*-\s+\[([ x])\]/)) {
      const checked = line.match(/^\s*-\s+\[([ x])\]/)![1] === "x"
      if (inQuizOrFinal) {
        if (checked) theoryDone++
        theory++
      } else {
        if (checked) theoryDone++
        theory++
      }
    } else if (line.startsWith("Progress:")) {
      const m = line.match(/Progress:\s*(\d+)%/)
      if (m && percent === 0) percent = parseInt(m[1], 10)
    }
  }

  const totalItems = theory
  const doneItems = theoryDone
  if (totalItems > 0) {
    percent = Math.round((doneItems / totalItems) * 100)
  }

  return { topic, level, percent, status, theory, theoryDone, practice, practiceDone }
}

function readRoadmapsMd(projectDir: string): RoadmapDetail[] {
  const dir = join(projectDir, ".codingschool", "roadmap")
  if (!existsSync(dir)) return []
  const result: RoadmapDetail[] = []
  try {
    const topics = readdirSync(dir)
    for (const topicDir of topics) {
      const topicPath = join(dir, topicDir)
      if (!existsSync(topicPath) || !readdirSync(topicPath).some(f => f.endsWith(".md"))) continue
      const files = readdirSync(topicPath).filter(f => f.endsWith(".md"))
      for (const file of files) {
        const content = readFileSync(join(topicPath, file), "utf-8")
        result.push(parseMdRoadmap(content))
      }
    }
  } catch { return [] }
  return result
}

// --- Rendering helpers ---

function scoreToStars(score: number): number {
  if (score === 0) return 0
  if (score < 20) return 1
  if (score < 40) return 2
  if (score < 60) return 3
  if (score < 80) return 4
  return 5
}

function renderStarsCompact(score: number): string {
  const stars = scoreToStars(score)
  return "★".repeat(stars) + "☆".repeat(5 - stars)
}

function renderLevelBadge(level: string): string {
  const badges: Record<string, string> = {
    beginner: "🌱 Beginner",
    foundation: "📚 Foundation",
    intermediate: "⚡ Intermediate",
    advanced: "🔥 Advanced",
    expert: "🏆 Expert",
  }
  return badges[level] || level
}

// --- Build sections ---

export function buildCodingSchoolView(
  directory: string,
  worktree: string,
  theme: ThemeLike,
): ViewNode[] {
  const projectDir = findProjectDir(directory, worktree)
  const studentModel = readStudentModel()
  const competency = readCompetency(projectDir)
  const engineering = readEngineering(projectDir)
  const progress = readProgress(projectDir)
  const roadmaps = readRoadmapsMd(projectDir)

  const hasLegacy = progress !== null || roadmaps.length > 0
  const hasV2 = studentModel !== null || competency !== null

  if (!hasLegacy && !hasV2) {
    return []
  }

  const sections: ViewNode[] = []

  if (hasV2) {
    sections.push(buildStudentModelSection(studentModel, theme))
    if (competency && Object.keys(competency.topics).length > 0) {
      sections.push(buildCompetencySection(competency, theme))
    }
    if (engineering) {
      sections.push(buildEngineeringSection(engineering, theme))
    }
  }

  if (hasLegacy) {
    sections.push(buildProgressSection(progress, theme))
    sections.push(...roadmaps.flatMap(r => buildRoadmapSection(r, theme)))
  }

  return [
    box({ flexDirection: "column", gap: 1 }, sections),
  ]
}

function buildStudentModelSection(model: StudentModel | null, theme: ThemeLike): ViewNode {
  if (!model) {
    return section("AI Mentor", theme, [
      text({ fg: theme.textMuted }, "No student profile yet."),
      text({ fg: theme.textMuted }, "Start a session to begin."),
    ])
  }

  const knowledgeCount = Object.keys(model.knowledge).length
  const misconceptionCount = model.misconceptions.filter(m => !m.resolved).length

  return section(model.name ? `👤 ${model.name}` : "AI Mentor", theme, [
    text({ fg: theme.text }, `${renderLevelBadge(model.currentLevel)}  Conf ${model.confidence}%`),
    text({ fg: theme.textMuted }, `Style: ${model.preferredStyle}`),
    model.learningGoal
      ? text({ fg: theme.textMuted }, `Goal: ${model.learningGoal.slice(0, 40)}${model.learningGoal.length > 40 ? "..." : ""}`)
      : null,
    text({ fg: theme.textMuted }, `${knowledgeCount} topics  ${misconceptionCount} active misconceptions`),
  ].filter(Boolean) as ViewNode[])
}

function buildCompetencySection(data: CompetencyData, theme: ThemeLike): ViewNode {
  const topics = Object.entries(data.topics)
  return section("Competency", theme, [
    ...topics.slice(0, 5).map(([topic, comp]) => {
      const avg = Math.round((comp.knowledge + comp.implementation + comp.debugging + comp.teaching) / 4)
      return text({ fg: theme.textMuted }, `${topic}  ${renderStarsCompact(avg)}  ${avg}/100`)
    }),
    topics.length > 5
      ? text({ fg: theme.textMuted }, `+${topics.length - 5} more`)
      : null,
  ].filter(Boolean) as ViewNode[])
}

function buildEngineeringSection(eng: EngineeringCompetency, theme: ThemeLike): ViewNode {
  const dims: [string, number][] = [
    ["Code Quality", eng.codeQuality],
    ["Architecture", eng.architectureThinking],
    ["Git Process", eng.gitProcess],
    ["Testing", eng.testingMindset],
    ["Documentation", eng.documentation],
    ["Collaboration", eng.collaboration],
    ["GRC", eng.grcAwareness],
    ["Risk", eng.riskAssessment],
  ]

  return section("Engineering", theme, [
    ...dims.map(([name, score]) => {
      return text({ fg: theme.textMuted }, `${name}  ${renderStarsCompact(score)}`)
    }),
  ])
}

function buildProgressSection(progress: ProgressData | null, theme: ThemeLike): ViewNode {
  if (!progress) {
    return section("Progress", theme, [
      text({ fg: theme.textMuted }, "No roadmap data yet."),
    ])
  }
  const { xp, level } = progress
  const xpNext = (level + 1) * 1000
  const xpProgress = Math.round((xp / xpNext) * 100)
  const topicCount = Object.keys(progress.topics).length
  const completedTopics = Object.values(progress.topics).filter(t => t.percent >= 100).length

  return section("Progress", theme, [
    text({ fg: theme.text }, `Level ${level}  XP ${xp}/${xpNext}`),
    progressBar(xpProgress, 12),
    text({ fg: theme.textMuted }, `${completedTopics}/${topicCount} topics done`),
  ])
}

function buildRoadmapSection(r: RoadmapDetail, theme: ThemeLike): ViewNode[] {
  const color = r.status === "completed" ? theme.success
    : r.status === "in-progress" ? theme.accent
    : theme.textMuted
  return [
    section(
      r.topic,
      theme,
      [
        text({ fg: theme.textMuted }, `${r.level}  ${r.percent}%`),
        progressBar(r.percent, 12),
        text({ fg: theme.textMuted }, `T ${r.theoryDone}/${r.theory}`),
        r.practice > 0 ? text({ fg: theme.textMuted }, `P ${r.practiceDone}/${r.practice}`) : null,
      ].filter(Boolean) as ViewNode[],
    ),
  ]
}

function section(title: string, theme: ThemeLike, children: readonly ViewNode[]): ViewNode {
  return box({ borderStyle: "single", borderColor: theme.borderSubtle, flexDirection: "column", padding: 1 }, [
    text({ fg: theme.info }, title),
    ...children,
  ])
}

function progressBar(percent: number, width: number): ViewNode {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)
  const empty = width - filled
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty)
  return text({}, bar)
}
