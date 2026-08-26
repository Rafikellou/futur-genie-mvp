# État d'avancement — Futur Génie MVP

> Ce fichier est la source de vérité sur l'avancement du projet, à lire en
> priorité en début de toute nouvelle conversation, avec `CLAUDE.md`. Il est
> mis à jour à la fin de chaque milestone.

## Comment reprendre le travail dans une nouvelle conversation

1. Lire `CLAUDE.md` (règles produit/techniques) et ce fichier (état actuel).
2. Vérifier l'état réel du repo (`git log`, `git status`) — ce fichier peut
   avoir un temps de retard sur un travail fait manuellement entre deux
   sessions.
3. Reprendre au milestone marqué "en cours", ou celui indiqué par
   l'utilisateur.

## Milestones

| # | Nom | Statut |
|---|---|---|
| 1 | Fondations (Expo + TS + Router + client Supabase) | ✅ Terminé et vérifié sur iPhone (Expo Go) |
| 2 | Authentification enseignant | ✅ Terminé et vérifié sur appareil |
| 3 | Création d'exercice (sans IA) | ✅ Terminé — vérifié sur appareil |
| 4 | Photo de leçon | ✅ Terminé — vérifié sur appareil (iPhone) |
| 5 | Génération IA | ✅ Terminé — vérifié sur appareil (iPhone) ; prompt affiné après retour utilisateur |
| 6 | Revue et édition | ✅ Terminé — non encore vérifié sur appareil |
| 7 | Publication et URL publique | ✅ Terminé — backend vérifié en conditions réelles, non encore vérifié sur appareil |
| 8 | Expérience élève | À venir |
| 9 | Partage et historique | À venir |
| 10 | Durcissement et lancement | À venir |

Détail du contenu de chaque milestone : voir la planification validée en
conversation (reprise fidèlement de `CLAUDE.md` §15 et du skill
`product-architect`).

## Décisions techniques prises (valables pour tout le projet)

- **Gestionnaire de paquets** : npm.
- **Structure** : Expo à la racine (`src/app`, convention par défaut de
  l'outillage Expo actuel) + `shared/` (code partagé app ↔ Edge Functions :
  constantes de domaine, schémas Zod, client Supabase) + `supabase/`
  (migrations + Edge Functions).
- **Auth** : Supabase Auth, email + mot de passe.
- **LLM** : OpenAI, `GPT-4o-mini` par défaut (`GPT-4o` en repli si qualité
  insuffisante), derrière une fonction `generateQuizFromLesson()`.
- **Image de leçon** : compressée côté client, envoyée en base64 à l'Edge
  Function, jamais stockée (ni Storage ni disque).
- **Publication** : RPC Postgres `publish_quiz` (pas d'Edge Function —
  aucun secret nécessaire).
- **Lecture publique** : vue Postgres `public_quizzes` + RLS, lue
  directement par le client (pas d'Edge Function).
- **`source_evidence`** : jamais exposé publiquement ; une colonne
  `public_quiz_data` (sans cette clé) est générée au moment du `publish`.
- **Correction élève** : QCM / Vrai-Faux auto-corrigés ; réponse courte
  affiche la réponse attendue pour auto-correction (pas de matching flou).
  Point de sécurité connu et accepté : la réponse correcte est présente
  dans le payload public, seulement masquée côté UI avant soumission.
- **État/données** : hooks React + appels Supabase directs, pas de
  Redux/React Query.
- **Tests** : Jest + RNTL pour le domaine/schémas, Deno test pour la
  logique d'Edge Function, parcours doré vérifié manuellement à chaque
  milestone.

## Configuration d'environnement

- Projet Supabase : région UE, ref `otrtxtkghhnxmmfqgvdr`.
  URL et clé publique dans `.env` local (non commité, voir `.env.example`).
- CLI Supabase installé en devDependency. Lié en local via
  `supabase login` + `supabase link` — voir `supabase/README.md`. Ces
  commandes sont à relancer par l'utilisateur sur toute nouvelle machine
  (jamais de token/mot de passe collé dans le chat).
- Clé API OpenAI : configurée en secret Supabase (`OPENAI_API_KEY`, jamais
  dans le repo) ; la fonction `generate-quiz` est déployée.
- Dépôt GitHub : https://github.com/Rafikellou/futur-genie-mvp (remote
  `origin`, branche `main`).

