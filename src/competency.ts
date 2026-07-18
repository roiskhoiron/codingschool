import { readJson, writeJson, ensureDir } from "./utils/fs"
import { join } from "path"
import type {
  CompetencyScores,
  CompetencyData,
  CompetencyDimension,
  EngineeringCompetency,
  LearningLevel,
} from "./utils/types"

function defaultCompetencyScores(): CompetencyScores {
  return { knowledge: 0, implementation: 0, debugging: 0, teaching: 0 }
}

function defaultCompetencyData(): CompetencyData {
  return { topics: {} }
}

function defaultEngineeringCompetency(): EngineeringCompetency {
  return {
    codeQuality: 0,
    architectureThinking: 0,
    gitProcess: 0,
    testingMindset: 0,
    documentation: 0,
    collaboration: 0,
    grcAwareness: 0,
    riskAssessment: 0,
  }
}

function competencyPath(projectDir: string): string {
  return join(projectDir, ".codingschool", "competency.json")
}

function engineeringPath(projectDir: string): string {
  return join(projectDir, ".codingschool", "engineering.json")
}

export function loadCompetency(projectDir: string): CompetencyData {
  return readJson<CompetencyData>(competencyPath(projectDir), defaultCompetencyData())
}

export function saveCompetency(projectDir: string, data: CompetencyData): void {
  ensureDir(join(projectDir, ".codingschool"))
  writeJson(competencyPath(projectDir), data)
}

export function loadEngineering(projectDir: string): EngineeringCompetency {
  return readJson<EngineeringCompetency>(engineeringPath(projectDir), defaultEngineeringCompetency())
}

export function saveEngineering(projectDir: string, data: EngineeringCompetency): void {
  ensureDir(join(projectDir, ".codingschool"))
  writeJson(engineeringPath(projectDir), data)
}

export function getTopicCompetency(projectDir: string, topic: string): CompetencyScores {
  const data = loadCompetency(projectDir)
  return data.topics[topic] || defaultCompetencyScores()
}

export function updateTopicCompetency(
  projectDir: string,
  topic: string,
  updates: Partial<CompetencyScores>,
): CompetencyScores {
  const data = loadCompetency(projectDir)
  const current = data.topics[topic] || defaultCompetencyScores()

  data.topics[topic] = {
    knowledge: clampScore(updates.knowledge ?? current.knowledge),
    implementation: clampScore(updates.implementation ?? current.implementation),
    debugging: clampScore(updates.debugging ?? current.debugging),
    teaching: clampScore(updates.teaching ?? current.teaching),
  }

  saveCompetency(projectDir, data)
  return data.topics[topic]
}

export function updateSingleDimension(
  projectDir: string,
  topic: string,
  dimension: CompetencyDimension,
  score: number,
): CompetencyScores {
  const data = loadCompetency(projectDir)
  const current = data.topics[topic] || defaultCompetencyScores()

  current[dimension] = clampScore(score)
  data.topics[topic] = current

  saveCompetency(projectDir, data)
  return current
}

export function scoreToStars(score: number): number {
  if (score <= 0) return 0
  if (score < 20) return 1
  if (score < 40) return 2
  if (score < 60) return 3
  if (score < 80) return 4
  return 5
}

export function renderStars(score: number): string {
  const stars = scoreToStars(score)
  const empty = 5 - stars
  return "★".repeat(stars) + "☆".repeat(empty > 0 ? empty : 0)
}

export function renderCompetencyBar(score: number, width: number = 10): string {
  const filled = Math.round((score / 100) * width)
  const empty = width - filled
  return "█".repeat(filled) + "░".repeat(empty)
}

export function renderTopicCompetency(
  projectDir: string,
  topic: string,
): string {
  const c = getTopicCompetency(projectDir, topic)
  const lines: string[] = []
  lines.push(`${topic}`)
  lines.push(`  Knowledge       ${renderStars(c.knowledge)}   ${renderCompetencyBar(c.knowledge)} ${c.knowledge}/100`)
  lines.push(`  Implementation  ${renderStars(c.implementation)}   ${renderCompetencyBar(c.implementation)} ${c.implementation}/100`)
  lines.push(`  Debugging       ${renderStars(c.debugging)}   ${renderCompetencyBar(c.debugging)} ${c.debugging}/100`)
  lines.push(`  Teaching        ${renderStars(c.teaching)}   ${renderCompetencyBar(c.teaching)} ${c.teaching}/100`)
  return lines.join("\n")
}

