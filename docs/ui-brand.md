# Identité KayArt — 13 septembre 2026

Cette version remplace la palette vert pétrole de `ui-compact.md`. Elle s’inspire des trois références visuelles fournies par le propriétaire : monogramme K, bandeau Team KayArt et image indisponible.

## Direction

- Bleu `#105bc6`, jaune `#ffd500`, rouge `#c80703`, violet `#883a7d`, anthracite et blanc.
- Lettres grasses et inclinées pour la signature et l’accroche, diagonales et aplats géométriques.
- La couleur se concentre sur l’identité, les actions et les services. Les textes courants, formulaires et fiches produits conservent des surfaces claires.
- Les dimensions compactes de la version précédente sont conservées, avec boutons principaux de 44 px et champs mobiles à 16 px.
- Header, accueil, footer, icône de l’application, états sans image et couleurs des pages publiques et administratives sont harmonisés.

Les fichiers SVG dans `public/brand/` sont des interprétations vectorielles des références visibles, pas les fichiers originaux de la marque. La signature typographique est une adaptation pour l’interface. `kayart-brand.tsx` centralise son usage. Le monogramme décoratif de l’accueil n’est pas une image produit.

L’image manquante reprend l’icône et les quatre couleurs, dans une composition plus calme adaptée aux petites cartes. Les photographies disponibles restent prioritaires. Les erreurs de chargement utilisent le même état de remplacement.

## Recette

Résultats et captures : `outputs/ui-brand-2026-09-13/`.

- ESLint, TypeScript et 72 tests unitaires.
- Compilation de production, 36 contrôles HTTP plus l’endpoint retiré, et 6 contrôles de session avec un serveur Auth simulé.
- 64 contrôles Chrome sur onze pages, aux largeurs 320, 390, 768, 860 et 1 440 px, y compris menu au clavier, filtres et panier.
- Vérification visuelle de l’accueil mobile et ordinateur, boutique, fiche produit, contact et administration.
- Administration rendue statiquement à partir des vrais composants avec des données de test ; aucun contournement d’authentification ajouté à l’application.

Les tests utilisent une copie isolée sans les fichiers d’environnement réels. Ils n’envoient ni demande client ni paiement. Les formulaires non configurés y affichent leur indisponibilité attendue. Les captures ne constituent pas une vérification physique sur iPhone/Safari.

Cette version reste locale, sans publication GitHub ou Vercel. Les règles métier, droits administrateur, configuration de livraison, paiement et pages légales sont conservés.
