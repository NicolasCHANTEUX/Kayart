# Organisation des styles

`src/app/globals.css` et `src/app/atelier-v2.css` sont les points d?entr?e, import?s dans cet ordre par le layout. Leurs imports sont ordonn?s ; ne pas les trier alphab?tiquement.

- `legacy/` : structures existantes de pages, formulaires, administration et responsive.
- `atelier/` : fondations, en-t?te, accueil/pied de page, catalogue, formulaires, administration et responsive de la V2.
- `atelier/foundations.css` : couleurs et composants g?n?raux du th?me actuel.
- `atelier/compatibility.css` : ajustements face aux s?lecteurs historiques plus sp?cifiques. Cette dette est identifi?e ; ne pas y accumuler de nouveaux correctifs.

Le d?coupage du 13 septembre conserve exactement l?ordre des s?lecteurs, d?clarations et media queries. La comparaison des arbres CSS est dans `outputs/stabilisation-2026-09-13/css-cascade.json`. Le rangement s?am?liore, mais la quantit? de CSS charg?e ne diminue pas ? elle seule.

Modifier le module responsable du composant puis v?rifier les largeurs de recette. Une suppression de styles historiques n?cessite une comparaison composant par composant : un s?lecteur peut ?tre dynamique ou servir ? un ?tat de formulaire absent des captures.
