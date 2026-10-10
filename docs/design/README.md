# Futur Génie — Visual redesign (production v1)

Approved by the project owner on 2026-10-10. This folder is the **visual source of truth** for the redesign milestone. It changes how the app *looks*, never what it *does*.

## 1. How to read the mockups

`mockups/*.dc.html` are HTML mockups exported from a design canvas, one file per screen (390 px wide = iPhone).

- **Inline `style="…"` values are the spec**: colors, sizes, radii, spacing, shadows. Translate them to React Native `StyleSheet`.
- Ignore the canvas mechanics: `<x-dc>`, `<helmet>`, `<sc-for>`, `<sc-if>`, `{{…}}` holes, `support.js`, the `<script type="text/x-dc">` block. In that script, `renderVals()` only holds **sample content** (fake names, titles, scores) — never hard-code it.
- `<img src="/_blob/f471c8dad58ca739e9bd4d7c8ddbf38a">` is the app logo → `assets/images/logo-source.png` (existing `Logo` component).
- `href="Xxx.dc.html"` links only connect mockups to each other; they say which screen a button leads to, which already matches the current routes.
- The large blurred circles ("halos") at the top of each mockup are decorative background — see §3.3.
- Mockups cannot be opened as the canvas here; if something is ambiguous, ask the owner for a screenshot of the canvas rather than guessing.

## 2. Screen map

| Mockup | Route / file | Notes |
|---|---|---|
| `Accueil.dc.html` | `src/app/(app)/(tabs)/index.tsx` | Date line, 2-line greeting, count in a glass pill, gradient primary button, glass secondary button, new "Derniers devoirs" (3 most recent quizzes, RLS-scoped, same table as the existing count) |
| `Connexion.dc.html` | `src/app/(auth)/sign-in.tsx` | Error shown as inline banner (existing `error` state) |
| `Inscription.dc.html` | `src/app/(auth)/sign-up.tsx` | Field error under "Confirmer" |
| `VerifMail.dc.html` | `sign-up.tsx` (`needsEmailConfirmation` branch) | |
| `Bienvenue.dc.html` | `src/app/(app)/onboarding.tsx` + `TeacherDetailsForm` | Focus state of an input shown on "Nom de l'école" |
| `Confidentialite.dc.html` | `src/app/privacy.tsx` | Same text as today, sections as numbered cards. Do NOT change the legal wording |
| `MesDevoirs.dc.html` | `(tabs)/my-quizzes.tsx` | Rows now show subject badge + grade + question count (add `grade, subject, quiz_data` or a count to the existing select — owner approved). Draft rows keep the "Brouillon" status, not tappable |
| `MesDevoirsSelection.dc.html` | `my-quizzes.tsx` (select mode) | Dark floating selection bar above the tab bar |
| `PartagerPlusieurs.dc.html` | `ShareComposeModal` in `my-quizzes.tsx` | Stays a RN `Modal` (sheet look), not an alert |
| `Suggestions.dc.html` / `SuggestionsMerci.dc.html` | `(tabs)/suggestions.tsx` | |
| `Profil.dc.html` | `(tabs)/profile.tsx` | Header card (initials, name, email). Sign-out / delete / privacy grouped in one list card |
| `CreerDevoir.dc.html` | `src/app/(app)/create.tsx` | NEW "Étape 1 sur 3" indicator (approved). Sticky "Continuer" |
| `PhotoChoix.dc.html` | `create-photo.tsx` (no photo) | "Étape 2 sur 3", recap pills, framing illustration, 3 tips |
| `PhotoApercu.dc.html` | `create-photo.tsx` (photo chosen) | Primary label "Créer le devoir" |
| `Generation.dc.html` | `create-photo.tsx` (`isGenerating`) | Full-screen progress state using the 3 existing step labels. No percentage (CLAUDE.md §38) |
| `Relecture.dc.html` | `quiz-draft.tsx` | "Étape 3 sur 3". Lesson-mode info banner + warnings banner. Per-type question cards. Sticky "Publier le devoir" |
| `DevoirPublie.dc.html` | `quiz-published.tsx` | Copy feedback shown as green "Lien copié" state |
| `Reponses.dc.html` | `quiz-results.tsx` | Teacher-only. "N élèves ont fait ce devoir" = length of the rows already loaded (no new query, no RLS change). Keep the existing sort (lowest score first). Neutral styling for every row — no red, no "à revoir" label |
| `EleveAccueil.dc.html` | `src/app/q/[slug].tsx` (not started) | Button "C'est parti !" |
| `EleveQuestions.dc.html` | `q/[slug].tsx` (answering) | NEW progress bar "x / n répondues" (approved, computed locally). Hint under the disabled submit button |
| `EleveResultat.dc.html` | `q/[slug].tsx` (submitted) | Positive tone: wrong pick = soft orange + "Ton choix", message "Presque ! La bonne réponse est en vert." Correct = green + check icon |
| `Fenetres.dc.html` | every `Alert.alert` call | **Reference only** — see §4 |
| `Etats.dc.html` | loading / empty / error branches of each screen | One shared centered empty-state layout |

