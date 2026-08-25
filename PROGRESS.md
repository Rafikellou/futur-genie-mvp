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
| 2 | Authentification enseignant | ✅ Terminé — à vérifier sur appareil (voir note ci-dessous) |
| 3 | Création d'exercice (sans IA) | 🔜 Prochain |
| 4 | Photo de leçon | À venir |
| 5 | Génération IA | À venir |
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

Non vérifié (à faire manuellement) :

- Parcours complet sur appareil réel (iOS/Android via Expo Go) : créer un
  compte, se déconnecter, se reconnecter, modifier le nom affiché.
- Comportement réel de la confirmation e-mail (dépend du réglage "Confirm
  email" du projet Supabase, non modifié ici).
