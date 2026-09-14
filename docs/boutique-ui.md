# Boutique — présentation du 14 septembre 2026

- Cartes blanches avec bordure fine, description limitée à deux lignes et prix/action en bas de carte.
- Ligne de 4 px bleu, jaune, rouge et violet sous chaque visuel, avec le même dégradé que le footer.
- Monogramme K discret accompagné de « Visuel indisponible » dans les cartes publiques. Les miniatures d’administration conservent leur traitement existant.
- Accès rapides avec sélection anthracite et soulignement jaune.
- Recherche toujours visible. Filtres et tri repliables jusqu’à 800 px, affichés sur ordinateur. Les champs restent soumis quand le panneau est replié.
- Critères appliqués visibles et retirables individuellement ; toute modification repart de la première page des résultats. Le formulaire est remonté après une navigation pour synchroniser ses valeurs avec l’URL.
- Sans JavaScript, les filtres restent visibles et fonctionnent par formulaire GET.

La recherche, les prix, les disponibilités et les règles de publication restent gérés par les services existants. Les styles des cartes encadrées sont limités à `.shop-page` ; la ligne et le monogramme sont aussi présents sur les cartes de l’accueil.

## Vérification

Lint et TypeScript valides. `tests/shop-browser.mjs` vérifie neuf largeurs (320 à 1 440 px), le dépliage, la soumission, la conservation des critères, leur suppression, la réinitialisation, le clavier et le fonctionnement sans JavaScript. `tests/ui-browser.mjs` couvre les parcours existants (69 contrôles).

Ces scripts utilisent Chrome dédié sur le port 9224 et la copie isolée du projet avec catalogue fictif sur le port 3107. Ne pas les diriger vers la production. Pour conserver les précédents rapports, définir `KAYART_HTTP_REPORT_DIR` avant leur exécution.

Captures du catalogue local et rapports : `outputs/ui-shop-2026-09-14/`.
