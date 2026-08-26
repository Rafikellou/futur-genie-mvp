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
| 7 | Publication et URL publique | ✅ Terminé et vérifié (iPhone + déploiement web sur Vercel) |
| 8 | Expérience élève | ✅ Terminé et vérifié (mobile + laptop, déploiement Vercel) |
| 9 | Suivi des réponses élèves | ✅ Terminé et vérifié (backend + iPhone, déploiement Vercel) |
| 10 | Partage et historique | À venir |
| 11 | Durcissement et lancement | À venir |

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
- **Soumissions élèves (Milestone 9, planifié — voir section dédiée)** :
  table `submissions` + RPC `submit_quiz_answers` (pas d'Edge Function,
  aucun secret nécessaire, même logique que `publish_quiz`) ; le score est
  toujours recalculé côté serveur à partir de `public_quiz_data`, jamais
  reçu du client tel quel ; aucune policy INSERT sur la table (écriture
  uniquement via la fonction, `security definer`) ; lecture strictement
  scopée à l'enseignante propriétaire via RLS. Le prénom élève est une
  exception explicite et bornée à la règle « aucune donnée élève » du
  CLAUDE.md (§32 mis à jour en conséquence).

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

### Déploiement web (fait)

Déployé sur Vercel, domaine par défaut fourni par Vercel pour l'instant
(`https://futur-genie-mvp-murex.vercel.app` — le sous-domaine personnalisé
`quizs.futurgenie.com` envisagé par l'utilisateur reste possible plus tard,
sans changement de code : juste ajouter le domaine dans Vercel et le
CNAME chez le registrar).

- `package.json` : script `build:web` (= `expo export --platform web`,
  suivi d'une étape de préparation — voir plus bas).
- `scripts/prepare-public-quiz-shell.js` (nouveau) : copie le fichier
  exporté `dist/q/[slug].html` (nom littéral avec crochets, produit par
  l'export statique d'une route dynamique Expo Router) vers
  `dist/q/shell.html`, un nom de fichier simple.
- `vercel.json` : trois itérations avant d'obtenir une config qui
  fonctionne réellement (détail ci-dessous, pour éviter de refaire les
  mêmes essais si ce fichier doit être retouché) :
  1. `rewrites: [{ "source": "/q/:slug", "destination": "/q/[slug].html" }]`
     — échec (404 sur un vrai slug), y compris en testant la destination
     encodée en URL. Cause réelle découverte ensuite : non liée à
     l'encodage des crochets.
  2. Cause identifiée via la documentation Vercel : l'ordre de routage
     place le contrôle du système de fichiers *avant* les `rewrites`. Le
     dossier `q/` existant réellement dans l'export (il contient
     `shell.html`), Vercel semble intercepter toute requête sous `/q/...`
     à cette étape, avant même d'atteindre la règle `rewrites`.
  3. Solution : format `routes` (l'ancien format `vercel.json`, qui ne
     peut pas être combiné à `rewrites`/`cleanUrls`), où l'on place
     explicitement notre règle *avant* `{"handle": "filesystem"}` :
     ```json
     "routes": [
       { "src": "/q/[^/]+$", "dest": "/q/shell.html" },
       { "handle": "filesystem" },
       { "src": "/(.*)", "dest": "/$1.html" }
     ]
     ```
     La troisième règle (après le handle filesystem) reconstitue le
     comportement de résolution des URL sans extension que `cleanUrls`
     offrait (`/create` → `create.html`, etc.), perdu en abandonnant
     `cleanUrls`/`rewrites` pour le format `routes`.
- `.env` (local, non commité) : `EXPO_PUBLIC_APP_URL=https://futur-genie-mvp-murex.vercel.app`
  ajouté, pour que l'écran de publication affiche une URL complète
  cliquable sur iPhone/Android (au lieu de `/q/<slug>` seul).

