import type { AssessmentRubric, BloomStage } from "../utils/types"

export interface AssessOptions {
  answers: Record<string, string>
  topic: string
  stage: BloomStage
}

function analyzeResponse(response: string): { depth: number; coverage: number; clarity: number; example: boolean } {
  const lower = response.toLowerCase()

  const hasTechnicalTerms = /\b(interface|implementation|abstraction|polymorphism|inheritance|encapsulation|composition|recursion|iteration|synchronous|asynchronous|concurrent|parallel)\b/.test(lower)
  const hasComparisons = /\b(lebih\s+dari|kurang\s+dari|banding|perbedaan|kelebihan|kekurangan|instead|rather\s+than|compared|vs|versus)\b/.test(lower)
  const hasStructure = /^(\d+\.|[-*]|pertama|kedua|ketiga)/m.test(response)
  const hasCode = /`[^`]+`/.test(response) || /\b(function|class|const|let|var|import|export)\b/.test(lower)
  const hasExample = /\b(contoh|misalnya|seperti|example|e\.g\.|for\s+instance)\b/.test(lower)

  const wordCount = response.split(/\s+/).length
  const depth = wordCount > 100 ? 85 : wordCount > 50 ? 70 : wordCount > 20 ? 55 : 40
  const coverage = hasTechnicalTerms ? 85 : hasComparisons ? 75 : 60
  const clarity = hasStructure ? 85 : 65
  const example = hasExample || hasCode

  return { depth, coverage, clarity, example }
}

export function assessQuiz(options: AssessOptions): AssessmentRubric {
  const { answers, topic, stage } = options

  const allResponses = Object.values(answers).join(" ")
  const analysis = analyzeResponse(allResponses)

  const theory = analysis.coverage
  const logic = analysis.depth
  const coding = analysis.example ? 80 : 60
  const communication = analysis.clarity
  const bestPractice = analysis.example ? theory - 5 : theory - 15

  const rubric: AssessmentRubric = {
    theory: clamp(theory),
    logic: clamp(logic),
    coding: clamp(coding),
    communication: clamp(communication),
    bestPractice: clamp(bestPractice),
    total: 0,
    weakness: identifyWeakness(analysis, topic),
    feedback: generateFeedback(topic, stage, analysis),
  }

  rubric.total = Math.round(
    (rubric.theory + rubric.logic + rubric.coding + rubric.communication + rubric.bestPractice) / 5,
  )

  return rubric
}

export function renderAssessment(rubric: AssessmentRubric): string {
  return `=== Penilaian ===

Theory:         ${renderBar(rubric.theory)} ${rubric.theory}/100
Logic:          ${renderBar(rubric.logic)} ${rubric.logic}/100
Coding:         ${renderBar(rubric.coding)} ${rubric.coding}/100
Communication:  ${renderBar(rubric.communication)} ${rubric.communication}/100
Best Practice:  ${renderBar(rubric.bestPractice)} ${rubric.bestPractice}/100

Total: ${rubric.total}/100

Kesalahan terbesar:
${rubric.weakness}

${rubric.feedback}
`
}

function renderBar(score: number): string {
  const filled = Math.round(score / 10)
  return "█".repeat(filled) + "░".repeat(10 - filled)
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function identifyWeakness(analysis: { depth: number; coverage: number; clarity: number; example: boolean }, topic: string): string {
  if (!analysis.example) {
    return `Belum ada contoh kode atau implementasi ${topic}. Coba sertakan potongan kode untuk memperkuat argumen.`
  }
  if (analysis.coverage < 70) {
    return `Kurang istilah teknis dan perbandingan. Gunakan kosakata yang lebih spesifik tentang ${topic}.`
  }
  if (analysis.clarity < 70) {
    return `Struktur jawaban kurang rapi. Gunakan poin-poin atau paragraf terpisah agar lebih mudah diikuti.`
  }
  if (analysis.depth < 60) {
    return `Jawaban masih terlalu dangkal. Coba elaborasi lebih dalam tentang ${topic}.`
  }
  return `Pemahaman sudah cukup baik. Untuk naik level, latih konsistensi best practice ${topic}.`
}

function generateFeedback(topic: string, stage: BloomStage, analysis: { depth: number; coverage: number; clarity: number; example: boolean }): string {
  switch (stage) {
    case "remember":
      return `Kamu sudah mulai mengenal ${topic}. Coba jelaskan dengan bahasa sendiri untuk memperkuat pemahaman.`
    case "understand":
      if (analysis.coverage < 70) {
        return `Pemahaman masih perlu diperdalam. Coba baca ulang konsep ${topic} dan hubungkan dengan contoh nyata.`
      }
      return `Pemahaman konsep ${topic} sudah cukup baik. Saatnya implementasi!`
    case "apply":
      if (!analysis.example) {
        return `Teori sudah dikuasai, tapi belum ada implementasi. Coba tulis kode ${topic} dan jalankan.`
      }
      return `Kode sudah berjalan. Sekarang analisis kelemahan dari pendekatan yang kamu gunakan.`
    case "analyze":
      return `Analisis yang tajam! Bandingkan dengan pendekatan lain untuk memperluas wawasan.`
    case "evaluate":
      return `Evaluasi yang matang! Lanjut ke tahap akhir: bangun sesuatu yang utuh.`
    case "create":
      return `Selesai! Kamu telah melalui seluruh siklus Bloom untuk ${topic}. Luar biasa!`
  }
}
