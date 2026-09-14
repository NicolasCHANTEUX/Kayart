# Fond pendant les transitions de page

Le fond photographique de l’accueil et de la boutique est défini dans `src/styles/atelier/page-background.css` : même image, même cadrage fixe, flou de 28 px sur ordinateur et 18 px sur petit écran.

`PageBackground`, monté dans le layout persistant, conserve le fond de la dernière page affichée pendant que le composant `loading.tsx` est visible. Il synchronise ensuite l’attribut `data-page-background` du conteneur avec le contenu réellement affiché. Les pages temporairement masquées par Suspense sont ignorées. L’observateur est limité au contenu principal et nettoyé au démontage.

Le premier rendu HTML utilise les classes de page existantes avant l’hydratation. L’écran de chargement est transparent ; les autres pages conservent leur fond clair une fois chargées. La photographie n’est pas généralisée à tout le site.

## Régression

`tests/prepare-route-loading-fixture.mjs` prépare la copie isolée habituelle puis ajoute deux secondes de latence à l’accueil, à la boutique et au contact **uniquement dans cette copie**. Lancer cette copie en mode mock sur le port 3107, puis `node tests/route-background-browser.mjs` avec le navigateur de test dédié sur le port 9224.

Le test observe chaque image rendue pendant huit transitions à 390 et 1 440 px : photo vers photo, photo vers fond clair, fond clair vers photo et fond clair vers fond clair. Il vérifie le maintien du fond pendant l’attente et son état final. Rapports et captures : `outputs/ui-route-background-2026-09-14/`.

Lint et vérification TypeScript validés. Aucune latence artificielle n’est ajoutée à l’application principale.
