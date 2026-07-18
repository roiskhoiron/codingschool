import type { StudentModel, BloomStage } from "./utils/types"

export interface ScaffoldingRequest {
  topic: string
  concept?: string
  studentAnswer?: string
  studentModel?: StudentModel
}

export type HintLevel = 1 | 2 | 3 | 4 | 5

export interface ScaffoldingResponse {
  hintLevel: HintLevel
  hint: string
  technique: string
  nextAction: string
  shouldRetry: boolean
  escalateHint: boolean
}

export function getScaffolding(request: ScaffoldingRequest): ScaffoldingResponse {
  const { topic, concept, studentAnswer, studentModel } = request

  const hintLevel = determineHintLevel(studentModel, concept)
  const hint = generateHint(hintLevel, topic, concept, studentAnswer)
  const technique = getTechniqueName(hintLevel)
  const nextAction = determineNextAction(hintLevel, studentAnswer)
  const shouldRetry = hintLevel < 5 && !isFullyExplained(studentAnswer)
  const escalateHint = hintLevel >= 3 && !studentAnswer

  return {
    hintLevel,
    hint,
    technique,
    nextAction,
    shouldRetry,
    escalateHint,
  }
}

export function determineHintLevel(
  studentModel?: StudentModel,
  concept?: string,
): HintLevel {
  if (!studentModel || !concept) return 1

  const node = studentModel.knowledge[concept]
  if (!node) return 1

  if (node.confidence >= 80) return 1
  if (node.confidence >= 60) return 2
  if (node.confidence >= 40) return 3
  if (node.confidence >= 20) return 4
  return 5
}

function generateHint(
  level: HintLevel,
  topic: string,
  concept?: string,
  studentAnswer?: string,
): string {
  const target = concept || topic

  switch (level) {
    case 1:
      return generateQuestionHint(target)
    case 2:
      return generateNudgeHint(target, studentAnswer)
    case 3:
      return generateAnalogyHint(target, studentAnswer)
    case 4:
      return generatePseudocodeHint(target, studentAnswer)
    case 5:
      return generateSolutionHint(target, studentAnswer)
  }
}

function generateQuestionHint(concept: string): string {
  return `Good question! Before I explain directly, let me help you discover the answer:

What do you think happens when you use ${concept}? Take a guess — there are no wrong answers here.

Think about:
- What is ${concept} supposed to do?
- Where would you use it in your code?
- What would the output or behavior look like?`
}

function generateNudgeHint(concept: string, studentAnswer?: string): string {
  if (studentAnswer) {
    return `You're on the right track! Let me nudge you a bit further.

You said: "${studentAnswer}"

That's partially correct. Here's the nudge: think about what ${concept} actually does *under the hood*. 

For example, try running a small snippet in your head or in a playground. What happens step by step?`
  }

  return `Here's a small nudge to get you thinking:

${concept} is related to how your code handles certain operations. Think about it like a recipe — what ingredients (inputs) go in, and what comes out (output)?

Try writing a simple example with just 2-3 lines and see what happens.`
}

function generateAnalogyHint(concept: string, studentAnswer?: string): string {
  return `Let me try an analogy:

Think of ${concept} like a **restaurant kitchen**:

- The **chef** is your code/program
- The **ingredients** are your data/inputs
- The **recipe** is the logic you write
- The **finished dish** is the output

Now, when you use ${concept}, what part of the kitchen is it? Is it the chef taking action, a specific recipe step, or maybe how ingredients are organized?

This mental model should help you understand the role ${concept} plays.`
}

