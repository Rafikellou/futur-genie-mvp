# Futur Génie

Application mobile-first pour les enseignants du primaire : photographier une
leçon, générer un exercice adapté avec une IA multimodale, le relire, le
publier, et le partager avec les élèves via un lien public.

Voir [CLAUDE.md](./CLAUDE.md) pour la vision produit et les règles du projet.

## Démarrer en local

```bash
npm install
cp .env.example .env   # puis renseigner les clés Supabase
npm run start
```

## Structure

- `src/app` — écrans et navigation (Expo Router).
- `shared/` — code partagé entre l'app mobile et les Edge Functions
  (constantes de domaine, schémas Zod, client Supabase).
- `supabase/` — migrations et Edge Functions.
