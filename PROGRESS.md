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
| 2 | Authentification enseignant | 🔜 Prochain |
| 3 | Création d'exercice (sans IA) | À venir |
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

## Prérequis avant de commencer le Milestone 2

- [ ] Utilisateur : exécuter une fois `npx supabase login` puis
  `npx supabase link --project-ref otrtxtkghhnxmmfqgvdr` dans un terminal
  sur cette machine, pour que les migrations SQL puissent être appliquées
  via `npx supabase db push`.
