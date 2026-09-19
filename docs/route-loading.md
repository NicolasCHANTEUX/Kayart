# Fond pendant les transitions de page

Le fond photographique de l’accueil et de la boutique est défini dans `src/styles/atelier/page-background.css` : même image, même cadrage fixe, flou de 28 px sur ordinateur et 18 px sur petit écran.

`PageBackground`, monté dans le layout persistant, conserve le fond de la dernière page affichée pendant que le composant `loading.tsx` est visible. Il synchronise ensuite l’attribut `data-page-background` du conteneur avec le contenu réellement affiché. Les pages temporairement masquées par Suspense sont ignorées. L’observateur est limité au contenu principal et nettoyé au démontage.

Le premier rendu HTML utilise les classes de page existantes avant l’hydratation. L’écran de chargement est transparent ; les autres pages conservent leur fond clair une fois chargées. La photographie n’est pas généralisée à tout le site.

## Régression

Vérification visuelle effectuée le 14 septembre 2026 sur huit transitions à 390 et 1 440 px : photo vers photo, photo vers fond clair, fond clair vers photo et fond clair vers fond clair. Le fond était maintenu pendant l’attente et son état final était correct. Rapports et captures archivés : `outputs/ui-route-background-2026-09-14/`. L’outil de test (copie isolée avec latence artificielle de deux secondes) a été utilisé une fois pour cette recette puis retiré.

Lint et vérification TypeScript validés. Aucune latence artificielle n’est ajoutée à l’application principale.
