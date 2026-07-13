import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname } from "path"

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function writeJson(filePath: string, data: unknown): void {
  ensureDir(dirname(filePath))
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
}

export function readJson<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T
  } catch {
    return fallback
  }
}

export function writeMarkdown(filePath: string, content: string): void {
  ensureDir(dirname(filePath))
  writeFileSync(filePath, content, "utf-8")
}

export function isFileExists(filePath: string): boolean {
  return existsSync(filePath)
}
