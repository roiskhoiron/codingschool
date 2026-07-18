import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs"
import { join } from "path"
import { isMigrationNeeded, migrate, renderMigrationResult } from "./migration"

const TEST_DIR = join(import.meta.dir, "..", ".lean-ctx", "test-migration")
const TEST_GLOBAL_DIR = join(TEST_DIR, "global")

function cleanup() {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
}

beforeEach(() => {
  cleanup()
  mkdirSync(TEST_DIR, { recursive: true })
  mkdirSync(TEST_GLOBAL_DIR, { recursive: true })
})

afterEach(() => {
  cleanup()
})

function writeProgress(topics: Record<string, unknown> = {}, xp = 0) {
  const dir = join(TEST_DIR, ".codingschool")
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, "progress.json"),
    JSON.stringify({
      topics,
      global: { softwareEngineering: 0, knowledge: 0, practice: 0, architecture: 0 },
      xp,
      level: 1,
    }),
  )
}

describe("isMigrationNeeded", () => {
  test("returns false when no progress.json exists", () => {
    expect(isMigrationNeeded(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })).toBe(false)
  })

  test("returns false when migration marker exists", () => {
    writeProgress({ typescript: { name: "typescript", percent: 50 } })
    const markerDir = join(TEST_DIR, ".codingschool")
    writeFileSync(join(markerDir, ".migrated-v2"), JSON.stringify({ migrated: true }))
    expect(isMigrationNeeded(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })).toBe(false)
  })

  test("returns true when progress exists but no marker", () => {
    writeProgress({ typescript: { name: "typescript", percent: 50 } })
    expect(isMigrationNeeded(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })).toBe(true)
  })
})

describe("migrate", () => {
  test("returns not needed when no progress exists", () => {
    const result = migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    expect(result.migrated).toBe(false)
  })

  test("migrates empty topics", () => {
    writeProgress()
    const result = migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    expect(result.migrated).toBe(true)
    expect(result.topics).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  test("migrates topics to knowledge nodes", () => {
    writeProgress({
      typescript: { name: "typescript", percent: 60, theory: ["basics"], completedTheory: ["basics"], practice: ["ex1"], completedPractice: [] },
    })
    const result = migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    expect(result.migrated).toBe(true)
    expect(result.topics).toBe(1)
    expect(result.errors).toHaveLength(0)
  })

  test("creates student-model.json", () => {
    writeProgress({ typescript: { name: "typescript", percent: 50 } })
    migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    expect(existsSync(join(TEST_GLOBAL_DIR, "student-model.json"))).toBe(true)
  })

  test("creates competency.json", () => {
    writeProgress({ typescript: { name: "typescript", percent: 50 } })
    migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    const compPath = join(TEST_DIR, ".codingschool", "competency.json")
    expect(existsSync(compPath)).toBe(true)
    const data = JSON.parse(readFileSync(compPath, "utf-8"))
    expect(data.topics.typescript).toBeDefined()
    expect(data.topics.typescript.knowledge).toBe(45)
  })

  test("creates migration marker", () => {
    writeProgress({ typescript: { name: "typescript", percent: 50 } })
    migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    const marker = join(TEST_DIR, ".codingschool", ".migrated-v2")
    expect(existsSync(marker)).toBe(true)
  })

  test("does not re-migrate after marker exists", () => {
    writeProgress({ typescript: { name: "typescript", percent: 50 } })
    const first = migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    expect(first.migrated).toBe(true)
    const second = migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    expect(second.migrated).toBe(false)
  })

  test("sets level based on xp", () => {
    writeProgress({ typescript: { name: "typescript", percent: 50 } }, 2000)
    migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    const model = JSON.parse(readFileSync(join(TEST_GLOBAL_DIR, "student-model.json"), "utf-8"))
    expect(model.currentLevel).toBe("intermediate")
  })

  test("populates weak areas for low percent", () => {
    writeProgress({ typescript: { name: "typescript", percent: 20 } })
    migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    const model = JSON.parse(readFileSync(join(TEST_GLOBAL_DIR, "student-model.json"), "utf-8"))
    expect(model.weakAreas).toContain("typescript")
  })

  test("populates strengths for high percent", () => {
    writeProgress({ typescript: { name: "typescript", percent: 80 } })
    migrate(TEST_DIR, { globalDir: TEST_GLOBAL_DIR })
    const model = JSON.parse(readFileSync(join(TEST_GLOBAL_DIR, "student-model.json"), "utf-8"))
    expect(model.strengths).toContain("typescript")
  })
})

describe("renderMigrationResult", () => {
  test("renders not needed", () => {
    expect(renderMigrationResult({ migrated: false, topics: 0, errors: [] })).toBe("Migration not needed.")
  })

  test("renders migrated count", () => {
    expect(renderMigrationResult({ migrated: true, topics: 3, errors: [] })).toContain("3 topic(s)")
  })

  test("renders errors", () => {
    const result = { migrated: true, topics: 1, errors: ["Failed to write student-model.json: EACCES"] }
    expect(renderMigrationResult(result)).toContain("EACCES")
  })
})
