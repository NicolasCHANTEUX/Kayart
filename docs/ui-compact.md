# Interface compacte — 13 septembre 2026

> La palette est remplacée par [l’identité KayArt](ui-brand.md), inspirée des logos fournis. Les principes de compacité restent en place.

Cette évolution remplace la direction graphique décrite initialement dans `ui-v2.md`. Elle reste locale, sans publication GitHub ou Vercel.

## Changements

- Fond blanc/gris clair, texte anthracite, accent vert pétrole ; titres sans empattements.
- En-tête de 60 px sur mobile et 64 px sur ordinateur, sections et titres plus courts.
- Accueil mobile avec illustration réduite et sélection de produits en lignes compactes.
- Suppression des hauteurs minimales héritées qui créaient des espaces vides dans les cartes.
- Catalogue à deux colonnes sur téléphone, filtres regroupés, informations produit plus denses.
- Bouton de contact de la fiche produit corrigé : son ancien `flex-basis` créait une hauteur de 180 px en disposition verticale.
- Formulaires moins espacés, zones de texte initiales de quatre lignes pour le message et trois pour les détails secondaires ; redimensionnement toujours possible.
- Administration : raccourcis conservés, panneaux resserrés et miniatures de 64 px sur mobile.
- Boutons principaux d’au moins 44 px et champs de saisie mobiles à 16 px.

## Mesures et vérifications

Les mesures comparent le même catalogue de test à 390 et 1 440 px. L’accueil passe de 4 144 à 2 482 px sur téléphone (−40 %) et de 3 263 à 2 044 px sur ordinateur (−37 %). Les pages contact, réparation et sur mesure diminuent d’environ 23 à 27 %. Le détail reproductible est dans `outputs/compact-ui-2026-09-13/comparison.json`.

Validation : ESLint, TypeScript, 72 tests unitaires, compilation de production, 36 contrôles HTTP plus l’endpoint retiré, 6 contrôles de session avec Auth simulé, et 64 contrôles navigateur sur onze pages à cinq largeurs. Les captures sont dans le même dossier de résultats.

Les captures administratives sont des rendus statiques des composants réels avec des produits de test et des dépendances serveur simulées. Elles vérifient la disposition ; elles ne constituent pas une nouvelle vérification de connexion au compte réel. Aucune garde d’accès de l’application n’a été désactivée.

Les formulaires sont indisponibles dans l’environnement de test sans service configuré ; cet état est attendu. Les photographies absentes des données de test utilisent les états de remplacement existants. Les essais portent sur Chrome, sans validation physique sur iPhone/Safari.

## Reproduire

`npm run test:production` prépare et vérifie une copie isolée sans les fichiers d’environnement réels. Le navigateur de recette utilise un profil dédié et le port CDP 9224 ; l’application de test écoute sur 3107.

Définir `KAYART_HTTP_REPORT_DIR=outputs/compact-ui-2026-09-13`, puis lancer `node tests/measure-layout.mjs after`, `node tests/ui-browser.mjs` ou `node tests/capture-ui.mjs 390 / home-mobile`. Ne pas écraser `before.json`, qui conserve la référence antérieure.
