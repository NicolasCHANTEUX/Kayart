# Déploiement et ouverture progressive

La version actuelle est limitée au checkout Stripe de test. Ne pas remplacer les clés par des clés réelles : le code refuse le mode réel, et plusieurs parcours de gestion sont explicitement limités aux commandes de test.

## Recette avant publication

1. Valider lint, tests, types et `npm run test:production`. Ce contrôle utilise une copie isolée sur 3107, et un double Auth sur 3108 ; aucune donnée client n’est utilisée.
2. Sur l’environnement de recette réel, vérifier connexion admin, produits, demandes et commandes avec un compte autorisé. Les essais d’écriture utilisent des données de recette identifiables, pas les commandes clients.
3. Configurer directement les clés Stripe de test, le webhook et l’URL de recette. Suivre [la procédure Stripe](checkout-test-v1.md). Vérifier paiement, webhook, stock, réessai, expiration et suivi de commande. Ne jamais déclarer ce parcours validé à partir du seul simulateur.
4. Vérifier les vrais contenus, les photos, prix, stocks et modes de transport des produits de lancement.
5. Contrôler les droits runtime, les migrations appliquées, le stockage privé, les alertes et la possibilité de restaurer une sauvegarde.

## Conditions commerciales

Le retrait reste gratuit, sur rendez-vous. La livraison n’apparaît que pour les produits expédiables et un tarif administré valide. Aucun seuil de gratuité. Corse, outre-mer, international et transports particuliers restent sur devis selon les règles choisies.

L’exploitant fournit l’identité réelle, les textes juridiques finalisés, l’adresse utilisable et les tarifs validés. Les coordonnées fiables restent KayArt, contact.kayart@gmail.com et +33 6 64 63 15 43. Ne pas utiliser d’anciennes données de maquette. La publication juridique exige à la fois des champs complets et l’approbation explicite dans la configuration.

## Passage au paiement réel

Un lot de développement distinct doit ajouter un mode production, les contrôles de publication et conditions commerciales, les textes de commande réelle, les transitions de préparation/expédition et le périmètre retenu de remboursement/notifications. Les signatures, prix serveur, réservations et garanties d’idempotence restent indispensables. Le compte qui encaisse doit correspondre à l’activité KayArt.

L’indexation et la réconciliation périodique restent désactivées jusqu’à leur configuration et validation. Publier ensuite une version identifiée, avec un nombre limité de produits réels, puis vérifier le site effectivement déployé. Le lot local du 13 septembre n’a lancé aucun déploiement, activation de paiement ou changement de base distante.

## Preuves

`outputs/latest-verification/` reçoit les résultats temporaires. Archiver uniquement les preuves utiles et non sensibles avec la version et la portée de la recette. Préférer des messages de commit descriptifs ; ne pas réécrire l’historique partagé pour renommer les anciennes versions.
