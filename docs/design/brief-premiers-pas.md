# Brief design — « Premiers pas » (accompagnement des nouveaux enseignants)

Ce brief ajoute quelques écrans et états aux maquettes existantes (`docs/design/mockups/*.dc.html`). Il ne change pas le système visuel : mêmes couleurs, dégradés, typographies (Bricolage Grotesque / DM Sans), rayons, cartes « glass », halos, barre d'onglets flottante. Même format de livraison : un fichier `.dc.html` par écran, 390 px de large.

## 1. Objectif

Un enseignant qui installe l'app doit réussir son **premier devoir sans aide**, de la photo jusqu'aux résultats des élèves.

On ne fait **pas** de visite guidée à bulles par-dessus l'interface. On guide **dans** les écrans :

- un accueil dédié au premier lancement ;
- une **leçon d'exemple** pour essayer sans manuel sous la main ;
- de **petites astuces** affichées une seule fois, intégrées aux écrans ;
- un bouton **« Tester comme un élève »** ;
- la possibilité de **supprimer un devoir**, par exemple un devoir de test.

Le ton reste chaleureux, court et concret. Jamais de vocabulaire technique (IA, modèle, lien API…). On dit « devoir », pas « quiz ».

## 2. Écrans à produire

### 2.1 Accueil — premier lancement (`AccueilPremierDevoir.dc.html`)

Il remplace l'accueil habituel tant que l'enseignant n'a créé **aucun devoir**. On garde l'en-tête actuel (date, salutation, avatar). La pastille « N devoirs » et la section « Derniers devoirs » sont remplacées par :

- une **carte héros** (dégradé) : « Votre premier devoir en 1 minute » ;
- **4 étapes illustrées**, chacune avec une icône et une ligne de texte :
  1. Photographiez la leçon
  2. Vérifiez les questions
  3. Partagez le lien aux élèves
  4. Suivez leurs réponses
- bouton principal : **« Créer mon premier devoir »** ;
- ligne discrète sous le bouton : « Pas de manuel sous la main ? Une leçon d'exemple vous attend à l'étape photo. »

Dès que l'enseignant a un devoir, l'accueil normal (`Accueil.dc.html`) revient.

### 2.2 Choix de la photo avec leçon d'exemple (`PhotoChoixExemple.dc.html`)

C'est une variante de `PhotoChoix.dc.html`. On garde tout l'existant (étape 2 sur 3, pastilles récapitulatives, illustration de cadrage, 3 conseils, boutons « Prendre une photo » / « Choisir dans mes photos »). On ajoute **sous** ces boutons une carte secondaire, visuellement moins forte que les deux actions principales :

- miniature de la page de leçon (format portrait) ;
- titre : **« Essayer avec une leçon d'exemple »** ;
- sous-titre : la leçon qui correspond au niveau choisi à l'étape 1, par exemple « Mathématiques · CE2 — Mesurer des longueurs ».

Les 5 leçons (mêmes visuels que la miniature) :

| Niveau | Leçon |
|---|---|
| CP | Les nombres jusqu'à 20 : la dizaine |
| CE1 | Comparer et ranger les nombres jusqu'à 1 000 |
| CE2 | Mesurer des longueurs : km, m, cm, mm |
| CM1 | Les fractions |
| CM2 | Les nombres décimaux |

Les leçons d'exemple sont toutes en mathématiques. Si l'enseignant a choisi une autre matière à l'étape 1, la carte affiche une petite mention « Le devoir sera créé en Mathématiques ». Une fois la leçon d'exemple choisie, la pastille matière du récapitulatif passe à « Mathématiques ».

### 2.3 Aperçu de la leçon d'exemple (`PhotoApercuExemple.dc.html`)

C'est une variante de `PhotoApercu.dc.html` avec la page d'exemple à la place de la photo et un badge « Leçon d'exemple » sur l'image. Le bouton principal ne change pas : « Créer le devoir ». L'action secondaire devient « Utiliser ma propre photo ».

### 2.4 Astuces de premier passage (`Astuces.dc.html`)

Il faut **un seul composant « Astuce »**, montré en situation sur les 3 écrans ci-dessous (une planche avec les 3 écrans suffit) :