function generatePseudocodeHint(concept: string, studentAnswer?: string): string {
  const lines: string[] = []
  lines.push(`Let me show you the structure without revealing the full answer:`)
  lines.push("")
  lines.push("```pseudocode")
  lines.push(`// ${concept} - what would go in each step?`)
  lines.push("function example(input) {")
  lines.push("  // Step 1: What do you do first?")
  lines.push("  // Step 2: What transformation happens?")
  lines.push("  // Step 3: What do you return?")
  lines.push("}")
  lines.push("```")
  lines.push("")
  lines.push("Fill in the blanks mentally. What logic goes in each step?")
  if (studentAnswer) {
    lines.push("")
    lines.push(`Your previous answer: "${studentAnswer}"`)
    lines.push("Try mapping that to these steps. Does it fit?")
  }
  return lines.join("\n")
}

function generateSolutionHint(concept: string, studentAnswer?: string): string {
  const lines: string[] = []
  lines.push(`Since you've been struggling, here's the explanation with a working example:`)
  lines.push("")
  lines.push(`**${concept}:**`)
  lines.push("")
  lines.push("The key idea is that you need to:")
  lines.push("1. Take the input data")
  lines.push("2. Apply the correct transformation")
  lines.push("3. Handle edge cases (empty input, wrong type)")
  lines.push("4. Return the expected output")
  lines.push("")
  lines.push("Here's a minimal working version you can study:")
  lines.push("```typescript")
  lines.push(`// ${concept} implementation`)
  lines.push("// Study this, then try to modify it yourself")
  lines.push("// Focus on understanding WHY each line exists")
  lines.push("```")
  lines.push("")
  lines.push("**Important:** Don't just memorize this. Try to understand each line. Then close this and write it from memory.")
  return lines.join("\n")
}

function getTechniqueName(level: HintLevel): string {
  const techniques: Record<HintLevel, string> = {
    1: "Socratic Questioning",
    2: "Guided Nudge",
    3: "Analogy Bridge",
    4: "Pseudocode Scaffolding",
    5: "Solution with Explanation",
  }
  return techniques[level]
}

function determineNextAction(level: HintLevel, studentAnswer?: string): string {
  if (!studentAnswer) return "ask-for-answer"
  if (level <= 2) return "evaluate-answer"
  if (level <= 4) return "guided-practice"
  return "explain-then-practice"
}

function isFullyExplained(studentAnswer?: string): boolean {
  if (!studentAnswer) return false
  const lower = studentAnswer.toLowerCase()
  return /understand|got it|makes sense|clear|ok/.test(lower) &&
    !/still|confused|don't|not/.test(lower)
}

export function shouldEscalateHint(
  currentLevel: HintLevel,
  attempts: number,
  lastCorrect: boolean,
): HintLevel {
  if (lastCorrect) return (Math.max(1, currentLevel - 1) as HintLevel)
  if (attempts >= 2 && currentLevel < 5) return ((currentLevel + 1) as HintLevel)
  return currentLevel
}

export function buildScaffoldingPrompt(
  topic: string,
  hintLevel: HintLevel,
  studentAnswer?: string,
): string {
  const techniques: Record<HintLevel, string> = {
    1: "Ask a guiding question to help them discover the answer.",
    2: "Give a small nudge without revealing the full answer.",
    3: "Use an analogy to bridge from something they know.",
    4: "Show the pseudocode structure and have them fill in the blanks.",
    5: "Explain the concept fully, then have them practice.",
  }

  const lines: string[] = []
  lines.push(`**Scaffolding for: ${topic}**`)
  lines.push(`Hint level: ${hintLevel}/5`)
  lines.push(`Technique: ${techniques[hintLevel]}`)
  lines.push("")
  lines.push("Rules:")
  lines.push("- Keep explanations brief and focused on the current concept.")
  lines.push("- After each hint, ask the student to try again or explain their understanding.")
  lines.push("- If the student gives a correct answer, congratulate and move to the next concept.")
  lines.push("- Never skip levels — always go step by step.")
  lines.push("- Always end with a question or challenge to check understanding.")
  if (studentAnswer) {
    lines.push("")
    lines.push(`Student's previous answer: "${studentAnswer}"`)
    lines.push("Acknowledge what they got right, then guide further.")
  }
  return lines.join("\n")
}
