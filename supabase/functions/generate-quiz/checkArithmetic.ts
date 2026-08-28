// Deterministic sanity check for arithmetic answers (CLAUDE.md §26: an
// HTTP 200 from the model is not proof the quiz is correct). The model
// occasionally states a wrong result for an otherwise well-formed
// calculation question. A teacher reviews every quiz, but an arithmetically
// wrong answer reaching that review is exactly the kind of thing that makes
// a teacher stop trusting the tool.
//
// This is intentionally narrow: it only fires when it can extract ONE
// unambiguous "a op b" calculation from the question and read the stated
// answer as a clean number. Anything fuzzier (word problems, multi-step
// expressions, ranges) is left untouched so a correct question is never
// dropped by a bad guess. It runs only for mathematics quizzes.
import type { QuizData } from '../../../shared/domain/quiz.ts';

const OPERATORS: Record<string, (a: number, b: number) => number> = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '−': (a, b) => a - b, // − minus sign
  '*': (a, b) => a * b,
  '×': (a, b) => a * b, // × multiplication sign
  '÷': (a, b) => a / b, // ÷ division sign
};

// Numbers may carry space thousands separators ("1 000") and a comma
// decimal ("2,5"); nothing else.
function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

// The unicode operators (× ÷ −) are safe to match anywhere. The ASCII ones
// (+ - *) are only matched when surrounded by spaces, so a hyphenated word
// or a bare minus on a number is not read as an operation.
const EXPRESSION_RE =
  /(\d[\d\s]*\d|\d)\s*([×÷−])\s*(\d[\d\s]*\d|\d)|(\d[\d\s]*\d|\d) ([+\-*]) (\d[\d\s]*\d|\d)/g;

type Expr = { a: number; op: string; b: number };

function extractSingleExpression(text: string): Expr | null {
  const found: Expr[] = [];
  for (const m of text.matchAll(EXPRESSION_RE)) {
    const aRaw = m[1] ?? m[4];
    const opRaw = m[2] ?? m[5];
    const bRaw = m[3] ?? m[6];
    const a = parseNumber(aRaw);
    const b = parseNumber(bRaw);
    if (a === null || b === null || !(opRaw in OPERATORS)) continue;
    found.push({ a, op: opRaw, b });
  }
  return found.length === 1 ? found[0] : null;
}

// Returns true when the question contains a single clear calculation whose
// stated answer is demonstrably wrong. Returns false whenever anything is
// ambiguous — a false here must be a real error, not a parsing artefact.
export function hasWrongArithmeticAnswer(questionText: string, statedAnswer: string): boolean {
  const expr = extractSingleExpression(questionText);
  if (!expr) return false;

  const stated = parseNumber(statedAnswer);
  if (stated === null) return false;

  const computed = OPERATORS[expr.op](expr.a, expr.b);
  // Division that does not come out whole is almost certainly a misparse of
  // an elementary question, not a real error — stay out of it.
  if (expr.op === '÷' && !Number.isInteger(computed)) return false;

  return Math.abs(computed - stated) > 1e-9;
}

// Drops every question whose arithmetic is provably wrong and returns a
// single teacher-facing French warning when any were removed. Only the
// question text + stated answer are checked; multiple-choice distractors
// are not (a wrong distractor is fine by design).
export function stripWrongArithmetic(quiz: QuizData): QuizData {
  if (quiz.subject !== 'mathematiques') return quiz;

  const kept = quiz.questions.filter((q) => {
    // Only multiple_choice / gap_fill carry a single stated numeric answer to
    // sanity-check; true_false and matching don't.
    if (q.type !== 'multiple_choice' && q.type !== 'gap_fill') return true;
    return !hasWrongArithmeticAnswer(q.question, q.correctAnswer);
  });

  if (kept.length === quiz.questions.length) return quiz;

  return {
    ...quiz,
    questions: kept,
    warnings: [
      ...quiz.warnings,
      'Une ou plusieurs questions comportaient un calcul faux et ont été retirées. Vérifiez le devoir avant de le publier.',
    ],
  };
}
