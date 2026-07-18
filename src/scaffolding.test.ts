import { describe, test, expect } from "bun:test"
import {
  getScaffolding,
  determineHintLevel,
  shouldEscalateHint,
  buildScaffoldingPrompt,
  type HintLevel,
} from "./scaffolding"
import type { StudentModel } from "./utils/types"

function makeModel(overrides: Partial<StudentModel["knowledge"][string]> = {}, topicKey = "testTopic"): StudentModel {
  return {
    name: "Test",
    currentLevel: "beginner",
    learningGoal: "test",
    confidence: 50,
    knowledge: {
      [topicKey]: {
        confidence: overrides.confidence ?? 50,
        level: "beginner",
        bloomStage: "understand",
        practiceCount: 0,
        lastPracticed: "",
        competency: { knowledge: 50, implementation: 50, debugging: 50, teaching: 50 },
        ...overrides,
      },
    },
    misconceptions: [],
    sessionSummaries: [],
    preferredStyle: "concept-first",
    weakAreas: [],
    strengths: [],
    patterns: { frustrationSignals: 0, curiositySignals: 0, sessionCount: 1, avgSessionLength: 30 },
  }
}

describe("determineHintLevel", () => {
  test("returns 1 for no model", () => {
    expect(determineHintLevel()).toBe(1)
  })

  test("returns 1 for high confidence (80+)", () => {
    const model = makeModel({ confidence: 85 })
    expect(determineHintLevel(model, "testTopic")).toBe(1)
  })

  test("returns 3 for medium confidence (40-59)", () => {
    const model = makeModel({ confidence: 45 })
    expect(determineHintLevel(model, "testTopic")).toBe(3)
  })

  test("returns 5 for very low confidence (<20)", () => {
    const model = makeModel({ confidence: 10 })
    expect(determineHintLevel(model, "testTopic")).toBe(5)
  })

  test("returns 1 for unknown topic", () => {
    const model = makeModel()
    expect(determineHintLevel(model, "unknown")).toBe(1)
  })
})

describe("getScaffolding", () => {
  test("returns hint level 1 for new topic", () => {
    const result = getScaffolding({ topic: "Rust" })
    expect(result.hintLevel).toBe(1)
    expect(result.technique).toBe("Socratic Questioning")
  })

  test("returns level 5 with solution for stuck student", () => {
    const model = makeModel({ confidence: 5 })
    const result = getScaffolding({ topic: "testTopic", concept: "testTopic", studentModel: model })
    expect(result.hintLevel).toBe(5)
    expect(result.technique).toBe("Solution with Explanation")
  })

  test("includes hint text", () => {
    const result = getScaffolding({ topic: "GraphQL" })
    expect(result.hint.length).toBeGreaterThan(0)
  })

  test("escalateHint is true when student is stuck", () => {
    const model = makeModel({ confidence: 15 })
    const result = getScaffolding({ topic: "testTopic", concept: "testTopic", studentModel: model })
    expect(result.escalateHint).toBe(true)
  })

  test("shouldRetry is false at level 5", () => {
    const model = makeModel({ confidence: 5 })
    const result = getScaffolding({ topic: "testTopic", concept: "testTopic", studentModel: model })
    expect(result.shouldRetry).toBe(false)
  })

  test("includes student answer context when provided", () => {
    const model = makeModel({ confidence: 30 }, "Docker")
    const result = getScaffolding({ topic: "Docker", concept: "Docker", studentAnswer: "I think it's like a VM", studentModel: model })
    expect(result.hint).toContain("VM")
  })
})

describe("shouldEscalateHint", () => {
  test("de-escalates on correct answer", () => {
    expect(shouldEscalateHint(3, 1, true)).toBe(2)
  })

  test("does not de-escalate below 1", () => {
    expect(shouldEscalateHint(1, 1, true)).toBe(1)
  })

  test("escalates after 2 failed attempts", () => {
    expect(shouldEscalateHint(2, 2, false)).toBe(3)
  })

  test("does not escalate above 5", () => {
    expect(shouldEscalateHint(5, 3, false)).toBe(5)
  })

  test("stays at current level with 1 failed attempt", () => {
    expect(shouldEscalateHint(3, 1, false)).toBe(3)
  })
})

describe("buildScaffoldingPrompt", () => {
  test("includes topic and level", () => {
    const prompt = buildScaffoldingPrompt("Kubernetes", 2)
    expect(prompt).toContain("Kubernetes")
    expect(prompt).toContain("2/5")
  })

  test("includes student answer when provided", () => {
    const prompt = buildScaffoldingPrompt("Docker", 3, "I think containers are VMs")
    expect(prompt).toContain("containers are VMs")
  })

  test("includes technique description", () => {
    const prompt = buildScaffoldingPrompt("React", 1)
    expect(prompt).toContain("guiding question")
  })
})
