# État de la V1 — 13 septembre 2026

Ce document décrit le code local, y compris la refonte UI non publiée. « Implémenté » ne signifie pas « validé sur un déploiement réel ». Les dossiers `outputs/` sont des preuves datées, pas une description de l’état courant.

## Priorités, dans l’ordre

1. **Accès administrateur réel — ouverture confirmée par l’exploitant.** Le compte fourni a un rôle admin et un rattachement vers le bon utilisateur Auth confirmé ; vérifié en lecture seule le 13 septembre. Après reconnexion, l’exploitant a confirmé l’ouverture de l’administration. Les accès sont visibles et un refus affiche une explication. Aucun droit n’a été modifié. La recette des écritures réelles reste distincte de cette confirmation d’accès.
2. **Recette complète — partielle, résultats archivés.** 72 tests unitaires, 64 contrôles navigateur sur build isolé, contrôles HTTP et rendu de la boutique réelle avec quatre fiches à deux largeurs sont validés. Les clés Stripe de test et le secret webhook ne sont pas configurés. Aucun test sur le service Stripe réel ni parcours d’écriture complet avec le compte réel ne peut être déclaré réussi.
3. **Périmètre V1 — inventorié ci-dessous.** Les états du schéma sans parcours applicatif sont distingués des fonctionnalités livrées.
4. **Consolidation réalisée — code, styles, documentation et CI.** Lint réel, nettoyage des avertissements, modules CSS conservant la cascade, recette HTTP automatisée et guides actifs sont en place. La suppression progressive des styles historiques et la mise à niveau coordonnée de Next/ESLint restent des travaux distincts.
5. **Ouverture commerciale — bloquée volontairement.** Informations légales, tarifs et entité Stripe à fournir. Le paiement réel et l’avancement de commandes réelles nécessitent aussi du code et une recette dédiée.

## Fonctionnalités et limites

| Domaine | État dans le code | Ce qu’il reste à valider ou développer |
| --- | --- | --- |
| Accueil, atelier, navigation | Implémentés, refonte locale | Recette sur le navigateur de l’exploitant et publication de la version validée |
| Boutique | Recherche, tris, filtres, pagination | Recette avec le catalogue et les photos définitifs |
| Produits neufs, imparfaits, occasion | Modélisés et gérés ; modèle d’origine, défauts et images propres | Qualité et exhaustivité des fiches réelles |
| Administration produits | Création, édition, visibilité, stock, archivage | Parcours complet avec le vrai compte admin |
| Médias produits | Envoi WebP, contrôle des images, couverture et ordre | Purge physique des médias orphelins et politique de conservation |
| Authentification | Connexion, inscription, renouvellement, déconnexion, récupération | Recette réelle des emails de récupération et de la session admin |
| Droits admin | Contrôlés côté serveur par identifiant Auth | Ne jamais recréer une promotion automatique par email |
| Contact | Validation, enregistrement, protection anti-abus | Recette de bout en bout ; aucun accusé de réception email applicatif automatique |
| Réparation | Demande et photos privées, suivi des statuts | Diagnostic, devis et échanges réalisés hors application |
| Sur-mesure | Demande structurée et suivi | Pas de configurateur produit ni de devis chiffré automatique |
| Administration demandes | Listes, filtres, pagination, changements de statut avec contrôle de conflit | Changer un statut n’envoie pas de réponse au client |
| Panier | Persistance locale, recalcul serveur, quantités, compteur | Recette de paniers représentatifs avec le catalogue final |
| Livraison | Zones, pays/préfixes, tarifs administrables, retrait gratuit | Frais réels non renseignés ; France inactive sans tarif ; transports particuliers sur devis |
| Checkout Stripe test | Réservation de stock, idempotence, session hébergée | Clés du compte KayArt de test et webhook à configurer ; recette Stripe réelle manquante |
| Paiement et stock | Webhook signé, confirmation, libération/validation des réservations | Les tests isolés ne prouvent pas la livraison effective des webhooks Stripe |
| Expiration et reprise | Annulation, réconciliation, workflow désactivé par défaut | Activer et observer uniquement sur une cible de test explicitement configurée |
| Gestion des commandes | Recherche, listes et pagination | Préparation/retrait/expédition implémentés uniquement pour commandes Stripe de test payées |
| Vente réelle | Refusée explicitement | Ajouter un mode production, ses contrôles légaux et ses parcours sans libellés de test après validation métier |
| Remboursements | Statuts présents | Pas de workflow Stripe de remboursement ni de gestion des remboursements partiels |
| Espace client | Authentification disponible | Pas de tableau de bord client, historique personnel ou suivi de commande complet |
| Notifications | Pas de service email transactionnel métier | Choix du fournisseur, modèles, destinataires, reprise en cas d’échec ; Auth Supabase reste distinct |
| Journal | Page d’attente ; modèle BlogPost | Publication, édition et affichage d’articles absents ; hors lancement minimal possible |
| Alertes de stock | Modèle StockAlert seulement | Inscription, désinscription, envoi et suivi absents ; hors V1 minimale |
| Audit des actions | Modèle AuditLog seulement | Écriture systématique et consultation absentes ; chantier de traçabilité distinct |
| Réservations | CheckoutHold actif dans le paiement | Le modèle Reservation ne constitue pas un parcours autonome de réservation client |
| Pages légales | Structure et configuration centralisées ; publication bloquée | Identité réelle, textes finalisés et approbation ; distinguer standard et réellement personnalisé |
| Référencement | Métadonnées, robots et sitemap avec garde d’activation | Domaine canonique et décision d’indexation ; aucune promesse de classement |
| PWA | Manifest et métadonnées | Pas de fonctionnement hors ligne ni de notifications push |
| Exploitation | Scripts de contrôle et workflow de réconciliation | Recette de restauration, alertes opérationnelles, droits runtime minimaux et procédure d’incident |

## Critères de passage à l’ouverture

- Le bon compte ouvre et utilise produits, commandes et demandes ; les comptes clients restent refusés.
- Les produits de lancement disposent de descriptions, photos, prix, stock et mode de transport validés.
- Un parcours Stripe de test complet réussit : paiement, webhook, stock, commande, expiration et reprise ; le traitement des remboursements est décidé et testé selon le périmètre retenu.
- Les informations réelles et conditions commerciales sont validées ; aucun tarif, délai, adresse ou identité juridique n’est inventé.
- Le mode réel est développé et testé séparément. Aucune simple substitution de clé Stripe ne doit contourner les protections actuelles.
- La version publiée et la configuration de déploiement font l’objet d’une recette finale ; les résultats locaux ne valent pas validation de production.

## Informations attendues

L’exploitant renseigne les secrets directement dans l’environnement, jamais dans un chat ou dans Git. Sont encore attendus : compte Stripe KayArt de test, paramètres webhook, identité et textes légaux réels, adresse de retrait utilisable et tarifs de transport validés. Les règles déjà choisies restent acquises : retrait gratuit sur rendez-vous, aucun seuil de livraison gratuite, Corse/outre-mer/international et transports particuliers sur devis.
