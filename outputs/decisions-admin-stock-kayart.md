# Decisions admin et stock KayArt

Date : 14 juillet 2026

Source : rapport fonctionnel de l'ancien projet `APP-WEB-Vincent-2`.

## A conserver

- Liste administrative avec recherche par nom et SKU.
- Filtres par categorie, type de produit et stock.
- SKU unique, obligatoire et stable.
- Slug genere automatiquement depuis le nom si le champ est vide.
- Creation produit structuree par grandes sections.
- Description complete obligatoire.
- Galerie d'images produit a ajouter plus tard, avec image principale.
- Stock controle cote serveur, pas seulement dans le navigateur.
- Distinction entre produit neuf, occasion et service.
- Alertes de retour en stock pour les produits neufs en rupture, plus tard.

## A corriger par rapport a l'ancien projet

- Ne pas detecter les services par nom de categorie.
- Utiliser un type explicite `service`.
- Ne pas afficher un service comme une rupture de stock.
- Ne pas faire chevaucher les filtres `rupture` et `stock faible`.
- Ne pas supprimer definitivement un produit commercial : preferer l'archivage.
- Ne pas modifier les images avec un comportement totalement separe du reste de la fiche.
- Prevoir plus tard un historique des mouvements de stock.
- Prevoir plus tard un vrai stock reserve pour les produits d'occasion.

## Regles V1 appliquees maintenant

- `new`, `used` et `service` sont des types explicites.
- Un service a toujours `stockQuantity = null`.
- Un produit d'occasion represente une piece unique en V1 : stock maximum `1`.
- La disponibilite commerciale n'est pas modifiable depuis la liste admin.
- La liste admin permet uniquement l'ajustement rapide de la quantite de stock.
- Le stock faible correspond a `1` a `5`.
- La rupture correspond uniquement a `0`.
- Le disponible correspond a un stock superieur a `5`.
- Le SKU est obligatoire et accepte lettres, chiffres, tirets et underscores.
- La categorie est obligatoire lors de la creation.
- La description complete doit contenir au moins 10 caracteres.
- Le prix barre doit etre superieur au prix de vente.
- Un produit peut recevoir jusqu'a 6 images lors de la creation.
- Une image de couverture est choisie avec une etoile dans le formulaire.
- Le formulaire de creation est un assistant progressif : une etape reste verrouillee tant que la
  precedente n'est pas localement valide.
- Les etapes verrouillees sont grisées et non interactives, mais les valeurs deja saisies restent
  soumises au serveur.
- Les fichiers sont stockes localement dans `public/uploads/products` en V1 de developpement, avec
  leurs metadonnees en base.

## Reporte apres V1 admin catalogue

- Assistant JavaScript en quatre etapes avec validation AJAX.
- Upload et reorganisation des images.
- Remplacement du stockage local par Supabase Storage.
- Historique des mouvements de stock.
- Alertes de retour en stock.
- Reservation effective du stock d'occasion.
- Restauration automatique de stock en cas d'annulation ou remboursement.
