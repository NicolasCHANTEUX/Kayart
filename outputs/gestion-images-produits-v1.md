# Gestion des images produits V1

Date : 15 juillet 2026

## Fonctionnement actuel

- L'administrateur peut ajouter jusqu'a 6 images lors de la creation d'un produit.
- Les images peuvent etre selectionnees depuis les fichiers ou deposees par drag and drop.
- Une etoile permet de choisir l'image de couverture.
- La couverture est l'image utilisee dans les apercus catalogue et admin.
- Les metadonnees sont enregistrees dans Supabase via Prisma.
- Les fichiers sont stockes localement dans `public/uploads/products`.

## Limites assumees

- Cette V1 est adaptee au developpement local.
- Pour une mise en production, il faudra migrer les fichiers vers Supabase Storage ou un stockage objet.
- La modification d'images apres creation n'est pas encore implementee.
- La reorganisation d'une galerie existante n'est pas encore implementee.

## Prochaine evolution

Ajouter une page de modification produit avec :

- ajout/suppression d'images ;
- changement de couverture ;
- reorganisation par glisser-deposer ;
- archivage du produit plutot que suppression definitive.
