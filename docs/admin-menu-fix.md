# Menu d’actions administrateur — 13 septembre 2026

## Cause reproduite

Sur `localhost:3000` en mode `next dev`, la CSP interdisait l’évaluation nécessaire au runtime de développement. Chrome signalait une `EvalError` dans `react-refresh-utils`. Le HTML était visible, mais React ne devenait pas interactif : même le menu public restait fermé après un clic. Les contrôles précédents en version compilée ne couvraient pas ce mode.

## Correctif

`next.config.ts` autorise `unsafe-eval` uniquement quand `NODE_ENV` vaut exactement `development`. La production, les tests et les valeurs absentes conservent l’interdiction. Le reste de la politique de sécurité est conservé. Cette distinction est documentée par [Next.js](https://nextjs.org/docs/app/guides/content-security-policy).

Aucun changement de rôle, de session ou de droits serveur. Aucune suppression ni modification de produit. Le menu conserve les actions Modifier, Stock, Afficher/Masquer et Archiver selon les droits et l’état du produit.

## Vérifications

- Avant : menu public fermé et `EvalError` dans le navigateur sur localhost.
- Après : menu public ouvert, aucune exception JavaScript dans le même contrôle.
- 76 tests unitaires, dont quatre cas CSP ; ESLint et TypeScript.
- Menu réel `ProductRowActions` exécuté dans le navigateur en mode développement à 320, 390, 860 et 1 440 px : menu visible et cliquable, lien Modifier correct, fermeture avec Échap et clic extérieur, ouverture puis annulation de Stock et Archivage.
- Compilation et suite HTTP de production, avec assertion supplémentaire interdisant `unsafe-eval` dans l’en-tête réellement servi.

Les essais interactifs utilisent une route créée uniquement dans `work/urgent-production-check` par `tests/prepare-admin-ui-fixture.mjs`. Elle affiche un produit de test et conserve les véritables gardes des actions serveur. Aucun formulaire de mutation n’est soumis. La route n’existe pas dans `src/app` et n’est pas destinée au déploiement.

Pour reproduire : préparer la copie isolée, lancer le générateur de fixture, démarrer cette copie avec `next dev` sur le port 3107 et un navigateur dédié avec CDP 9224, puis lancer `node tests/admin-menu-browser.mjs`. Les résultats sont dans `outputs/admin-menu-2026-09-13/admin-menu-browser.json`.