Vérifié : balayage complet des routes sur le déploiement réel après le
correctif final — `/`, `/create`, `/profile`, `/sign-in`, `/sign-up`,
`/quiz-draft`, `/quiz-published` → 200 ; `/q/<slug publié>` → 200 (contenu
attendu, confirmé aussi manuellement par l'utilisateur) ; `/q/<slug
inexistant>` → 200 avec l'état "devoir introuvable" (pas de 404 brut).

Non vérifié :

- Android.
- Sous-domaine personnalisé (`quizs.futurgenie.com`) — resté sur le domaine
  par défaut de Vercel pour l'instant, par choix de l'utilisateur.

## Milestone 8 — Expérience élève (détail)

Implémenté :

- `src/features/quiz-taking/grading.ts` (nouveau) : logique de correction,
  pure et sans dépendance React/Supabase — `createEmptyAnswers`,
  `areAllAnswered`, `gradeQuiz`. QCM et Vrai/Faux sont corrigés
  automatiquement (comparaison directe à `correctAnswer`, déjà présent dans
  `public_quiz_data`). Réponse courte est volontairement exclue du score
  automatique (pas de matching flou texte — décision déjà actée au
  Milestone 7, ci-dessus) : l'élève compare lui-même sa réponse à la
  réponse attendue, affichée après validation.
- `src/app/q/[slug].tsx` : l'écran passe de lecture seule à interactif.
  QCM (choix unique tactile), Vrai/Faux (deux boutons), réponse courte
  (champ texte). Bouton "Valider mes réponses" désactivé tant que toutes
  les questions n'ont pas de réponse. Après validation : score
  "X/Y bonnes réponses" (uniquement sur les questions auto-corrigées,
  absent si le devoir n'en contient aucune), correction visuelle par
  question (✅/❌, jamais la seule couleur — CLAUDE.md §37), réponse
  attendue affichée pour les réponses courtes, `explanation` affichée
  (déjà présente dans `PublicQuestionSchema`, jamais `sourceEvidence`).
  Bouton "Recommencer" pour reprendre le devoir depuis le début (aucune
  réponse n'étant jamais persistée, un nouvel essai ne coûte rien).
- Toujours aucune donnée élève collectée ni envoyée nulle part (CLAUDE.md
  §32/§36) : les réponses vivent uniquement en état local du composant,
  perdues à la fermeture/au rechargement de la page.

Décision notable :

- Le score n'inclut que les questions QCM/Vrai-Faux. Une question à
  réponse courte n'est jamais marquée automatiquement correcte/incorrecte
  (pas de matching flou, texte accepté = infini de formulations
  possibles) ; elle est affichée avec la réponse attendue pour
  auto-correction par l'élève, comme sur une page de correction papier.
  Si un devoir "Mixte" ne contient que des réponses courtes, aucune ligne
  de score n'apparaît (`gradableCount === 0`) — seulement l'invitation à
  se corriger question par question.
- Pas de nouvelle table Supabase ni de RPC : conforme à la décision déjà
  actée au Milestone 7 ("Correction élève" dans la section décisions
  techniques ci-dessus).

Vérifié :

- TypeScript (`npx tsc --noEmit`) : OK.
- Lint (`npm run lint`) : OK.
- `npx expo export --platform web` : les 19 routes s'exportent toujours
  sans erreur, dont `/q/[slug]`.

Complété après la première rédaction de ce jalon :

- Infra de test mise en place (`jest` + `jest-expo`, script `npm test`),
  jusque-là absente malgré la décision technique qui la prévoyait en haut
  de ce fichier. `src/features/quiz-taking/grading.test.ts` (7 tests)
  couvre `createEmptyAnswers`/`areAllAnswered`/`gradeQuiz` : réponse vide
  = non répondu, espace seul = non répondu, QCM/Vrai-Faux notés par
  comparaison directe, réponse courte toujours exclue du score quelle que
  soit sa formulation, `gradableCount` à 0 si le devoir n'a que des
  réponses courtes. `npm test` : 7/7 OK.
- Poussé sur `main` (commit `ee12f71`) pour redéploiement automatique sur
  Vercel (intégration GitHub existante depuis le Milestone 7).

Vérifié sur appareil réel par l'utilisateur (mobile et laptop, sur le
déploiement Vercel `https://futur-genie-mvp-murex.vercel.app`) : répondre
à un devoir publié, valider, voir le score et la correction — fonctionne.

Non vérifié :

- Android natif spécifiquement (l'écran est universel et le parcours web
  a été vérifié ; pas de test isolé sur un appareil Android natif à ce
  jalon).

Mise à jour ultérieure (planification du Milestone 9) :

- La décision « aucune réponse n'est jamais stockée » ci-dessus est
  **consciemment révisée** au Milestone 9, à la demande explicite de
  l'utilisateur (voir section dédiée ci-dessous). La correction
  100 % côté client de cet écran (`grading.ts`, affichage immédiat du
  score à l'élève) reste inchangée ; ce qui change, c'est l'ajout d'un
  enregistrement en tâche de fond de chaque soumission pour que
  l'enseignante puisse la consulter ensuite.

## Milestone 9 — Suivi des réponses élèves (détail)

> **Statut : finalisé et vérifié (backend + appareil réel).** Cette section
> documente d'abord l'architecture validée en conversation avant le code
> (plan initial, inchangé ci-dessous), puis le résultat de l'implémentation
> et sa vérification, à la suite (voir "Implémenté" plus bas).

### Objectif

Une enseignante peut voir, pour un devoir publié donné, la liste des
élèves qui ont répondu (prénom + score), triée pour repérer en un clin
d'œil qui est en difficulté. Toujours aucun compte/login élève.

### Pourquoi ce séquencement (et pas à la toute fin du plan)

Décision produit prise avec l'utilisateur (skill `product-architect`) : ce
jalon s'insère entre le Milestone 8 (Expérience élève) et l'ancien
Milestone 9 (désormais Milestone 10, Partage et historique), plutôt
qu'après le durcissement final. Raisons principales :

- Plus proche de la promesse centrale du produit (voir si un enfant est en
  difficulté) que le partage natif/l'historique, qui restent triviaux en
  comparaison.
- L'écran d'historique prévu au jalon suivant a de toute façon besoin
  d'une liste des devoirs de l'enseignante — autant poser ce socle ici.
- Le durcissement (RLS/vie privée, désormais Milestone 11) ne doit se
  faire qu'une fois, sur l'état final du schéma — pas une fois avant, une
  fois après un ajout tardif.

CLAUDE.md a été mis à jour en conséquence : §5 (portée MVP), §6
(clarification de l'exclusion « suivi de progression long terme »), §15
(renumérotation des jalons 9-11), §16 (type `Submission`), §29 (soumissions
des autres élèves jamais exposées), §32 (exception bornée pour le prénom
élève), §48 (score toujours recalculé serveur), §65 (critère de succès
MVP).

### Schéma de base de données (migration à créer)

```sql
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  student_name text not null check (char_length(btrim(student_name)) between 1 and 50),
  answers jsonb not null,
  correct_count int not null,
  gradable_count int not null,
  created_at timestamptz not null default now()
);

create index submissions_quiz_id_idx on public.submissions (quiz_id);

alter table public.submissions enable row level security;
```

`answers` reprend la forme du type `AnswerMap` déjà défini côté client
(`src/features/quiz-taking/grading.ts`) — à déplacer vers `shared/domain`
au moment de l'implémentation, pour rester la définition unique
(CLAUDE.md §46).

### RLS

```sql
create policy "Teachers can read submissions to their own quizzes"
  on public.submissions for select
  to authenticated
  using (exists (
    select 1 from public.quizzes q
    where q.id = submissions.quiz_id and q.teacher_id = auth.uid()
  ));

create policy "Teachers can delete submissions to their own quizzes"
  on public.submissions for delete
  to authenticated
  using (exists (
    select 1 from public.quizzes q
    where q.id = submissions.quiz_id and q.teacher_id = auth.uid()
  ));

-- Volontairement aucune policy INSERT/UPDATE : la seule écriture possible
-- passe par la fonction `submit_quiz_answers` ci-dessous (`security
-- definer`). Ouvrir une policy INSERT à `anon` permettrait de poster un
-- score arbitraire directement via l'API REST, en contournant tout calcul.
```

### RPC de soumission

```sql
create function public.submit_quiz_answers(
  p_slug text,
  p_student_name text,
  p_answers jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quiz_id uuid;
  v_quiz_data jsonb;
  v_name text := btrim(p_student_name);
  v_correct int := 0;
  v_gradable int := 0;
  v_question jsonb;
begin
  if char_length(v_name) = 0 or char_length(v_name) > 50 then
    raise exception 'invalid_request' using errcode = 'P0001';
  end if;

  select id, public_quiz_data into v_quiz_id, v_quiz_data
  from public.quizzes
  where public_slug = p_slug and status = 'published';

  if not found then
    raise exception 'quiz_not_found' using errcode = 'P0002';
  end if;

  for v_question in select * from jsonb_array_elements(v_quiz_data -> 'questions')
  loop
    if v_question ->> 'type' in ('multiple_choice', 'true_false') then
      v_gradable := v_gradable + 1;
      if (p_answers -> (v_question ->> 'id') -> 'value') = (v_question -> 'correctAnswer')
      then
        v_correct := v_correct + 1;
      end if;
    end if;
  end loop;

  insert into public.submissions (quiz_id, student_name, answers, correct_count, gradable_count)
  values (v_quiz_id, v_name, p_answers, v_correct, v_gradable);
end;
$$;

revoke all on function public.submit_quiz_answers(text, text, jsonb) from public;
grant execute on function public.submit_quiz_answers(text, text, jsonb) to anon, authenticated;
```

Points clés :

- Le score n'est **jamais** reçu du client tel quel : recalculé ici à
  partir de `public_quiz_data`, seule source de vérité pour la bonne
  réponse.
- Seul un quiz `status = 'published'` peut recevoir une soumission
  (recherche par `public_slug`, jamais par `quiz_id` brut) — un brouillon
  ne peut jamais en recevoir.
- `security definer` avec `search_path` explicite (évite le détournement
  de search_path, bonne pratique standard Postgres pour ce type de
  fonction).
- Pas d'Edge Function : aucun secret impliqué, même raisonnement que
  `publish_quiz` (Milestone 7).
- Ne renvoie rien : l'élève voit déjà sa propre correction instantanée,
  calculée côté client comme au Milestone 8 (inchangé) ; l'appel RPC est
  un envoi en tâche de fond, silencieux en cas d'échec réseau (ne doit
  jamais bloquer ni inquiéter l'élève).

### Écrans à créer/modifier

- `src/app/q/[slug].tsx` : ajout d'un champ prénom (requis) avant de
  commencer le devoir ; appel du nouveau `submitSubmission.ts` en tâche de
  fond au moment de « Valider mes réponses » (logique de
  correction/affichage du Milestone 8 inchangée).
- `src/features/quiz-taking/submitSubmission.ts` (nouveau) : appel
  `supabase.rpc('submit_quiz_answers', …)`, best-effort.
- `shared/domain/` : `StudentAnswer`/`AnswerMap` déplacés depuis
  `grading.ts` vers un emplacement partagé.
- `src/app/(app)/quiz-published.tsx` : lien « Voir les réponses des
  élèves ».
- Nouvelle route (convention plate déjà en place) : `quiz-results.tsx` —
  liste des soumissions d'un devoir (prénom + score + date), triée pour
  faire remonter les scores faibles, état vide « Aucune réponse pour
  l'instant ».
- Nouvelle route minimale « Mes devoirs » (id/titre/statut/date, juste de
  quoi naviguer) : socle réutilisé et enrichi par le Milestone 10.

### Vie privée — décision explicite

CLAUDE.md §32 est mis à jour avec une exception bornée : un prénom libre
(pas de compte, pas de vérification, jamais lié entre plusieurs devoirs)
est accepté uniquement pour que l'enseignante distingue ses élèves sur
l'écran de résultats. Toute extension (nom de famille, email, suivi
inter-devoirs) nécessite une nouvelle décision explicite.

### Étapes d'implémentation (à suivre dans cet ordre)

1. Migration : table + RLS + fonction RPC + grants.
2. Déplacer `StudentAnswer`/`AnswerMap` vers `shared/domain`.
3. `submitSubmission.ts`.
4. Champ prénom + appel de soumission dans `q/[slug].tsx`.
5. Écran minimal « Mes devoirs ».
6. Écran `quiz-results.tsx`.
7. Lien depuis `quiz-published.tsx`.
8. Mettre à jour cette section de PROGRESS.md avec le statut « Implémenté »
   et les résultats de vérification, comme pour chaque jalon précédent.

### Stratégie de test prévue

- RLS : vérification manuelle façon Milestone 7 (JWT simulé enseignante
  A/B — A ne voit jamais les soumissions du quiz de B ; `anon` ne peut pas
  lire la table directement ; `anon` peut appeler la RPC sur un quiz
  publié, pas sur un brouillon).
- RPC : appels de vérification du recalcul de score (toutes bonnes, toutes
  fausses, quiz 100 % réponses courtes → `gradable_count = 0`).
- Client : test que « Commencer » reste bloqué tant que le prénom est
  vide.
- Parcours doré complet, avec la nouvelle étape : l'enseignante voit
  apparaître la soumission après qu'un élève ait répondu.

### Implémenté

Les 8 étapes du plan ci-dessus ont été suivies dans l'ordre :

- Migration `20260826090000_create_submissions.sql` : table `submissions`,
  index sur `quiz_id`, RLS (`select`/`delete` réservés à l'enseignante
  propriétaire via une sous-requête sur `quizzes.teacher_id`, aucune policy
  `insert`/`update`), fonction `submit_quiz_answers` (`security definer`,
  recherche par `public_slug` + `status = 'published'` uniquement, recalcule
  `correct_count`/`gradable_count` à partir de `public_quiz_data`).
  Poussée sur le projet distant (`npx supabase db push`), exactement comme
  écrite dans le plan (aucun ajustement nécessaire).
- `shared/domain/submission.ts` (nouveau) : `StudentAnswer`/`AnswerMap`
  déplacés depuis `src/features/quiz-taking/grading.ts` (qui les
  ré-exporte pour ne pas casser ses propres tests) ; type `Submission`
  ajouté, miroir TypeScript de la table.
- `src/features/quiz-taking/submitSubmission.ts` (nouveau) : appelle
  `supabase.rpc('submit_quiz_answers', …)`, erreurs avalées silencieusement
  (best-effort, CLAUDE.md §39 — ne doit jamais interrompre la correction
  déjà affichée à l'élève).
- `src/app/q/[slug].tsx` : un écran « Ton prénom » précède désormais le
  devoir (bouton « Commencer » désactivé tant que le champ est vide,
  jamais de compte/mot de passe). La soumission est envoyée en tâche de
  fond au moment de « Valider mes réponses », sans changer la correction
  100 % client déjà en place (Milestone 8).
- `src/app/(app)/my-quizzes.tsx` (nouveau, route « Mes devoirs ») : liste
  des devoirs de l'enseignante (titre, statut, date), triés du plus récent
  au plus ancien. Seules les lignes publiées sont cliquables (mènent à
  `quiz-results`) ; un brouillon s'affiche sans action, cette liste
  minimale ne sachant pas encore reprendre l'édition d'un brouillon
  (Milestone 10). Lien ajouté sur l'accueil.
- `src/app/(app)/quiz-results.tsx` (nouveau) : liste des soumissions d'un
  devoir (prénom, score, date), triée pour faire remonter les scores
  faibles en premier (les soumissions 100 % réponse-courte, sans score
  chiffrable, sont affichées à part — sous un tiret — plutôt que classées
  arbitrairement comme un 0 ou un score parfait) ; état vide « Aucune
  réponse pour l'instant ».
- `src/app/(app)/quiz-published.tsx` : nouveau bouton secondaire « Voir les
  réponses des élèves » vers `quiz-results` (le `quizId` de la ligne
  publiée est maintenant transmis depuis `quiz-draft.tsx`, en plus du
  titre et du slug déjà transmis au Milestone 7).

Vérifié :

- TypeScript (`npx tsc --noEmit`) : OK (a nécessité de relancer une fois
  `npx expo start` brièvement pour régénérer les types de routes d'Expo
  Router — `npx expo export` seul ne les régénère pas, contrairement aux
  jalons précédents où ce n'était jamais apparu nécessaire).
- Lint (`npm run lint`) : OK.
- `npx expo export --platform web` : 23 routes exportées sans erreur, dont
  les deux nouvelles (`/my-quizzes`, `/quiz-results`).
- `npm test` : 7/7 (suite existante de `grading.test.ts`, inchangée —
  toujours verte après le déplacement de `AnswerMap`/`StudentAnswer`).
- **Backend vérifié en conditions réelles contre la base distante**, migration
  déjà poussée en production (même méthode qu'au Milestone 7 : rôle simulé
  via `request.jwt.claims`, plus un appel HTTP réel avec la clé anonyme de
  l'app) :
  - devoir de test créé et publié comme la vraie enseignante du projet ;
  - `submit_quiz_answers` appelée en tant qu'`anon` (SQL *et* HTTP réel via
    `POST /rest/v1/rpc/submit_quiz_answers` avec la clé anon de l'app,
    HTTP 204) : une soumission « tout juste » donne bien 2/2, une
    soumission « tout faux » donne bien 0/2, la réponse courte n'est
    jamais comptée dans `gradable_count` — le score vient uniquement du
    recalcul serveur, jamais du client (aucun paramètre de score n'existe
    même dans la signature de la fonction) ;
  - l'enseignante propriétaire (JWT simulé avec son vrai `auth.uid()`) lit
    les deux soumissions ;
  - une autre enseignante simulée (UUID quelconque) obtient 0 ligne sur ce
    même quiz ;
  - `anon` obtient 0 ligne en lisant la table directement, aussi bien en
    SQL qu'en HTTP réel (`GET /rest/v1/submissions` → `[]`) ;
  - `anon` appelant la fonction sur un slug inexistant obtient l'erreur
    `quiz_not_found` (P0002) — un brouillon, qui n'a jamais de
    `public_slug`, est structurellement inatteignable par cette RPC ;
  - toutes les lignes de test supprimées après vérification (suppression du
    devoir de test, cascade sur ses soumissions — confirmé à 0 restante).

Vérifié sur appareil réel par l'utilisateur (iPhone, déploiement Vercel,
après avoir poussé le commit — voir note ci-dessous) : création d'un devoir
via l'appli, soumission via l'URL publique, soumission visible à la fois
dans Supabase et dans l'écran « Mes devoirs » → « Réponses des élèves ».

Non vérifié :

- Android natif spécifiquement (comme aux jalons précédents).

Note opérationnelle (rencontrée en testant le point ci-dessus) : le code de
ce jalon avait été vérifié directement contre Supabase mais jamais commité
ni poussé sur `main` — le déploiement Vercel testé sur iPhone tournait donc
encore sur l'ancienne version (pas d'étape prénom visible). Commité et
poussé (`279b485`) pour déclencher le redéploiement Vercel ; le parcours a
ensuite été vérifié avec succès par l'utilisateur.

### Suite donnée après vérification : une soumission par passage

Retour utilisateur après le test ci-dessus : le bouton « Recommencer »
(Milestone 8, correction 100 % client, jamais retiré) permettait de
renvoyer une nouvelle soumission à chaque nouvel essai — polluant la liste
de l'enseignante d'une ligne par tentative au lieu d'une ligne par élève.

Options envisagées et écartées avant implémentation (décision produit
explicite avec l'utilisateur) :

- Dédupliquer en base sur le prénom (`quiz_id`, `student_name`) : rejeté —
  deux élèves réels d'une même classe partagent souvent le même prénom
  (Lucas, Emma…) ; une contrainte d'unicité sur le prénom fusionnerait ou
  écraserait silencieusement les réponses de deux élèves différents. Pire
  que le problème initial (perte de données au lieu de doublons visibles).
- Dédupliquer en base sur un identifiant d'appareil anonyme persistant
  (`quiz_id`, `device_token`) : rejeté pour la même raison sous un autre
  angle — l'élémentaire utilise souvent des appareils partagés
  (tablettes/ordinateurs de classe) ; deux élèves différents passant l'un
  après l'autre sur le même appareil auraient le même token, et le second
  écraserait silencieusement la soumission du premier.

Solution retenue — restriction côté client uniquement, sans hypothèse
d'identité :

- `src/app/q/[slug].tsx` : un `useRef` (`hasSubmittedRef`, pas un state —
  ne doit jamais provoquer de re-rendu) retient qu'une soumission a déjà
  été envoyée pour ce passage. `handleSubmit` continue de calculer et
  d'afficher la correction à chaque « Valider » (inchangé), mais n'appelle
  `submitSubmission` que la première fois. Un « Recommencer » qui ramène à
  « Valider » ensuite affiche bien la correction localement sans envoyer de
  nouvelle ligne au serveur. Protège aussi contre un double-tap rapide sur
  « Valider » avant que l'interface n'ait le temps de se mettre à jour.
  Réinitialisé avec le reste de l'état au chargement d'un nouveau quiz
  (changement de `slug`).

Limite assumée, actée avec l'utilisateur : si l'élève ferme l'onglet et
rouvre le lien plus tard (nouvelle session), une nouvelle soumission sera
bien créée. Volontairement non traité — toute tentative fiable de le
bloquer sans compte retomberait sur l'un des deux risques écartés
ci-dessus. Cohérent avec le principe déjà acté du produit : le prénom est
un système de confiance, pas une identité vérifiée (CLAUDE.md §32).

Aucune migration, aucun changement de schéma ou de RPC — modification
limitée à `src/app/q/[slug].tsx`.

Vérifié :

- TypeScript (`npx tsc --noEmit`) : OK.
- Lint (`npm run lint`) : OK.
- `npx expo export --platform web` : les 23 routes s'exportent toujours
  sans erreur.
- `npm test` : 7/7 (suite `grading.test.ts`, non affectée par ce
  changement).

Vérifié sur appareil réel par l'utilisateur (après redéploiement Vercel) :
Commencer → Valider → Recommencer → Valider à nouveau → une seule ligne
pour ce prénom dans `quiz-results`, comme attendu.

Non vérifié :

- Android natif spécifiquement (comme aux jalons précédents).

**Milestone 9 finalisé** : tous les écrans, la base et cette protection de
dernière minute sont vérifiés de bout en bout (backend en conditions
réelles + parcours sur appareil). Seul Android natif reste à tester,
cohérent avec l'état des jalons précédents.