Not designed on purpose (system UI): native share sheet, camera, photo picker, permission prompts.

## 3. Visual system

Centralize everything below in `src/theme/` (colors, gradients, typography, radii, shadows) and update the comment in `src/theme/colors.ts` accordingly — it is now the app-wide theme. No hex literals in screens.

### 3.1 Colors

| Token | Value | Use |
|---|---|---|
| `background` | `#F5F6FD` | Screen background |
| `text` | `#141A46` | Primary text (navy, replaces black) |
| `textSecondary` | `#555B80` | Secondary text, labels |
| `textMuted` | `#7A80A3` | Chevrons, placeholders |
| `brandBlue` | `#3B4CF0` | Gradient start |
| `brandViolet` | `#7B2FE0` | Gradient middle |
| `brandMagenta` | `#C0267F` | Gradient end |
| `brandRaspberry` | `#D9286E` | Primary button start |
| `actionText` | `#3140D6` | Secondary buttons, back button, text actions |
| `link` | `#B8205F` | Inline links ("Tout voir", "Créer un compte") |
| `border` | `#DCE0F2` | Inputs, unselected chips |
| `surfaceGlass` | `rgba(255,255,255,0.72)` + border `rgba(255,255,255,0.95)` | Cards ("glass") |
| `success` | bg `#E5F5EC`, border `#2E9E5B`, text `#1C6B40` | Correct answer, "Publié", saved |
| `danger` | bg `#FDECEC`, text `#A3251F`, solid `#C2362F` | Errors, delete |
| `warning` | bg `#FFF4E5`/`#FFF7EC`, border `#E3A15A`, text `#8A4413`/`#9A5A12` | AI warnings, student "Presque !" |
| `info` | bg `rgba(59,76,240,0.08)`, text `#2A3290` | Hints, lesson mode |
| Subject tints | `#E3E7FF`/`#3140D6`, `#FBE1EE`/`#8E1648`, `#EFE4FF`/`#5A21A8`, `#FFEBDD`/`#8A4413` | Badges/pills (bg/text) |

### 3.2 Gradients (`expo-linear-gradient`, already installed)

- **Hero** (home card, published card, profile header, student cards): 135°, `#3B4CF0` 0% → `#7B2FE0` 52% → `#C0267F` 100%.
- **Primary button**: 90°, `#D9286E` → `#8B2FE0`, white text 17/600, shadow `rgba(217,40,110,0.28)` y12 blur26.
- **Selected chip / active tab / step bar**: 90°, `#3B4CF0` → `#7B2FE0`, white text.

### 3.3 Background halos

Do **not** use a blur library or runtime blur filters. Render the halos as **one static, lightweight background image** (generated once, e.g. PNG/WebP ≤ ~100 KB) placed in the shared `Screen` component, behind content. Colors: blue `#5B6CFF` top-left, pink `#F0458A` right, orange `#FFA05C` bottom, ~25–40 % opacity, very soft. Must look fine on iOS, Android and web.

### 3.4 Typography

- Headings: **Bricolage Grotesque** 800 (titles 28–32 px, letter-spacing −0.02em), 600 for section titles (17–18 px).
- Body/UI: **DM Sans** 400/500/600 (15–17 px; 13 px for meta).
- Load with `expo-font` (already installed) + `@expo-google-fonts/bricolage-grotesque` and `@expo-google-fonts/dm-sans` (JS-only packages, approved). Keep the splash screen visible until fonts are loaded (same pattern as the session restore).