export function renderAllCompetencies(projectDir: string): string {
  const data = loadCompetency(projectDir)
  const topics = Object.keys(data.topics)
  if (topics.length === 0) return "No competency data yet."

  const lines: string[] = []
  for (const topic of topics) {
    lines.push(renderTopicCompetency(projectDir, topic))
    lines.push("")
  }
  return lines.join("\n").trim()
}

export function calculateTopicAverage(comp: CompetencyScores): number {
  return Math.round(
    (comp.knowledge + comp.implementation + comp.debugging + comp.teaching) / 4,
  )
}

export function calculateLevelProgress(
  projectDir: string,
  targetLevel: LearningLevel,
): number {
  const data = loadCompetency(projectDir)
  const targets = LEVEL_TARGETS[targetLevel]
  if (!targets) return 0

  const topics = Object.values(data.topics)
  if (topics.length === 0) return 0

  let totalProgress = 0
  const dimensions: CompetencyDimension[] = ["knowledge", "implementation", "debugging", "teaching"]

  for (const dim of dimensions) {
    const target = targets[dim]
    if (!target) continue
    const avg = topics.reduce((s, t) => s + t[dim], 0) / topics.length
    totalProgress += Math.min(100, (avg / target) * 100)
  }

  return Math.round(totalProgress / dimensions.length)
}

const LEVEL_TARGETS: Record<LearningLevel, Partial<CompetencyScores>> = {
  beginner: { knowledge: 40, implementation: 20 },
  foundation: { knowledge: 60, implementation: 40, debugging: 20 },
  intermediate: { knowledge: 80, implementation: 60, debugging: 40, teaching: 20 },
  advanced: { knowledge: 100, implementation: 80, debugging: 60, teaching: 40 },
  expert: { knowledge: 100, implementation: 100, debugging: 100, teaching: 100 },
}

export function updateEngineeringCompetency(
  projectDir: string,
  updates: Partial<EngineeringCompetency>,
): EngineeringCompetency {
  const data = loadEngineering(projectDir)

  data.codeQuality = clampScore(updates.codeQuality ?? data.codeQuality)
  data.architectureThinking = clampScore(updates.architectureThinking ?? data.architectureThinking)
  data.gitProcess = clampScore(updates.gitProcess ?? data.gitProcess)
  data.testingMindset = clampScore(updates.testingMindset ?? data.testingMindset)
  data.documentation = clampScore(updates.documentation ?? data.documentation)
  data.collaboration = clampScore(updates.collaboration ?? data.collaboration)
  data.grcAwareness = clampScore(updates.grcAwareness ?? data.grcAwareness)
  data.riskAssessment = clampScore(updates.riskAssessment ?? data.riskAssessment)

  saveEngineering(projectDir, data)
  return data
}

export function renderEngineeringCompetency(projectDir: string): string {
  const e = loadEngineering(projectDir)
  const lines: string[] = []
  lines.push("Engineering Competency:")
  lines.push(`  Code Quality       ${renderCompetencyBar(e.codeQuality)} ${e.codeQuality}/100`)
  lines.push(`  Architecture       ${renderCompetencyBar(e.architectureThinking)} ${e.architectureThinking}/100`)
  lines.push(`  Git Process        ${renderCompetencyBar(e.gitProcess)} ${e.gitProcess}/100`)
  lines.push(`  Testing            ${renderCompetencyBar(e.testingMindset)} ${e.testingMindset}/100`)
  lines.push(`  Documentation      ${renderCompetencyBar(e.documentation)} ${e.documentation}/100`)
  lines.push(`  Collaboration      ${renderCompetencyBar(e.collaboration)} ${e.collaboration}/100`)
  lines.push(`  GRC Awareness      ${renderCompetencyBar(e.grcAwareness)} ${e.grcAwareness}/100`)
  lines.push(`  Risk Assessment    ${renderCompetencyBar(e.riskAssessment)} ${e.riskAssessment}/100`)
  return lines.join("\n")
}

export function getEngineeringAverage(projectDir: string): number {
  const e = loadEngineering(projectDir)
  const values = [
    e.codeQuality,
    e.architectureThinking,
    e.gitProcess,
    e.testingMindset,
    e.documentation,
    e.collaboration,
    e.grcAwareness,
    e.riskAssessment,
  ]
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length)
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}