- c'est une carte compacte placée en haut du contenu, **dans le flux de la page** (pas de superposition, pas de voile sombre, pas de flèche qui pointe un bouton) ;
- elle a une icône (ampoule ou étincelle), un texte de 1 à 2 lignes et un bouton « Compris » ou une croix de fermeture (avec libellé accessible) ;
- elle doit se distinguer du `Banner` info existant (les messages du mode leçon) sans le concurrencer : plus légère, ton « coup de pouce ».

| Écran | Texte de l'astuce |
|---|---|
| Relecture (`Relecture.dc.html`) | « Vos élèves ne voient rien tant que vous n'avez pas publié. Touchez une question pour la modifier. » |
| Devoir publié (`DevoirPublie.dc.html`) | « Envoyez ce lien à vos élèves par WhatsApp, ÉcoleDirecte ou e-mail. Ils l'ouvrent dans leur navigateur, sans compte. » |
| Mes devoirs (`MesDevoirs.dc.html`) | « Touchez un devoir publié pour voir les réponses de vos élèves. » |

Chaque astuce n'apparaît qu'**une seule fois**. Une fois fermée, elle ne revient pas.

### 2.5 Devoir publié — « Tester comme un élève » (mise à jour de `DevoirPublie.dc.html`)

Ajouter une action tertiaire sous « Partager » / « Copier le lien » : **« Tester comme un élève »**. Elle ouvre la page élève dans le navigateur. Elle est accompagnée d'une ligne d'aide discrète : « Votre réponse de test apparaîtra dans les résultats. »

### 2.6 Réponses — aucun élève pour l'instant (mise à jour de `Reponses.dc.html` / `Etats.dc.html`)

État vide de l'écran de résultats d'un devoir, dans le format `EmptyState` existant :

- titre : « Pas encore de réponse » ;
- texte : « Les réponses de vos élèves apparaîtront ici dès qu'ils auront fait le devoir. » ;
- actions : « Partager le lien » (principale) et « Tester comme un élève » (secondaire).

### 2.7 Supprimer un devoir (mise à jour de `MesDevoirsSelection.dc.html` + `Reponses.dc.html`)

- **Mes devoirs, mode sélection** : la barre flottante sombre propose deux actions, **« Partager »** et **« Supprimer »**. En mode sélection, les brouillons deviennent sélectionnables aussi. « Partager » ne prend en compte que les devoirs publiés ; « Supprimer » prend en compte toute la sélection. Il faut montrer l'état où la sélection contient un brouillon.
- **Écran Réponses** : une action « Supprimer ce devoir » accessible sans encombrer l'écran (par exemple en bas de page, en style texte « danger »).
- La confirmation reste une **alerte système native** (voir `Fenetres.dc.html`, à compléter) :

| Où | Titre | Message | Boutons (dans l'ordre) |
|---|---|---|---|
| Mes devoirs / Réponses | Supprimer ce devoir ? *(pluriel : « Supprimer ces N devoirs ? »)* | « Le lien ne fonctionnera plus et les réponses des élèves seront effacées. » | Supprimer (`destructive`), Annuler |

## 3. Contraintes

- **Aucune nouvelle dépendance native**, pas de flou dynamique : on reste dans le système de `docs/design/README.md`.
- **Accessibilité** : contraste ≥ 4,5:1, libellés sur les boutons-icônes (fermeture d'astuce), zones tactiles ≥ 44 px, information jamais portée par la couleur seule.
- **iOS, Android et web** : tout doit rendre correctement sur les trois.
- **Ton positif** : pas de « Vous n'avez encore rien fait ». On préfère une formulation tournée vers l'action.
- Les textes ci-dessus sont une base. Vous pouvez les raccourcir, mais pas en changer le sens.

## 4. Livrables attendus

1. `AccueilPremierDevoir.dc.html`
2. `PhotoChoixExemple.dc.html`
3. `PhotoApercuExemple.dc.html`
4. `Astuces.dc.html` (planche : Relecture, Devoir publié, Mes devoirs)
5. `DevoirPublie.dc.html` mis à jour
6. `Reponses.dc.html` (état vide + action de suppression) et `Etats.dc.html` mis à jour
7. `MesDevoirsSelection.dc.html` mis à jour
8. `Fenetres.dc.html` complété avec l'alerte de suppression
