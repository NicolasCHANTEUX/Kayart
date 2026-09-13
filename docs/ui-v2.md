# KayArt — UI/UX « Atelier », version 2

> Direction graphique remplacée le 13 septembre par la [version compacte](ui-compact.md). Ce document conserve la recette initiale.

Version locale finalisée le 10 septembre 2026, sur la base du commit `649c6b4`. Elle n’a pas été publiée sur GitHub ou Vercel.

## Direction et parcours

L’interface adopte un fond ivoire, des tons carbone et sauge, et un orange réservé aux actions importantes. Les titres éditoriaux et les espaces plus généreux rendent les contenus plus faciles à parcourir. L’illustration de pagaie de l’accueil est un SVG décoratif, et non une photographie contractuelle d’un produit.

Les trois entrées principales sont la recherche d’une pièce, la réparation et le sur-mesure. La page d’accueil relie ces parcours à la boutique et au contact avec l’atelier. Les fiches conservent les informations de prix, de disponibilité et de défauts des produits imparfaits.

| Espace | Évolution |
| --- | --- |
| Navigation | Menu mobile dépliable, indication de page active, fermeture avec Échap et retour du focus, compteur du panier actualisé immédiatement. |
| Accueil | Nouvelle composition, illustration originale, sélection de produits et accès directs aux deux services. |
| Boutique | Filtres regroupés, raccourcis de sélection, cartes plus lisibles et états sans résultat exploitables. |
| Fiche produit | Fil d’Ariane, galerie et hiérarchie visuelle harmonisées ; priorité à la propre image du produit dans les cartes. |
| Réparation et sur-mesure | Explication en trois étapes, formulaires harmonisés, contact direct si le formulaire est indisponible. |
| Contact et comptes | Présentation cohérente et textes orientés vers l’utilisateur. |
| Panier | État vide avec accès à la boutique, lignes et formulaires harmonisés, compteur synchronisé à l’ajout et au retrait. |
| Atelier et journal | Présentation du savoir-faire et état vide honnête du journal, sans articles inventés. |
| Administration | Navigation latérale sur ordinateur, navigation horizontale sur mobile, surfaces et tableaux harmonisés. |

Les points d’entrée `src/app/atelier-v2.css` et `globals.css` chargent depuis le 13 septembre des modules dans `src/styles`, dans l’ordre documenté dans son README. Les styles existants restent nécessaires à certaines structures de formulaire et d’administration. La refonte n’ajoute pas de dépendance runtime ; la stabilisation ajoute l’outillage ESLint de développement. Le changement de page utilise une barre de progression discrète ; les préférences de réduction des animations sont respectées.

## Règles métier préservées

- Retrait gratuit sur rendez-vous ; livraison proposée uniquement avec un tarif configuré et une destination admissible.
- Paiement limité au mode test et soumis à sa configuration existante.
- Pages légales non publiables tant que les informations et leur validation manquent.
- Coordonnées réelles conservées ; aucune adresse, identité juridique, garantie ou délai commercial ajouté.
- Autorisations serveur, politiques de sécurité, validation des demandes et mécanismes de commande conservés.

## Vérifications réalisées

- Compilation de production Next.js 15.5.25 réussie, avec contrôle TypeScript.
- 67 tests automatisés existants réussis.
- 64 contrôles dans Chrome : onze pages à 320, 390, 768, 860 et 1 440 pixels, menu mobile au clavier, recherche sans résultat, ajout/retrait avec compteur, panier rempli aux cinq largeurs.
- 36 contrôles HTTP de production et vérification de l’ancien endpoint retiré (410).
- 5 contrôles HTTP du renouvellement de session et de la déconnexion avec un serveur Auth simulé localement.
- Inspection visuelle de l’accueil, de la boutique, d’une fiche, du contact, du panier et de l’administration. Le débordement du bouton radio de livraison et le contraste du bouton de retrait du panier ont été corrigés.

Les vérifications utilisent une copie de production isolée avec le catalogue de test, sans accès aux clients ni paiement ou envoi réel. Les captures administratives utilisent des données de test dans un environnement de rendu isolé ; elles ne démontrent pas une connexion à un compte réel. Les contrôles HTTP finaux utilisent les véritables gardes d’accès du dépôt.

Les rapports et captures se trouvent dans `outputs/ui-v2-2026-09-09/`. Les images absentes du catalogue de test apparaissent comme indisponibles ; les photographies existantes des vrais produits restent prises en charge. Ces essais ne constituent pas une certification d’accessibilité ni une validation sur Safari et Firefox.

## Reproduire les contrôles locaux

Préparer la copie avec `node tests/prepare-production-check.mjs`. Dans `work/urgent-production-check`, définir `KAYART_DATA_SOURCE=mock`, `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3108`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=fixture-only`, puis exécuter `node ../../node_modules/next/dist/bin/next build` et `node ../../node_modules/next/dist/bin/next start -p 3107`. Cette copie ne reçoit aucun fichier d’environnement du projet.

Depuis la racine, lancer `node tests/production-http.mjs` et `node tests/session-refresh-http.mjs`. Le second script démarre lui-même le double Auth local sur le port 3108. `KAYART_HTTP_REPORT_DIR` permet de choisir le dossier du rapport du premier script.

Les scripts `tests/ui-browser.mjs` et `tests/capture-ui.mjs` attendent un Chrome de test dédié, démarré en mode headless avec `--remote-debugging-address=127.0.0.1 --remote-debugging-port=9224` et un profil séparé, ainsi que l’application locale sur le port 3107. Ne pas utiliser un profil personnel. Exemples :

```text
node tests/ui-browser.mjs
node tests/capture-ui.mjs 1440 / home-desktop
node tests/capture-ui.mjs 390 / home-mobile
node tests/capture-ui.mjs 860 /panier cart-tablet --filled-cart
```

L’option `--filled-cart` utilise uniquement la référence du catalogue de test et enlève ensuite ce panier du profil de test. Arrêter le serveur et le navigateur dédiés à la fin. Les nouveaux scripts écrivent par défaut dans `outputs/latest-verification/` ; `KAYART_HTTP_REPORT_DIR` permet un dossier daté. `npm run test:production` automatise désormais la copie, le build et les tests HTTP.
