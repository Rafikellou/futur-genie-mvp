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
| 5 | Génération IA | 🔜 Prochain |
| 6 | Revue et édition | À venir |
| 7 | Publication et URL publique | À venir |
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
- Clé API OpenAI : pas encore configurée (nécessaire à partir du
  Milestone 5, en secret Supabase, jamais dans le repo).
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
