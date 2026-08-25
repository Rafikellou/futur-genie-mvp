import { AuthError } from '@supabase/supabase-js';

// Translates Supabase Auth errors into French copy a teacher can act on.
// Never surface raw Supabase/HTTP error text in the UI (see CLAUDE.md §34).
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'Adresse e-mail ou mot de passe incorrect.';
      case 'user_already_exists':
        return 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous plutôt.';
      case 'weak_password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      case 'email_not_confirmed':
        return 'Confirmez votre adresse e-mail avant de vous connecter : vérifiez votre boîte de réception.';
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return 'Trop de tentatives. Patientez quelques instants avant de réessayer.';
      case 'validation_failed':
        return 'Adresse e-mail invalide.';
      default:
        return 'Une erreur est survenue. Réessayez dans un instant.';
    }
  }

  if (error instanceof Error && /network/i.test(error.message)) {
    return 'Impossible de se connecter. Vérifiez votre connexion Internet puis réessayez.';
  }

  return 'Une erreur est survenue. Réessayez dans un instant.';
}