## Milestone 2 — Authentification enseignant (détail)

Implémenté :

- Table `profiles` (migration `20260825193812_create_profiles.sql`), créée
  automatiquement par un trigger sur `auth.users` — l'app n'orchestre jamais
  la création du profil elle-même. RLS : un enseignant ne peut lire/modifier
  que sa propre ligne. Migration poussée sur le projet distant
  (`npx supabase db push`).
- `AuthProvider` (`src/features/auth/AuthProvider.tsx`) : session Supabase +
  profil, exposés via `useAuth()`. Erreurs Supabase traduites en français
  (`authErrors.ts`), jamais affichées brutes.
- Routes protégées via `Stack.Protected` (mécanisme officiel d'Expo Router,
  disponible dans la version installée) dans `src/app/_layout.tsx` : groupe
  `(auth)` (`sign-in`, `sign-up`) si pas de session, groupe `(app)` (`index`,
  `profile`) si session active. Pas de logique de redirection manuelle à
  maintenir.
- Écran de profil minimal : nom affiché modifiable, e-mail en lecture seule,
  déconnexion.

Décision notable :

- L'inscription gère les deux cas Supabase (confirmation e-mail activée ou
  non) : si aucune session n'est retournée après `signUp`, l'écran affiche
  "Vérifiez votre boîte mail" au lieu de supposer une connexion immédiate.

Bug corrigé au passage (Milestone 1, découvert en testant le rendu web) :

