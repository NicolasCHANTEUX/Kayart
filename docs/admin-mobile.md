# Administration compacte — 13 septembre 2026

Le tableau de bord utilisait encore deux colonnes sur téléphone : le sélecteur `.admin-page .admin-grid` prenait le dessus sur la règle mobile `.admin-grid`. Les cartes étroites cumulaient les grands espacements des cartes publiques et des descriptions longues.

Les raccourcis du tableau de bord utilisent désormais une seule colonne jusqu’à 720 px, avec des titres courts, une description et un compteur. Les quatre destinations et les compteurs issus du serveur restent disponibles. Le rappel sur les réservations de stock des commandes Stripe de test reste affiché.

La navigation mobile occupe deux rangées de trois liens. Les filtres produits utilisent deux colonnes. Chaque produit regroupe son identité et les actions sur la première ligne, la catégorie, le type et le statut sur la deuxième, puis le prix et le stock sur la troisième. Les noms longs peuvent agrandir ces lignes. Les sept informations restent disponibles, les libellés de colonnes restent accessibles aux lecteurs d’écran et le nom ouvre la modification. Les menus d’actions conservent une cible de 44 × 44 px. Les formulaires, demandes et commandes utilisent des espacements réduits. Les six étapes du formulaire produit tiennent sur deux rangées, les champs visibles restent à 16 px et les boutons principaux à au moins 44 px.

Le champ fichier masqué du formulaire produit reprenait la largeur des champs visibles et provoquait un débordement horizontal. Sa taille masquée est maintenant préservée, sans modifier l’ajout d’images.

## Vérification

- ESLint sur les deux composants modifiés et vérification TypeScript réussis.
- 25 vues contrôlées dans Chrome : tableau de bord, produits, commandes, demandes et formulaire produit, à 320, 390, 720, 860 et 1 440 px. Aucun débordement horizontal de page.
- Les quatre raccourcis occupent environ 293 px en hauteur sur téléphone.
- Après le second ajustement, les produits de test courants occupent 121 à 126 px par carte sur téléphone, contre 265 à 305 px auparavant. Vérification supplémentaire sur six largeurs, avec prix remisés, service, noms et références longs, et liste vide : `outputs/ui-products-dense-2026-09-13/`.
- Menus produits vérifiés à 320, 390, 860 et 1 440 px : ouverture, position, lien de modification, fermeture par Échap et clic extérieur, ouverture puis annulation des dialogues de stock et d’archivage.

Captures et mesures : `outputs/ui-admin-compact-2026-09-13/`. Les vues utilisent une copie isolée avec des services de lecture remplacés par des données de test. Aucune session réelle ni donnée client utilisée, aucune modification de stock ou de commande envoyée. Les gardes d’administration et les actions serveur de l’application restent inchangées. Cette recette Chrome ne remplace pas une vérification physique sur Safari ou Android.

Le favicon fourni par le propriétaire est conservé sans transformation dans `src/app/favicon.ico`. Il est servi à `/favicon.ico` et déclaré automatiquement dans les métadonnées Next.js. Le fichier reçu en HTTP a été comparé octet par octet à l’original, dans la copie de test et sur l’aperçu local principal.
