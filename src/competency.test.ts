import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import {
  loadCompetency,
  saveCompetency,
  loadEngineering,
  saveEngineering,
  getTopicCompetency,
  updateTopicCompetency,
  updateSingleDimension,
  scoreToStars,
  renderStars,
  renderCompetencyBar,
  renderTopicCompetency,
  renderAllCompetencies,
  calculateTopicAverage,
  calculateLevelProgress,
  updateEngineeringCompetency,
  renderEngineeringCompetency,
  getEngineeringAverage,
} from "./competency"

let tempDir: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "competency-test-"))
})

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

describe("scoreToStars", () => {
  test("returns 0 for score 0", () => {
    expect(scoreToStars(0)).toBe(0)
  })

  test("returns 1 for score 1-19", () => {
    expect(scoreToStars(1)).toBe(1)
    expect(scoreToStars(19)).toBe(1)
  })

  test("returns 4 for score 60-79", () => {
    expect(scoreToStars(60)).toBe(4)
    expect(scoreToStars(79)).toBe(4)
  })

  test("returns 5 for score 80-100", () => {
    expect(scoreToStars(80)).toBe(5)
    expect(scoreToStars(100)).toBe(5)
  })
})

describe("renderStars", () => {
  test("renders 0 stars for 0", () => {
    expect(renderStars(0)).toBe("☆☆☆☆☆")
  })

  test("renders 4 stars for 60", () => {
    expect(renderStars(60)).toBe("★★★★☆")
  })

  test("renders 5 stars for 100", () => {
    expect(renderStars(100)).toBe("★★★★★")
  })
})

describe("renderCompetencyBar", () => {
  test("renders empty bar for 0", () => {
    expect(renderCompetencyBar(0)).toBe("░░░░░░░░░░")
  })

  test("renders full bar for 100", () => {
    expect(renderCompetencyBar(100)).toBe("██████████")
  })

  test("renders half bar for 50", () => {
    expect(renderCompetencyBar(50)).toBe("█████░░░░░")
  })
})

describe("topic competency", () => {
  test("returns default when no data", () => {
    const comp = getTopicCompetency(tempDir, "REST API")
    expect(comp.knowledge).toBe(0)
    expect(comp.implementation).toBe(0)
  })

  test("creates and retrieves topic competency", () => {
    const comp = updateTopicCompetency(tempDir, "REST API", {
      knowledge: 80,
      implementation: 60,
    })
    expect(comp.knowledge).toBe(80)
    expect(comp.implementation).toBe(60)

    const retrieved = getTopicCompetency(tempDir, "REST API")
    expect(retrieved.knowledge).toBe(80)
  })

  test("clamps scores to 0-100", () => {
    const comp = updateTopicCompetency(tempDir, "REST API", {
      knowledge: 150,
    })
    expect(comp.knowledge).toBe(100)

    const comp2 = updateTopicCompetency(tempDir, "REST API", {
      knowledge: -10,
    })
    expect(comp2.knowledge).toBe(0)
  })
})

describe("updateSingleDimension", () => {
  test("updates single dimension", () => {
    updateTopicCompetency(tempDir, "REST", { knowledge: 50, implementation: 30 })
    const comp = updateSingleDimension(tempDir, "REST", "teaching", 70)
    expect(comp.teaching).toBe(70)
    expect(comp.knowledge).toBe(50)
  })
})

describe("renderTopicCompetency", () => {
  test("renders formatted output", () => {
    updateTopicCompetency(tempDir, "REST API", { knowledge: 80, implementation: 60 })
    const output = renderTopicCompetency(tempDir, "REST API")
    expect(output).toContain("REST API")
    expect(output).toContain("Knowledge")
    expect(output).toContain("Implementation")
    expect(output).toContain("★")
  })
})

describe("renderAllCompetencies", () => {
  test("returns empty message when no data", () => {
    expect(renderAllCompetencies(tempDir)).toBe("No competency data yet.")
  })

  test("renders multiple topics", () => {
    updateTopicCompetency(tempDir, "REST", { knowledge: 80 })
    updateTopicCompetency(tempDir, "SQL", { knowledge: 60 })
    const output = renderAllCompetencies(tempDir)
    expect(output).toContain("REST")
    expect(output).toContain("SQL")
  })
})

describe("calculateTopicAverage", () => {
  test("calculates average of all dimensions", () => {
    const avg = calculateTopicAverage({ knowledge: 80, implementation: 60, debugging: 40, teaching: 20 })
    expect(avg).toBe(50)
  })
})

describe("level progress", () => {
  test("returns 0 when no topics", () => {
    expect(calculateLevelProgress(tempDir, "beginner")).toBe(0)
  })

  test("calculates progress toward level targets", () => {
    updateTopicCompetency(tempDir, "REST", { knowledge: 40, implementation: 20 })
    const progress = calculateLevelProgress(tempDir, "beginner")
    expect(progress).toBeGreaterThan(0)
  })
})

describe("engineering competency", () => {
  test("returns defaults when no data", () => {
    const eng = loadEngineering(tempDir)
    expect(eng.codeQuality).toBe(0)
    expect(eng.grcAwareness).toBe(0)
  })

  test("updates engineering competency", () => {
    const eng = updateEngineeringCompetency(tempDir, {
      codeQuality: 70,
      gitProcess: 50,
    })
    expect(eng.codeQuality).toBe(70)
    expect(eng.gitProcess).toBe(50)
  })

  test("renders formatted output", () => {
    updateEngineeringCompetency(tempDir, { codeQuality: 80 })
    const output = renderEngineeringCompetency(tempDir)
    expect(output).toContain("Code Quality")
    expect(output).toContain("80/100")
  })

  test("calculates average", () => {
    updateEngineeringCompetency(tempDir, {
      codeQuality: 100,
      architectureThinking: 0,
      gitProcess: 0,
      testingMindset: 0,
      documentation: 0,
      collaboration: 0,
      grcAwareness: 0,
      riskAssessment: 0,
    })
    expect(getEngineeringAverage(tempDir)).toBe(13)
  })
})