- Le client Supabase (`shared/supabase/client.ts`) forçait `AsyncStorage`
  même sur web, ce qui fait planter le rendu statique d'Expo Router
  (`window is not defined` côté serveur au moment de l'export). Le storage
  `AsyncStorage` n'est maintenant utilisé que sur iOS/Android ; sur web,
  supabase-js retombe sur son propre comportement (localStorage dans le
  navigateur, mémoire pendant le rendu serveur).

Vérifié :

- TypeScript (`npx tsc --noEmit`) : OK.
- Lint (`npm run lint`) : OK.
- `npx expo export --platform web` : les 5 routes s'exportent sans erreur.
- Migration appliquée avec succès sur le projet Supabase distant.

Vérifié manuellement sur appareil : créer un compte, se déconnecter, se
reconnecter, modifier le nom affiché.

Non vérifié :

- Comportement réel de la confirmation e-mail (dépend du réglage "Confirm
  email" du projet Supabase, non modifié ici).

## Milestone 3 — Création d'exercice, sans IA (détail)

Implémenté :

- Domaine centralisé (`shared/domain/grade.ts`, `subject.ts`,
  `exercise.ts`) : niveaux (CP→CM2), matières (§18), types d'exercice
  (QCM / Vrai-Faux / Réponse courte / Mixte) et nombres de questions
  proposés (5 / 10 / 15, défaut 10). Un seul endroit à modifier si ces
  listes évoluent.
- Écran `src/app/(app)/create.tsx` : formulaire à un seul écran (pas
  d'assistant multi-étapes) avec quatre rangées de choix (composant
  générique réutilisable `OptionChips`). Bouton "Continuer" désactivé tant
  que les quatre choix ne sont pas faits. État local uniquement (pas de
  contexte global, pas de brouillon en base — prématuré avant la
  génération IA du Milestone 5).
- Écran `src/app/(app)/create-photo.tsx` : écran temporaire qui affiche le
  récapitulatif des choix (reçus via les paramètres de route) et annonce
  que la photo arrive au prochain jalon. Il garde le parcours navigable de
  bout en bout sans construire la caméra en avance.
- Accueil (`index.tsx`) : le texte de remplacement est remplacé par un
  bouton principal "Créer un devoir".

Décision notable :

- Fichiers de routes à plat (`create.tsx`, `create-photo.tsx`) plutôt
  qu'un dossier `create/` avec `index.tsx` + `photo.tsx` : la génération
  des routes typées d'Expo Router perd l'alias `/create` pour un
  `create/index.tsx` ayant une route sœur dans le même dossier (bug/limite
  connue de cette version d'Expo Router). Le plat correspond aussi à la
  convention déjà utilisée par les autres écrans du projet.
- Aucun changement Supabase/base de données dans ce jalon : la
  persistance d'un brouillon n'a de sens qu'à partir du Milestone 5,
  quand l'IA produit du contenu à sauvegarder.

Vérifié :

- TypeScript (`npx tsc --noEmit`) : OK.
- Lint (`npm run lint`) : OK.
- `npx expo export --platform web` : les 8 routes (dont `/create` et
  `/create-photo`) s'exportent sans erreur.
- Parcours manuel sur appareil : ouvrir "Créer un devoir", choisir les
  quatre paramètres, "Continuer" désactivé tant qu'un choix manque, écran
  suivant affichant le bon récapitulatif.

## Milestone 4 — Photo de leçon (détail)

Implémenté :

- `src/app/(app)/create-photo.tsx` remplace son placeholder du Milestone 3
  par l'écran réel : "Prendre une photo" (caméra) ou "Choisir dans la
  bibliothèque" (`expo-image-picker`), aperçu de la photo une fois
  sélectionnée, boutons "Reprendre" / "Choisir une autre photo" pour la
  remplacer avant de continuer. Le récapitulatif niveau/matière/type/nombre
  de questions reste affiché.
- Permissions caméra et bibliothèque demandées séparément au moment de
  l'action (pas au chargement de l'écran). En cas de refus, message en
  français sans jargon : proposition de réessayer si le système peut encore
  redemander, sinon bouton "Ouvrir les réglages" (`Linking.openSettings()`)
  car iOS/Android ne réaffichent pas leur propre demande après un refus.
- `src/features/exercise-creation/lessonImage.ts` : compression côté
  client via `expo-image-manipulator` (nouvelle API contextuelle, pas
  `manipulateAsync` qui est dépréciée). Redimensionnement seulement si la
  photo dépasse 1600 px sur son plus grand côté, ré-encodage JPEG qualité
  0,7. Réduit une photo de téléphone typique (3000-4000 px) à quelques
  centaines de Ko tout en gardant le texte imprimé lisible, sans jamais
  agrandir une image déjà petite.
- Dépendances ajoutées via `npx expo install` (versions choisies par Expo
  pour SDK 54) : `expo-image-picker`, `expo-image-manipulator`. Plugin
  `expo-image-picker` déclaré dans `app.json` avec les textes de permission
  iOS/Android en français ; permission microphone explicitement désactivée
  (jamais de vidéo/live photo dans ce parcours).

Décision notable :

- Le bouton "Continuer" (une fois une photo prête) affiche pour l'instant
  un message "La création automatique du devoir arrive au prochain jalon"
  plutôt que de naviguer vers un écran de génération factice : la
  génération IA appartient au Milestone 5 et ne doit pas être anticipée
  (CLAUDE.md §60). La photo compressée reste en état local du composant ;
  aucun upload, appel IA ni brouillon en base — conformément au périmètre
  du jalon.
- Aucune image de leçon n'est stockée de façon permanente à cette étape
  (CLAUDE.md §31) : la photo compressée vit uniquement en mémoire/cache
  temporaire de l'appareil tant que l'écran est ouvert.

Vérifié :

- TypeScript (`npx tsc --noEmit`) : OK.
- Lint (`npm run lint`) : OK.
- `npx expo export --platform web` : les 14 routes (dont `/create-photo`)
  s'exportent sans erreur ; `expo-image-picker` et `expo-image-manipulator`
  ont un fallback web (fichier + canvas) et ne font pas planter le rendu
  statique.

Vérifié manuellement sur appareil (iPhone, Expo Go) : prendre une photo,
la remplacer par une nouvelle photo prise, choisir une photo depuis la
bibliothèque à la place.

Bug corrigé au passage : erreur Metro "Unable to resolve module
./validators" au premier lancement après l'ajout d'`expo-image-manipulator`
— cache du bundler périmé (le paquet venait d'être installé), résolu par
`npx expo start -c`. Pas un problème de code.

Non vérifié :

- Android physique.
- Refus de permission puis ouverture des réglages (chemin testable
  seulement après un refus explicite persistant).

## Milestone 5 — Génération IA (détail)

Implémenté :

- `shared/domain/quiz.ts` : schéma Zod du quiz généré — union discriminée
  `Question` (QCM / Vrai-Faux / Réponse courte), `QuizData` (titre,
  niveau, matière, type, instructions, questions, avertissements).
  `sourceEvidence` est portée par chaque question mais reste une donnée
  interne : aucun écran ne l'affiche.
- `shared/domain/generationErrors.ts` : codes d'erreur applicatifs stables
  (`unreadable_image`, `insufficient_content`, `model_timeout`,
  `model_unavailable`, `invalid_ai_output`, `unauthorized`,
  `invalid_request`, `unknown_error`) + messages français associés, pour
  que le backend et l'app ne divergent jamais sur ce vocabulaire.
- Edge Function `supabase/functions/generate-quiz/` : authentification JWT
  obligatoire (dérivée de la session, jamais d'identifiant fourni par le
  client) ; prompt séparé en règles pédagogiques invariantes (système) et
  paramètres du professeur (tâche, avec l'instruction optionnelle
  explicitement bornée pour ne jamais outrepasser les règles système) ;
  appel OpenAI `gpt-4o-mini` avec sortie structurée stricte (JSON Schema),
  repli automatique sur `gpt-4o` si la sortie ne se valide pas ; le modèle
  déclare lui-même si la photo est lisible/suffisante plutôt que le code
  ne le devine ; validation Zod complète avant renvoi ; aucune image ni
  quiz persisté (pas de table en base à ce jalon — la persistance arrive
  avec la publication au Milestone 7).
- `src/features/exercise-creation/generateQuiz.ts` : lit la photo
  compressée en base64 (`expo-file-system`), appelle la fonction, renvoie
  un résultat typé (`{ ok: true, quiz }` ou `{ ok: false, code }`) sans
  jamais laisser remonter d'exception à l'écran.
- `src/app/(app)/create-photo.tsx` : le bouton "Continuer" déclenche la
  génération réelle ; état de chargement avec libellés progressifs
  (« Lecture de la leçon… », etc.) ; soumissions multiples bloquées
  pendant la génération ; en cas d'erreur, message français avec action
  "Reprendre la photo" quand c'est pertinent (image illisible/contenu
  insuffisant), sinon "Réessayer".
- `src/app/(app)/quiz-draft.tsx` (nouveau) : aperçu du quiz généré en
  lecture seule (titre, récapitulatif, instructions, avertissements,
  questions avec la bonne réponse visible pour le professeur). Pas
  d'édition ni de publication — un message indique que la suite arrive au
  prochain jalon, comme pour `create-photo.tsx` au Milestone 4.

Décisions notables :

- `tsconfig.json` : `allowImportingTsExtensions` activé et
  `supabase/functions/**` exclu du typage de l'app. Nécessaire pour que
  `shared/domain/quiz.ts` soit importé tel quel à la fois par Metro (app)
  et par Deno (Edge Function, qui exige l'extension `.ts` sur les imports
  relatifs) — évite de dupliquer le schéma entre les deux côtés
  (CLAUDE.md §46), au prix d'imports internes à `shared/domain/` écrits
  avec leur extension explicite.
- Le format d'échange avec le modèle représente la réponse d'une question
  Vrai/Faux comme la chaîne `vrai`/`faux` plutôt qu'un booléen JSON :
  simplifie le schéma de sortie structuré (chaque champ garde un type
  unique), converti en `boolean` côté serveur avant validation finale.
- Une réponse du modèle qui se déclare lisible/suffisante mais ne contient
  aucune question est traitée comme `invalid_ai_output` plutôt que
  renvoyée telle quelle : mieux vaut un échec explicite qu'un devoir vide.
- Dépendances ajoutées : `zod` (app + Edge Function via un import map
  Deno dédié), `expo-file-system` (lecture base64 de la photo côté app).

Vérifié :

- TypeScript (`npx tsc --noEmit`) : OK.
- Lint (`npm run lint`) : OK.
- `npx expo export --platform web` : les 16 routes (dont `/quiz-draft`)
  s'exportent sans erreur.
- Relecture de sécurité : JWT dérivé de la session (jamais d'identifiant
  client), clé OpenAI jamais exposée côté client, `sourceEvidence` jamais
  rendue par l'UI, validation d'entrée (taille image, énumérations
  niveau/matière/type, nombre de questions limité aux presets), aucune
  fuite de détail technique dans les réponses d'erreur (seul un code
  stable est renvoyé).
- Secret `OPENAI_API_KEY` configuré et fonction déployée
  (`npx supabase functions deploy generate-quiz`). Vérifié sans clé
  enseignant valide : 401 côté gateway sans session, 401
  `{"error":{"code":"unauthorized"}}` avec un jeton non-enseignant — la
  fonction est bien joignable et sa vérification d'auth fonctionne.
- **Parcours complet sur appareil (iPhone) avec une vraie photo de
  leçon** : génération réelle via OpenAI, questions affichées sur l'écran
  d'aperçu. Confirmé par l'utilisateur.

Bug pédagogique corrigé au passage (repéré par l'utilisateur en test réel) :

- Sur une leçon de conjugaison, l'IA posait une question de pur rappel de
  l'exemple illustratif ("Quel est l'exemple donné avec 'tu' ?") au lieu
  de tester la compréhension de la règle générale qu'il illustrait.
  `prompt.ts` (`SYSTEM_PROMPT`) distingue maintenant explicitement : une
  leçon qui énonce une règle/méthode (conjugaison, orthographe, opération)
  doit être testée par application de la règle à un cas différent, pas
  par rappel mot pour mot de l'exemple donné — `sourceEvidence` doit alors
  pointer vers l'énoncé de la règle, pas vers l'exemple. Le rappel factuel
  reste inchangé pour les leçons purement factuelles (dates, sciences,
  vocabulaire), et la règle anti-hallucination (jamais inventer une règle
  non présente dans la leçon) reste intacte. Redéployé ; non re-testé sur
  appareil après ce changement (à confirmer par l'utilisateur au prochain
  test).

Non vérifié :

- Tests Deno de l'Edge Function
  (`supabase/functions/generate-quiz/generate-quiz.test.ts`) : écrits
  mais non exécutés, aucun runtime Deno disponible dans cet environnement
  de développement.
- Évaluation pédagogique systématique (jeu d'essai du skill
  `pedagogical-ai-engineer` — CP lecture, CE1 grammaire, CE2 maths, CM1
  histoire, CM2 sciences, page dense, page floue, etc.) : seul un cas réel
  (conjugaison CE2/CM1) a été testé jusqu'ici.

## Milestone 6 — Revue et édition (détail)

Implémenté :

- `src/app/(app)/quiz-draft.tsx` passe de lecture seule à éditable : titre
  et consigne (`TextInput`), énoncé de chaque question, réponse attendue
  (réponse courte), options d'une question à choix multiples (texte de
  chaque option, ajout jusqu'à 6, suppression jusqu'à 2 minimum), et le
  choix de la bonne réponse (QCM et Vrai/Faux) via un contrôle radio
  tactile sur l'option elle-même. Suppression d'une question entière avec
  confirmation (action irréversible, pas d'annuler après coup). Toujours
  aucune persistance : le brouillon édité reste en état local de l'écran,
  reçu et modifié en mémoire — la sauvegarde arrive avec la publication au
  Milestone 7.
- Cohérence de la bonne réponse maintenue automatiquement pendant
  l'édition plutôt que laissée à la charge du professeur : modifier le
  texte de l'option actuellement correcte fait suivre `correctAnswer` ;
  supprimer l'option correcte reporte automatiquement la bonne réponse sur
  la première option restante (état toujours valide, à corriger par le
  professeur si ce n'est pas la bonne option).
- Avant "Continuer" : validation locale (titre/consigne/questions non
  vides, au moins une question, bonne réponse présente parmi les options)
  puis revalidation complète via `QuizDataSchema` (le même schéma que
  l'Edge Function) — un message explicite en français bloque la suite si
  le brouillon n'est pas exploitable. Le schéma Zod reste volontairement
  permissif côté génération (CLAUDE.md §20 : 0 question + avertissement
  est un état valide en sortie IA) ; les nouvelles règles ci-dessus
  s'appliquent seulement à ce stade de revue, où un devoir vide ou
  incomplet n'a plus de raison d'être.
- `sourceEvidence` reste absent de cet écran (jamais affiché, jamais
  modifiable), comme au Milestone 5.

Décision notable :

- Pas d'identifiant stable par option de QCM dans le schéma (juste un
  tableau de chaînes + `correctAnswer` qui est l'une d'elles) : la bonne
  réponse est donc suivie par égalité de texte au moment de l'édition,
  pas par position. Limite connue et acceptée pour l'MVP : deux options
  avec exactement le même texte au sein d'une question feraient basculer
  les deux ensemble si l'une d'elles est éditée — cas marginal qui
  n'apparaît pas dans une génération IA normale.
- "Continuer" affiche toujours un message d'acquittement ("la publication
  arrive au prochain jalon") plutôt qu'un bouton désactivé, même
  principe que les jalons précédents — mais seulement une fois le
  brouillon validé.

Vérifié :

- TypeScript (`npx tsc --noEmit`) : OK.
- Lint (`npm run lint`) : OK.
- `npx expo export --platform web` : les 16 routes (dont `/quiz-draft`)
  s'exportent toujours sans erreur.

Vérifié manuellement sur appareil par l'utilisateur : édition du titre, de
la consigne, du texte des questions, des options QCM (ajout/suppression),
Vrai/Faux, réponse courte, suppression d'une question — tout fonctionne.

Bug pédagogique repéré au passage (retour utilisateur : questions "très
faciles" pour un CE2 réel) :

- Diagnostic (`pedagogical-ai-engineer`) : le niveau (`grade`) était bien
  transmis au modèle deux fois (règle système + paramètres de tâche), mais
  la règle système ne calibrait explicitement que les deux niveaux
  extrêmes ("CP est un lecteur débutant ; CM2 peut suivre un
  raisonnement court") — rien n'ancrait concrètement ce qu'est une
  question de niveau CE2/CE1/CM1, laissant le modèle par défaut sur
  l'interprétation la plus prudente (donc la plus facile). Cet effet est
  renforcé par la règle 10 ("préférer un devoir plus court mais fiable"),
  qui pouvait se lire comme une invitation à simplifier plutôt qu'à
  raccourcir. Les règles 1-2 (ancrage strict dans la photo, interdiction
  d'inventer) ne sont pas la cause et n'ont pas été touchées — elles
  restent le garde-fou anti-hallucination du produit.
- `prompt.ts` (`SYSTEM_PROMPT`, règles 6 et 10) : règle 6 calibre
  maintenant chaque niveau (CP → identifier/relire un fait ; CE1 →
  rappeler et appliquer une règle simple à un cas très proche ; CE2 →
  appliquer la règle/méthode enseignée à un nouvel exemple ou relier deux
  faits de la leçon, sans se rabattre par défaut sur le pur rappel mot
  pour mot ; CM1 → combiner deux éléments de la leçon ; CM2 → un court
  raisonnement combinant plusieurs éléments), tout en rappelant que cela
  ne permet jamais de sortir de ce qu'autorisent les règles 1-2. Règle 10
  précise que "fiable" signifie "ancré dans la leçon", pas "simplifié
  en dessous du niveau demandé". Redéployé
  (`npx supabase functions deploy generate-quiz`).

Vérifié sur appareil (résultat négatif) : avec le nouveau réglage de la
règle 6/10, une leçon CE2 réelle produit toujours des questions perçues
comme plutôt CP/CE1. Le simple resserrement du texte du prompt n'a donc
pas suffi à corriger la calibration de difficulté par niveau.

Décision (utilisateur, à cette date) : ne pas continuer à itérer sur la
seule formulation du prompt. Le sujet est reporté à un jalon ultérieur, où
la calibration de difficulté sera traitée comme un vrai brief pédagogique
par niveau **et** par matière (pas seulement une phrase générique dans le
prompt système), à concevoir avant d'être incorporé — forme exacte encore
à définir (contenu enrichi du prompt, few-shot, grille de difficulté
structurée, etc.).

## Milestone 7 — Publication et URL publique (détail)

Implémenté :

- Migration `20260825212040_create_quizzes.sql` : table `public.quizzes`
  (`teacher_id` défaut `auth.uid()`, `status` draft/published/archived,
  `quiz_data` = `QuizData` complet incluant `sourceEvidence`, `public_slug`
  unique nullable). RLS : un enseignant ne peut lire/créer/modifier/
  supprimer que ses propres lignes ; aucune policy publique sur cette table.
  Fonction `generate_quiz_slug()` (10 caractères, alphabet sans caractères
  ambigus 0/O/1/l/I). RPC `publish_quiz(p_quiz_id uuid)` : vérifie la
  propriété, génère le slug au premier publish (idempotent ensuite),
  calcule `public_quiz_data` = `quiz_data` avec `sourceEvidence` retiré de
  chaque question (jsonb, sans dépendance applicative), passe `status` à
  `published`. S'exécute en tant qu'appelant (pas de `security definer`) —
  la RLS protège déjà la ligne lue/modifiée. Vue `public.public_quizzes`
  (`security_invoker = false`, comportement par défaut d'une vue) exposant
  uniquement les colonnes nécessaires des quizzes `status = 'published'` ;
  lecture accordée aux rôles `anon` et `authenticated`.
- `shared/domain/quiz.ts` : `PublicQuestionSchema` / `PublicQuizDataSchema`,
  dérivés de `QuestionSchema`/`QuizDataSchema` par `.omit()`/`.extend()`
  (pas de duplication de forme) — la seule différence est l'absence de
  `sourceEvidence`, pour valider côté client exactement ce que
  `public_quiz_data` peut contenir.
- `src/app/(app)/quiz-draft.tsx` : le bouton final ("Continuer") devient
  "Publier le devoir" et déclenche une vraie action : insertion du
  brouillon édité dans `quizzes` (`teacher_id` omis, valeur par défaut
  côté base) puis appel RPC `publish_quiz`. État de chargement
  ("Publication en cours…", bouton désactivé, soumissions multiples
  bloquées), message d'erreur français générique en cas d'échec réseau/RLS/
  RPC, sans perte du brouillon édité (l'écran reste utilisable, "réessayer"
  ne perd aucune saisie).
- `src/app/(app)/quiz-published.tsx` (nouveau) : écran de confirmation
  après publication, affiche le titre et l'URL publique complète en texte
  sélectionnable. Pas de bouton "Partager" ni "Copier le lien" — action
  volontairement limitée au périmètre du jalon (partage natif et
  copier-lien sont le Milestone 9, CLAUDE.md §60).
- `src/app/q/[slug].tsx` (nouveau) : route publique, volontairement hors
  des groupes `(app)`/`(auth)` de `src/app/_layout.tsx` — ni guard de
  session ne s'applique, confirmé par l'export web (`/q/[slug]` bien
  généré comme route statique indépendante). Charge le quiz via
  `public_quizzes` par `public_slug`, états chargement / introuvable /
  erreur (avec réessayer) / prêt. Affiche titre, consigne et questions en
  lecture seule (options de QCM listées sans indiquer la bonne réponse,
  Vrai/Faux affiché sans révéler la réponse) ; aucune saisie ni soumission
  — message "Le remplissage et l'envoi des réponses arrivent bientôt"
  (Milestone 8). `sourceEvidence` absent par construction (jamais présent
  dans `public_quiz_data`).
- `src/features/quiz-publishing/publicQuizUrl.ts` (nouveau) : construit
  l'URL publique complète. Sur web, utilise `window.location.origin`
  (toujours correct quel que soit l'endroit où l'app est servie). Sur
  natif, utilise `EXPO_PUBLIC_APP_URL` si défini (nouvelle variable
  optionnelle, ajoutée à `.env.example`), sinon retombe sur le chemin
  relatif seul (`/q/<slug>`).

Décision notable :

- **Aucun domaine de production n'est encore déployé** (Milestone 10). Sur
  natif, sans `EXPO_PUBLIC_APP_URL` configuré, l'écran de publication
  affiche uniquement `/q/<slug>` — pas une URL complète cliquable/
  partageable. C'est un point à régler avant d'utiliser ce jalon avec de
  vrais élèves ; le partage natif du Milestone 9 rendra ce point plus
  visible et méritera d'être tranché à ce moment-là (domaine réel ou URL de
  déploiement web provisoire).
- Persistance et publication se font en une seule action (pas d'étape
  "enregistrer le brouillon" séparée), conformément à la décision prise au
  Milestone 6. Limite connue et acceptée : si l'insertion réussit mais
  l'appel RPC échoue (ex. coupure réseau entre les deux), une ligne
  `draft` orpheline reste en base, invisible tant que l'historique
  (Milestone 9) n'existe pas ; retenter "Publier" recrée une nouvelle ligne
  plutôt que de reprendre celle-ci. Sans coût ni risque de sécurité, à
  garder en tête si un nettoyage des brouillons orphelins devient utile
  plus tard.

Vérifié :

- TypeScript (`npx tsc --noEmit`) : OK.
- Lint (`npm run lint`) : OK.
- `npx expo export --platform web` : les 19 routes s'exportent sans erreur,
  dont `/q/[slug]`, `/quiz-published`.
- **Backend vérifié en conditions réelles contre la base distante** (rôle
  `authenticated` simulé via `request.jwt.claims`, puis appel HTTP réel à
  l'API REST avec la clé anonyme de l'app) :
  - insertion d'un brouillon en tant qu'enseignant, `teacher_id` bien
    résolu par défaut à `auth.uid()` sans que le client ne l'envoie ;
  - `publish_quiz` génère un slug, bascule `status`, calcule
    `public_quiz_data` sans `sourceEvidence` (confirmé sur la ligne
    complète : présent dans `quiz_data`, absent dans `public_quiz_data`) ;
  - lecture anonyme via `GET /rest/v1/public_quizzes?public_slug=eq....`
    avec la clé anon de l'app : renvoie le quiz publié sans
    `sourceEvidence` ;
  - `GET /rest/v1/quizzes` avec la même clé anon : renvoie `[]` (RLS bloque
    toute lecture de la table privée) ;
  - un second enseignant (autre `auth.uid()` simulé) obtient
    `quiz_not_found` en appelant `publish_quiz` sur le quiz du premier
    (RLS masque la ligne avant même la vérification explicite de
    propriété dans la fonction) ;
  - toutes les lignes de test supprimées après vérification.

Vérifié sur appareil réel (iPhone) par l'utilisateur : parcours complet
créer → générer → éditer → publier fonctionne.

Non vérifié :

- Android.
- Ouverture du lien public depuis un vrai navigateur (aucun site web n'était
  encore déployé au moment du test — voir déploiement web ci-dessous).

### Déploiement web (préparé, pas encore fait)

Aucun domaine de production n'était déployé jusqu'ici (Milestone 10). En
préparation d'un déploiement Vercel sur un sous-domaine dédié
(`quizs.futurgenie.com`, choix de l'utilisateur) :

- `vercel.json` (nouveau) : commande de build `npm run build:web` (= `expo
  export --platform web`), dossier de sortie `dist`, `cleanUrls` activé
  (sert `create.html` sur `/create`, etc.), et une règle de réécriture
  `/q/:slug` → `/q/[slug].html` — nécessaire car l'export statique d'une
  route dynamique Expo Router produit un seul fichier littéral
  (`[slug].html`), pas une page par slug ; c'est l'approche documentée par
  Expo Router pour un hébergement statique de routes dynamiques.
- `package.json` : script `build:web` ajouté.

Reste à faire par l'utilisateur (compte Vercel/DNS, hors de portée de cet
environnement) : créer le projet Vercel à partir du dépôt GitHub, y définir
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (valeurs
publiques, sans risque), ajouter le sous-domaine personnalisé et son
enregistrement DNS CNAME chez le registrar. Une fois en ligne, définir aussi
`EXPO_PUBLIC_APP_URL=https://quizs.futurgenie.com` dans `.env` (app mobile)
pour que l'écran de publication affiche une URL complète sur iPhone/Android
(actuellement uniquement `/q/<slug>`, sans domaine — limite notée plus
haut).
