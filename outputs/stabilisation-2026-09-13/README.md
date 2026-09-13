# Stabilisation V1 — 13 septembre 2026

Travail local sur la base de `649c6b4`, incluant la refonte UI non publiée. Aucun déploiement, paiement réel, envoi de message client, changement de rôle ou migration distante effectué.

## Résultats

- Compte administrateur : rôle et identité liée vérifiés en lecture seule ; l’exploitant a confirmé l’ouverture de l’administration après reconnexion. Les écritures avec ce compte n’ont pas été simulées sur les données réelles.
- Refus d’accès : un client connecté demandant l’admin reçoit une explication avec l’identité connectée et une possibilité de déconnexion ; la redirection silencieuse vers l’accueil est supprimée.
- ESLint réel ajouté, règles Next/React/TypeScript et zéro avertissement ; variables inutiles supprimées, dépendances de hooks stabilisées, affichage d’images centralisé.
- 72 tests unitaires réussis et TypeScript valide.
- 64 contrôles navigateur réussis sur le build isolé, à cinq largeurs : pages publiques, navigation mobile, recherche, panier et synchronisation du compteur.
- Catalogue réel en lecture seule : boutique et quatre fiches publiques, sur mobile et ordinateur, soit 10 contrôles de rendu sans débordement horizontal. Certaines fiches n’ont pas de photo ; ce n’est pas une validation de leur contenu commercial.
- Build de production et 36 contrôles HTTP réussis, ancien endpoint retiré vérifié (410), 6 contrôles Auth/session HTTP réussis avec un double local.
- Le lanceur de recette refuse un port occupé avant de tester ; vérifié sur 3107. Son environnement ne transmet que des variables système autorisées et une configuration applicative de test explicite.
- Styles répartis en modules ; arbre de règles et ordre de cascade identiques avant/après, voir `css-cascade.json`. Pas de diminution revendiquée du poids total CSS.
- README, guides architecture/sécurité/déploiement/base, index documentaire et distinction des archives actualisés. CI enrichie avec lint et recette HTTP du build isolé ; exécution distante GitHub non déclenchée dans ce lot.

## En attente

Les clés Stripe de test et le webhook ne sont pas configurés : aucune recette du service Stripe réel effectuée. Informations légales, adresse utilisable et tarifs de transport réels restent à fournir. Le mode de paiement réel, les remboursements et autres fonctions absentes sont identifiés dans [l’état V1](../../docs/v1-status.md) ; ils n’ont pas été activés artificiellement.

Les captures utilisent le catalogue de test, pas des produits ou tarifs commerciaux ajoutés à la base. Les opérations distantes de diagnostic se limitent au compte administrateur indiqué ; aucune information de connexion n’est archivée.
