// Per-grade calibration notes injected into the generation prompt so the
// model has a concrete reference for what "the right level" means at each
// French elementary grade, instead of guessing from the grade label alone
// (see PROGRESS.md — "Fiabilisation des quizs", Phase 2). One card per
// grade, all subjects together; subject-specific cards can be added later
// only where these prove insufficient (likely maths and français first).
//
// Distilled by hand from the French Ministry of Education's public
// "Repères annuels de progression" and "Attendus de fin d'année" (CP–CM2),
// https://eduscol.education.fr/137/ — Licence Ouverte / Etalab (reuse,
// including commercial, with attribution). These are calibration guides,
// not content rules: the photographed lesson and the SYSTEM_PROMPT rules
// still govern what a question may contain. Treat any change here as a
// product change (CLAUDE.md §25) and re-check the evaluation set.
import type { Grade } from '../../../shared/domain/grade.ts';

export const GRADE_CALIBRATION: Record<Grade, string> = {
  CP: `CP — end of year, ~6 years old. Beginning reader: decodes short words and simple sentences, understands a short sentence read on its own.
Language: very short questions (5–8 words), only concrete everyday vocabulary, one idea per question.
Reasoning: identify or recall ONE fact or word explicitly present in the lesson; match; or apply a rule to a single very easy case. No multi-step reasoning, no "why", no comparison.
Maths anchors: whole numbers up to 100. Add/subtract small numbers with results usually ≤ 20 ("8 + 6", "15 − 4"), or add/subtract whole tens ("30 + 40"). Doubles up to ~10, complements to 10. NOT at this level: posed/column operations, any multiplication or division, carrying-heavy sums.
Français anchors: recognise a sound, a letter, a word; singular vs plural shown by a visible "s"; the meaning of a word the lesson gives. No real conjugation work beyond recognising very common verbs in the present.
Too easy for CP: pointing at a picture with nothing to read; "recopie ce mot". Right level: "Dans la phrase, quel mot veut dire « content » ?" · "Combien font 8 + 6 ?"`,

  CE1: `CE1 — end of year, ~7 years old. Reads a short text and understands it; begins to justify a simple choice.
Language: short questions (up to ~10 words), common vocabulary, at most one lesson term if the page defines it.
Reasoning: recall a fact from the lesson AND apply one simple rule from the lesson to a case as simple as those shown. Single step. A cause only if the text states it.
Maths anchors: whole numbers up to 1000. Addition and subtraction including with carrying, mentally or in line ("47 + 36", "83 − 27", "250 + 300"). Multiplication tables of 2, 3, 4, 5, 10; multiplication understood as repeated addition. Beginning posed addition/subtraction. NOT yet: posed multiplication, any division algorithm.
Français anchors: present tense of être, avoir, aller and 1st-group verbs; gender and number agreement inside the noun group; past / present / future distinction; simple sentence vs question.
Too easy for CE1: recognising one isolated word; "12 + 3". Right level: "La leçon dit que la glace fond à la chaleur. Que devient un glaçon oublié au soleil ?" · "Combien font 47 + 36 ?"`,

  CE2: `CE2 — end of year, ~8 years old. Reads and understands a full lesson page; can link two pieces of information from it.
Language: questions up to ~12 words, lesson vocabulary allowed, a two-clause question is fine.
Reasoning: apply a taught rule or method to a clearly NEW case that is not printed on the page, OR connect two facts from the lesson. One or two steps.
Maths anchors: whole numbers ≤ 10 000. Mental / in-line addition and subtraction with carrying ("347 + 8", "4 130 − 26", "2 748 − 239"); posed addition, posed subtraction, and posed multiplication of a 2–3 digit number by a 1–2 digit number ("348 + 276", "127 × 4"); multiplication tables 2–9; doubles and halves of usual numbers; euclidean division by a 1-digit number ("92 ÷ 9 → 10 reste 2"); complements to 100 and to 1000. NOT at this level: decimal numbers, fractions, operations on numbers above 10 000.
Français anchors: present, imperfect, simple future and passé composé of common verbs; the four sentence types; subject–verb agreement; frequent homophones (a/à, et/est, son/sont, on/ont).
Too easy for CE2: "recopie le mot souligné"; "12 + 5". Right level: "La règle : avec « nous » le verbe se termine par -ons. Conjugue « manger » avec « nous »." · "Pose et calcule 348 + 276."`,

  CM1: `CM1 — end of year, ~9 years old. Reads longer texts, separates the main idea from a detail, explains reasoning in a sentence.
Language: full sentences, subject vocabulary expected, a question may carry a condition or a comparison.
Reasoning: combine two or more elements of the lesson — cause and effect, comparison, classification, a short justified "why"; or apply a rule to a harder case than those shown. Two steps.
Maths anchors: whole numbers to the millions; first work on decimal numbers (tenths, hundredths) and simple fractions (1/2, 1/4, 3/4) in sharing and measuring; the four operations, including posed multiplication by a 2-digit number and posed division by a 1-digit number; multiples, even/odd; perimeter, area by counting units, right angles; simple proportionality (×2, ×10).
Français anchors: passé composé mastered; simple vs compound tenses distinguished; a past event seen as earlier than the present; grammatical function (subject, verb, complement); more homophones (ce/se, ces/ses, la/là/l'a).
History / geography / sciences are now full subjects: expect chronology, cause and effect, reading a document (map, timeline, diagram).
Too easy for CM1: recalling a single date or a single word. Right level: "D'après le texte, donne deux raisons pour lesquelles les premières villes se sont installées près d'un fleuve."`,

  CM2: `CM2 — end of year, ~10 years old. Reads and analyses a text or a document, links several pieces of information, justifies an answer with evidence.
Language: complex sentences, precise subject vocabulary, a multi-part question is fine.
Reasoning: a short chain of reasoning across several elements of the lesson — compare, infer a consequence, distinguish a cause from a consequence, justify with a quote or fact from the text. Two to three steps.
Maths anchors: large whole numbers; read, compare, place and decompose decimal numbers; add and subtract decimals, multiply a decimal by a whole number; fractions with the same denominator (compare, add), fraction ↔ decimal; the four posed operations including division with a 2-digit divisor; proportionality (simple rule of three, percentages, scale); perimeter and area of a rectangle with the formulas, volume of a cube / pavé; angles measured with a protractor.
Français anchors: all tenses studied, including plus-que-parfait and recognition of passé simple and conditionnel présent; agreement of the past participle with être; relative clauses; analysing a text or a genre.
History / geography / sciences: interpret a document, build a short argument, place events on a long timeline, understand a system (water cycle, food chain).
Too easy for CM2: "Quelle est la date de … ?". Right level: "Le texte cite deux conséquences de la révolution industrielle. Cite-les, puis explique celle qui change le plus la vie quotidienne."`,
};
