# Corrections urgentes — 8 septembre 2026

Les corrections du code sont présentes dans le projet local. **Elles ne sont pas encore déployées sur l’hébergement.** Les protections de la base Supabase et du bucket ont été appliquées après autorisation explicite. Aucun produit, client, réservation ou commande n’a été supprimé.

## Suivi des urgences du rapport initial

| Point | Correction réalisée | État / limite |
|---|---|---|
| U02 — Données admin exposées | Contrôle admin avant chaque lecture et mutation privée du service ; les modèles de base non publiés sont exclus des réponses publiques. | Corrigé dans le code. Contrôle HTTP HTML/RSC avec données privées fictives réussi. |
| U01 — Association de comptes par email | Rôles recherchés uniquement par identifiant Auth vérifié. Suppression de l’association automatique et de l’écriture de rôle lors de l’inscription. | Corrigé dans le code. Vérifier le rattachement explicite des comptes admin existants avant déploiement. |
| U03 — Redirection externe | Validateur partagé rejetant origines externes, antislashs, contrôles et encodages ambigus. | Corrigé dans le code et testé. |
| U04 — Prix altérés | Saisie décimale, conversion stricte en centimes, conservation des valeurs exactes enregistrées lorsque prix/remise ne changent pas. | Corrigé dans le code. Tests incluant 0,01 €, 19,90 € et remises non entières. |
| U05 — Caractéristiques perdues | Seuls Poids et Dimensions sont remplacés ; les autres caractéristiques sont conservées. Description du défaut disponible à l’édition. | Corrigé dans le code et testé. |
| U06 — Occasion assimilée au neuf imparfait | Type `used` restauré dans les types, formulaires, filtres et affichages. | Corrigé dans le code et testé. |
| U07 — Stock et visibilité | Masquer/afficher ne remplace plus Réservé ou Sur commande. Stock nul accepté de manière cohérente. Publication des brouillons par la fiche. Les pages produit relisent leur état à chaque requête. | Corrigé dans le code. Bouton de produit réservé orienté vers l’atelier, sans promesse d’achat. |
| U08 — Suppressions et paiements | Archivage des produits ; conservation des réservations, médias et liens historiques. Simulateur désactivé par défaut. Actions limitées aux marqueurs de simulation et absence de paiement Stripe ; paiement idempotent ; annulation conservant l’historique. | Corrigé dans le code. Les anciennes commandes `ADM-` ne sont pas assimilées à des tests. Un simulateur n’effectue aucun paiement ni mouvement de stock. |
| U09 — Images non vérifiées | Envoi serveur authentifié, corps borné, décodage réel, refus des animations, conversion WebP et suppression des métadonnées. Reçu signé lié à l’admin et valable une heure. Six images au total avec celles conservées. Ancien endpoint de signature retiré. | Code corrigé ; bucket réellement limité à 4 Mo/WebP. Les fichiers historiques n’ont pas été réanalysés. |
| U10 — Base insuffisamment protégée | RLS sur 16 tables métier, révocation des accès anon/authenticated, neuf contraintes CHECK, unicité des emails normalisés et des couvertures, neuf triggers de date. Baseline et migration enregistrées. | Appliqué et vérifié sur Supabase. **Le rôle applicatif privilégié reste à remplacer.** |
| U11 — Ressources bloquées par CSP | Domaines Unsplash et Google Fonts autorisés dans les directives correspondantes. | Code corrigé ; en-tête vérifié par HTTP. |
| U12 — Parcours de lancement absents | Retrait de la fausse action Ajouter au panier. Contact email/téléphone utilisable, avec produit/référence préremplis. Page panier explicitant le fonctionnement actuel. | Atténuation seulement. Commerce complet et contenus légaux restent ouverts. |
| U13 — Dépendances | Mise à jour des dépendances transitives vulnérables et de Sharp, sans passage majeur de Next ou Prisma. | Audit npm incluant le développement : **0 vulnérabilité signalée** le 8 septembre 2026. |

## Vérifications effectuées

- 15 tests automatisés réussis : accès refusés et autorisés, absence de réassociation de comptes, redirections, centimes, attributs, images, archivage, visibilité et sécurité des simulations.
- TypeScript et validation du schéma Prisma réussis.
- Compilation Next de production réussie dans une copie isolée, sans fichier d’environnement ni donnée client. La copie et le serveur de test ont été retirés après vérification.
- 15 contrôles HTTP HTML/RSC/contact/upload réussis, plus le contrôle 410 de l’ancien endpoint. Les marqueurs de brouillon, commande, email et note privée fictifs sont absents des réponses non authentifiées.
- Base distante : aucun conflit avant application ; contraintes validées, RLS actif et accès anon/authenticated absents sur les 16 tables métier ; neuf triggers présents. Comparaison Prisma sans différence et historique des deux migrations à jour.
- Aucune vérification visuelle interactive ni scénario avec un vrai compte admin n’a été réalisé. Les mutations applicatives ont été testées sur des doubles de base en mémoire ; aucun paiement réel n’a été tenté.

Preuves : [HTTP](http-verification.json), [audit npm](npm-audit.json), [métadonnées Supabase après application](database-verification.json). Tests reproductibles dans `tests/`; procédures dans `docs/database-hardening.md`.

## Travaux encore nécessaires

1. **Déployer le code corrigé.** Le bucket est déjà limité au WebP : l’ancien formulaire en ligne peut refuser les JPG/PNG tant que le nouveau convertisseur n’est pas déployé. Les failles du code de l’ancienne version en ligne ne sont pas corrigées par un changement local.
2. **Isoler le compte PostgreSQL du serveur.** La connexion configurée possède encore `BYPASSRLS` et `CREATEDB`. Créer un rôle applicatif distinct, sans ces privilèges, avec droits/politiques dédiés ; conserver le rôle de gestion uniquement pour les migrations, puis changer `DATABASE_URL` dans l’hébergement et tester les parcours. Ne pas modifier aveuglément le rôle géré par Supabase.
3. **Vérifier les administrateurs et les images historiques.** Contrôler les rattachements Auth attendus et le contenu des anciens objets ; l’ancienne association automatique par email est volontairement supprimée. Les anciennes URL signées doivent expirer.
4. **Terminer U12.** Panier réel, checkout, Stripe et webhooks idempotents, réservations/stock, livraison et emails transactionnels ; formulaires métier et suivi ; informations d’entreprise et textes légaux validés. Le contact direct est maintenant utilisable, mais il ne constitue pas une boutique avec paiement en ligne.
5. **Effectuer la recette sur l’hébergement.** Connexion admin, création/édition/archivage d’une fiche test, réception des images converties, visibilité publique et rendu mobile. Réaliser ces écritures sur un environnement de recette ou avec des données de test identifiées.

Le contrôle automatique avait refusé l’écriture distante sur la base de l’ancienne autorisation de lecture seule. L’utilisateur a ensuite explicitement autorisé le correctif ; l’application et ses vérifications ont réussi. Il n’y a plus d’autorisation Supabase en attente pour ce périmètre.

Référence technique consultée pour les limites du décodage : [documentation officielle Sharp](https://sharp.pixelplumbing.com/api-constructor/).
