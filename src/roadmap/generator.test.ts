import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

import { createRoadmap } from "./generator"

let tmpDir: string

const SAMPLE_CONTENT = `# Rust — Beginner

Status: 🟨 In Progress

---

## Target
Able to use and understand Rust at beginner level.

---

## Theory
- [ ] Variables & Mutability
- [ ] Data Types
- [ ] Ownership & Borrowing

---

## Practice
- [ ] Hello World
- [ ] Calculator

---

## Quiz
- [ ] Quiz 1 — Rust fundamentals

---

## Final Project
- [ ] CLI Tool

---

Progress: 0%
`

const SAMPLE_CONTENT_EXPERT = `# Rust — Expert

Status: 🟨 In Progress

---

## Target
Able to use and understand Rust at expert level.

---

## Theory
- [ ] Unsafe Rust
- [ ] FFI
- [ ] Macros
- [ ] Async/Await internals

---

## Practice
- [ ] Custom Allocator
- [ ] Parser Library

---

## Quiz
- [ ] Quiz 1 — Advanced Rust

---

## Final Project
- [ ] Runtime Implementation

---

Progress: 0%
`

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "codingschool-test-"))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

describe("createRoadmap", () => {
  it("writes a markdown file with provided content", () => {
    const path = createRoadmap({ projectDir: tmpDir, topic: "Rust", level: "beginner", content: SAMPLE_CONTENT })
    expect(existsSync(path)).toBe(true)
    expect(path).toContain("beginner.md")
  })

  it("creates progress.json entry", () => {
    createRoadmap({ projectDir: tmpDir, topic: "Rust", level: "beginner", content: SAMPLE_CONTENT })
    const progressPath = join(tmpDir, ".codingschool", "progress.json")
    expect(existsSync(progressPath)).toBe(true)
  })

  it("initializes progress at 0%", () => {
    createRoadmap({ projectDir: tmpDir, topic: "Rust", level: "beginner", content: SAMPLE_CONTENT })
    const { readFileSync } = require("fs")
    const progress = JSON.parse(readFileSync(join(tmpDir, ".codingschool", "progress.json"), "utf-8"))
    expect(progress.topics.Rust.percent).toBe(0)
  })

  it("extracts theory items from content", () => {
    createRoadmap({ projectDir: tmpDir, topic: "Rust", level: "beginner", content: SAMPLE_CONTENT })
    const { readFileSync } = require("fs")
    const progress = JSON.parse(readFileSync(join(tmpDir, ".codingschool", "progress.json"), "utf-8"))
    expect(progress.topics.Rust.theory).toEqual(["Variables & Mutability", "Data Types", "Ownership & Borrowing"])
  })

  it("extracts practice items from content", () => {
    createRoadmap({ projectDir: tmpDir, topic: "Rust", level: "beginner", content: SAMPLE_CONTENT })
    const { readFileSync } = require("fs")
    const progress = JSON.parse(readFileSync(join(tmpDir, ".codingschool", "progress.json"), "utf-8"))
    expect(progress.topics.Rust.practice).toEqual(["Hello World", "Calculator"])
  })

  it("extracts quiz items from content", () => {
    createRoadmap({ projectDir: tmpDir, topic: "Rust", level: "beginner", content: SAMPLE_CONTENT })
    const { readFileSync } = require("fs")
    const progress = JSON.parse(readFileSync(join(tmpDir, ".codingschool", "progress.json"), "utf-8"))
    expect(progress.topics.Rust.quizzes).toContain("Quiz 1 — Rust fundamentals")
  })

  it("handles different content for different levels", () => {
    createRoadmap({ projectDir: tmpDir, topic: "Rust", level: "beginner", content: SAMPLE_CONTENT })
    createRoadmap({ projectDir: tmpDir, topic: "Rust", level: "expert", content: SAMPLE_CONTENT_EXPERT })
    const { readFileSync } = require("fs")
    const progress = JSON.parse(readFileSync(join(tmpDir, ".codingschool", "progress.json"), "utf-8"))
    expect(progress.topics.Rust.theory).toHaveLength(3)
  })
})
