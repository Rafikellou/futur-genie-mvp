# Revue avant livraison

Utiliser cette grille pour détecter les problèmes, pas pour attribuer une note flatteuse ou prétendre être « le meilleur designer ». Les décisions esthétiques restent des jugements ; un test utilisateur est nécessaire pour démontrer une amélioration d'usage.

## Questions de décision

- **Compréhension** : reconnaît-on le sujet et l'action principale immédiatement ? Les fonctions initiales restent-elles accessibles ?
- **Identité** : peut-on expliquer ce qui rend cette proposition spécifique au produit, au-delà de sa couleur et de son logo ?
- **Composition** : y a-t-il un point focal, un rythme et des niveaux clairs ? Les espaces et alignements servent-ils les groupes de contenu ?
- **Typographie et contenu** : les textes sont-ils exacts, lisibles, réalistes et robustes aux longueurs différentes ?
- **Cohérence** : les mêmes rôles conservent-ils leurs composants, couleurs et comportements entre écrans ?
- **Usage natif** : navigation, clavier, gestes, zones sûres et commandes système sont-ils plausibles et adaptés à la cible ?
- **Accessibilité** : contraste, taille du texte, zones tactiles, alternatives au mouvement et à la couleur sont-ils traités ? Distinguer vérifié, prévu et non testé.
- **États** : sélectionner selon le périmètre chargement, vide, erreur, succès, désactivation, permissions, hors ligne. Ne pas concevoir des états inutiles pour remplir une checklist.
- **Finition** : inspecter les rendus pour troncatures, chevauchements, contrastes de transparence variables et éléments qui ressemblent à des boutons sans être interactifs.

## Critère d'arrêt

Corriger les défauts bloquant la lecture ou l'action, puis les incohérences importantes. Une fois le résultat inspecté et les limites documentées, livrer. Ne pas poursuivre des variations indéfinies en quête d'une perfection invérifiable.

## Scénarios de contrôle du skill

Ces cas permettent de vérifier le comportement lors d'une évolution du skill ; ils ne constituent pas des tests déjà exécutés.

1. Capture d'un suivi de dépenses, demande « plus wow, conserve toutes les fonctions » : audit localisé, conservation du contenu, direction propre au produit et refonte visible ; aucune suppression de fonction pour aérer artificiellement.
2. « Crée l'accueil et le détail d'une app iOS de jardinage » : hypothèses raisonnables, composants communs, contenus réalistes, deux écrans inspectables et relation de navigation cohérente.
3. « Modernise ce formulaire pour de gros caractères, cible iOS 17 » : priorité à la lecture et au clavier, compatibilité explicitée ; aucune API récente non protégée ni transparence imposée.
4. « Analyse seulement cette capture » : critique utile limitée aux observations, aucune fausse affirmation de test fonctionnel ni implémentation non demandée.
5. Capture non accessible ou outils de rendu absents : manque signalé, aucune observation inventée, livraison alternative honnêtement qualifiée.
