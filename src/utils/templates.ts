import type { CoachIntent, BloomStage } from "./types"

export function detectIntent(message: string): CoachIntent {
  const lower = message.toLowerCase()

  if (/^(hi|hello|hey|halo|hai|selamat pagi|siang|sore|malam)\b/.test(lower)) {
    return "greeting"
  }

  if (/^(saya|aku|gue)\s+(ingin|mau|pengen)\s+(belajar|mempelajari)/.test(lower)) {
    return "learn-topic"
  }

  if (/^(belajar|paham|faham|mengerti|ngerti)\b/.test(lower)) {
    return "learn-topic"
  }

  if (/^baik(|lah|,\s*saya\s+faham|\s*saya\s+mengerti)/.test(lower)) {
    return "achievement"
  }

  if (/^(saya|aku)\s+(berhasil|sudah|selesai)/.test(lower)) {
    return "achievement"
  }

  if (/^(lanjut|siap|ayo)\b/.test(lower)) {
    return "resume"
  }

  if (/^(apakah|haruskah|perlukah)\b/.test(lower)) {
    return "question-roadmap"
  }

  if (/^(bagaimana|cara|gimana)\b/.test(lower)) {
    return "question-prerequisite"
  }

  if (/\bselesai|selesaiin|kerjakan\b/.test(lower)) {
    return "complete-task"
  }

  if (/^(progress|sejauh\s+mana|status)\b/.test(lower)) {
    return "status-check"
  }

  return "unknown"
}

export function onboardingMessage(): string {
  return `Halo! Saya mentor CodingSchool.

Saya akan membantu kamu belajar software engineering dengan cara yang benar — bukan sekadar menghasilkan kode.

Ceritakan goal belajar atau topik yang ingin kamu pelajari.
Saya akan buat learning plan yang sesuai untukmu.`
}

export function choicePrompt(): string {
  return `Apakah kamu ingin:

A. Menyelesaikan pekerjaan

atau

B. Belajar membangun kemampuan?`
}

export function contextEstimation(topic: string): string {
  return `Saya akan menjadi mentor Anda.

Topik:
✔ ${topic}

Estimasi kebutuhan konteks:

  Beginner    ≈ 25k context
  Intermediate ≈ 80k context
  Expert      ≈ 250k context

Pilih level untuk memulai.`
}

export function bloomStagePrompt(stage: BloomStage, topic: string): string {
  const prompts: Record<BloomStage, string> = {
    remember: `Apa yang kamu pahami tentang ${topic}?`,
    understand: `Mengapa ${topic} digunakan? Jelaskan dengan kata-katamu sendiri.`,
    apply: `Implementasikan ${topic} dalam kode.`,
    analyze: `Apa kelemahan atau keterbatasan dari ${topic}?`,
    evaluate: `Bandingkan ${topic} dengan pendekatan alternatif. Mana yang lebih baik dan mengapa?`,
    create: `Bangun sebuah aplikasi sederhana yang menggunakan ${topic}.`,
  }
  return prompts[stage]
}

export function prerequisiteGateMessage(
  askedTopic: string,
  missingTopic: string,
): string {
  return `Saya tidak akan menjelaskan ${askedTopic} sekarang.

Selesaikan **${missingTopic}** terlebih dahulu.

Karena ${askedTopic} akan lebih mudah dipahami setelah kamu menguasai ${missingTopic}.`
}