### 3.5 Shapes & spacing

- Screen padding 22 px; top content starts below the safe area.
- Radii: inputs 16, chips 22 (pill), buttons 20, cards 22–26, hero cards 30, tab bar 28.
- Heights: inputs 52, chips 44, primary button 56–58 (student 62), secondary 52–56, list rows ≥ 60.
- Touch targets ≥ 44 px everywhere.

### 3.6 Shared components to build (only those actually used)

`PrimaryButton`, `SecondaryButton` (glass), `BackButton` (pill "‹ Retour"), `Chip` (restyle existing `OptionChips`), `TextField`, `GlassCard`, `HeroCard`, `Banner` (info / warning / error / success, always with an icon — never color alone), `StepIndicator` (3 segments + "Étape x sur 3"), `EmptyState` (icon, title, text, optional action), floating `TabBar`.

### 3.7 Floating tab bar

Custom `tabBar` for `(tabs)/_layout.tsx`: capsule 68 px high, 16 px from the screen edges and bottom (respect safe-area inset), white 78 % + white border + soft shadow. Active tab = gradient pill with icon + label; inactive = icon only **with `accessibilityLabel`**. Add bottom padding to scrollable content so nothing hides behind it.

## 4. Alerts: keep the system ones

All 8 `Alert.alert` calls stay **native iOS/Android alerts**. No custom dialog component. `Fenetres.dc.html` only fixes the wording and button order:

| Where | Title | Buttons (in order) |
|---|---|---|
| create-photo, image error | Photo indisponible | OK |
| create-photo, generation error | Devoir non créé | Reprendre la photo (only for retake errors), Réessayer |
| create-photo, permission blocked | Autorisation nécessaire | Ouvrir les réglages, Annuler |
| quiz-draft, add | Ajouter une question | Choix multiple, Vrai ou Faux, Texte à trous, Annuler |
| quiz-draft, delete | Supprimer cette question ? | Supprimer (`destructive`), Annuler |
| quiz-draft, publish check | Devoir incomplet | OK |
| suggestions, send error | Message non envoyé | Réessayer |
| profile, delete account | Supprimer votre compte ? | Supprimer mon compte (`destructive`), Annuler |

Messages are the existing ones in code — keep them.

## 5. Rules for this milestone

1. **Look, not behavior.** Same flows, same data, same validations, same navigation. No database, RLS, Edge Function or AI change.
2. **Public quiz link = example.** `[VOTRE-DOMAINE]/q/K7fP3xQa` in the mockups is placeholder text. Do NOT touch `publicQuizUrl.ts` or `EXPO_PUBLIC_APP_URL`; display whatever the code already builds. (Future domain will probably be `quiz.futurgenie.fr` — not set up yet.)
3. **Positive tone.** No comparison to an average, no negative labels, anywhere. Teacher results: neutral rows. Student correction: encouraging wording, no red for a wrong answer.
4. **No new native dependency.** No `expo-blur`. Only the two font packages above.
5. **Accessibility**: text contrast ≥ 4.5:1 (navy on light, white on gradients), labels on icon-only buttons, states never conveyed by color alone.
6. **Approved additions** (small, visual): step indicator in the creation flow, student progress bar, subject/grade/count on "Mes devoirs" rows, "Derniers devoirs" on the home screen, "N élèves ont fait ce devoir" line, sticky bottom buttons, copy tweaks visible in the mockups ("Créer le devoir", "C'est parti !", "Bien joué [prénom] !", "Presque !…").
7. **Student page stays light** (web): same brand, no heavy assets beyond the logo and the halo image.

## 6. Suggested order

1. Theme + fonts + `Screen` background + shared components + tab bar → **Accueil**. Stop, owner checks on device.
2. Creation flow: CreerDevoir → PhotoChoix/Aperçu → Generation → Relecture → DevoirPublie.
3. Mes devoirs (+ selection + share modal) → Réponses.
4. Profil, Suggestions, Bienvenue, Connexion/Inscription, Confidentialité.
5. Student page (q/[slug]) — all three states.
6. Loading/empty/error states pass + alert wording check.

After each step: TypeScript + lint + tests pass, then the owner sends a phone screenshot to compare with the mockup. Never claim a visual check that didn't happen.
