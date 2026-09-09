# KayArt — Suite des corrections V1

Travaux commencés le 8 et vérifiés le 9 septembre 2026. Ce suivi complète l’audit du 7 septembre et le premier lot de sécurité. Il tient compte des règles de livraison, légales et Stripe communiquées par le propriétaire. Il ne constitue pas une déclaration de complétude à 100 %.

**Suivi du 9 septembre :** le déploiement Production `v11.2` est désormais confirmé réussi ; sa recette HTTP est bloquée par le SSO Vercel. Le workflow d’expiration et trois tests supplémentaires sont préparés (42 tests passent), mais le workflow nécessite encore les réglages et secrets du compte de test. Le rôle PostgreSQL reste absent faute de `CREATEROLE`. Voir le [suivi d’activation des priorités](../../docs/activation-priorites.md) pour l’état le plus récent.

## Réalisé

| Domaine | Résultat |
|---|---|
| Demandes clients | Formulaires contact, réparation et sur-mesure avec validation serveur, protection anti-spam persistante, prévention des doubles soumissions et confirmation après enregistrement |
| Photos de réparation | Jusqu’à 3 photos de 1 Mo, décodées/reconverties en WebP ; bucket privé et route de lecture réservée aux administrateurs |
| Administration des demandes | Liste paginée, filtres par type/état, détail et photos, changement d’état protégé contre les modifications concurrentes |
| Panier | Ajout depuis les produits éligibles, conservation locale des références/quantités, modification/suppression, vérification serveur des prix et disponibilités |
| Livraison | Zones et tarifs administrables, exclusions postales et mode de transport par produit ; France initialisée sans prix et désactivée, retrait gratuit sur rendez-vous |
| Checkout test | Checkout Stripe hébergé, montants calculés côté serveur, adresses et nom conservés, aucune clé réelle ou fictive intégrée au code |
| Stock et paiement | Réservation atomique, reprise idempotente, annulation protégée contre une requête tardive, libération après confirmation Stripe, webhook signé et journal des événements contre les doublons |
| Suivi des commandes | Séparation simulations internes / commandes Stripe test, coordonnées réservées à l’admin, préparation puis retrait/expédition et clôture après paiement confirmé |
| Échecs et expiration | Route périodique protégée, rotation des tentatives en erreur, conservation prudente du stock en cas de réponse Stripe ambiguë |
| Pages légales | Configuration dédiée sans identité inventée ; vrais HTTP 404 et liens masqués tant que données complètes et approbation manquent ; conditions standard et sur-mesure séparées |
| Base | Migrations demandes et checkout appliquées ; 20 tables applicatives sous RLS, sans accès direct `anon`/`authenticated` |
| Dépendances | Next.js passé de 15.5.22 à **15.5.25** à la suite du nouvel audit ; SDK Stripe 22.6.1 |

Les contrôles d’accès, prix exacts, attributs préservés, archivage, images produits et restrictions du simulateur du premier lot restent couverts par les tests.

## À traiter en urgence avant exploitation

| Priorité | Reste concret | État / action |
|---|---|---|
| P0 déploiement | Mettre en ligne le correctif Next.js et les protections finales | Les modifications de ce lot sont dans le workspace ; aucun déploiement de ce code final n’a été effectué par l’agent |
| P1 sécurité | Remplacer la connexion PostgreSQL applicative trop privilégiée | Script et politiques prêts, rôle non créé : le `DIRECT_URL` disponible n’a pas `CREATEROLE`. Configurer un accès de gestion puis appliquer la [procédure](../../docs/runtime-role-activation.md) |
| P1 validation | Exercices du vrai parcours Stripe en mode test | Compte KayArt et variables non fournis ; aucun appel de paiement au compte Stripe ni transaction financière effectués. Recette sur base isolée indispensable |
| P1 exploitation | Programmer expiration et surveiller erreurs | Endpoint prêt ; cron distant, alertes, webhooks et secrets restent à configurer sur l’hébergement |
| P1 juridique | Fournir et valider les informations réelles | Pages volontairement non publiées. Compléter aussi bases, durées et destinataires dans l’information des formulaires avant exploitation commerciale |
| P1 métier | Valider transporteur et frais réels | Livraison automatique volontairement inactive. Ajouter les vrais tarifs, puis qualifier les produits expédiables |
| P1 recette | Contrôler le déploiement et les sessions réelles | Recette visuelle, mobile, compte admin/client, session expirée, paiements concurrentiels sur une vraie base de test ; aucune session utilisateur privée n’a été utilisée |

Les avis de sécurité ayant motivé la mise à jour sont [l’exécution de code sur hébergement Windows](https://github.com/advisories/GHSA-p293-qw3h-jr36) et [l’optimisation AVIF](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4). L’audit de dépendances détecte une version concernée ; il ne prouve pas une exploitation du site.

## Suite pour une application complète

1. **Vente réelle** : adapter le parcours au compte de l’entité confirmée, acceptation/versionnement des CGV, informations fiscales et facturation, remboursements/retours et annulations après paiement. La V1 actuelle refuse toujours les clés Stripe live.
2. **Emails** : choisir/configurer l’expéditeur, notifications de demandes/commandes, reprises et suivi de délivrabilité. Aucun envoi aux clients n’est implémenté par le changement d’état admin.
3. **Administration** : recherche et pagination des commandes au-delà des 50 dernières, historique des actions et mouvements de stock, traitement documenté des rares paiements ambigus, exports utiles.
4. **Compte et sessions** : renouvellement/révocation, cohérence des formulaires de mot de passe, recette des emails Supabase et des rôles ; ne pas confondre les nouveaux contrôles des demandes avec une révision complète de l’authentification.
5. **Catalogue** : recherche/filtres/tri publics, pagination en base, effet des catégories inactives, édition complète des imparfaits, couverture/réordonnancement des images et nettoyage des médias orphelins.
6. **Fonctions métier du cadrage** : réservations demandées à l’atelier et conversion en commande (distinctes des réservations techniques du checkout), alertes de retour en stock, devis et suivi détaillé des projets/réparations.
7. **Contenus et visibilité** : journal et administration des articles, savoir-faire/FAQ/services, photos et textes définitifs, sitemap/robots/données structurées, finitions mobile et accessibilité.
8. **Exploitation durable** : CI avec installation propre et tests, surveillance/alertes, sauvegardes et exercice de restauration, politique de conservation/purge, gestion des secrets et recette de performance mesurée. Le PWA hors ligne reste à arbitrer.

Le [rapport détaillé initial](../audit-2026-09-07/02-fonctionnalites-et-completion.md) conserve les identifiants et critères d’acceptation de ces points. Son état descriptif date d’avant les corrections : utiliser le présent suivi pour les fonctionnalités désormais réalisées.

## Vérifications et limites

- 39 tests automatisés passent : urgences, formulaires, stock/checkout, signatures Stripe locales, transitions admin, refus des clés live et blocage juridique.
- TypeScript et compilation de production sur copie isolée sans secrets passent avec Next.js 15.5.25. Le seul avertissement de build concerne les deux lockfiles dus à cette copie de test.
- 30 contrôles HTTP passent, plus l’ancien endpoint d’upload retiré en HTTP 410 : absence des marqueurs privés dans HTML/RSC, nouvelles routes admin, formulaires présents, pages légales réellement en 404, paiements désactivés sans configuration et endpoints protégés. Voir [preuve HTTP](http-verification.json) et [build](build-verification.txt).
- L’[audit npm final](npm-audit.json) ne signale aucune vulnérabilité. Ce résultat concerne les avis connus au moment du contrôle, sans constituer une certification globale de sécurité.
- Les tests de concurrence checkout utilisent une base simulée ; ils ne constituent pas une mesure de concurrence PostgreSQL réelle.
- Supabase réel : lecture des métadonnées et droits, essais SQL fictifs annulés par `ROLLBACK`, puis upload/lecture d’un WebP généré de 2 × 2 pixels. Lecture publique et anonyme refusées ; le fichier de test est supprimé et son absence vérifiée. Aucun contenu client consulté.
- `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` : aucun écart détecté. Les quatre migrations sont appliquées.
- Le contrôle Windows n’a pas pu se connecter à son composant natif ; aucun résultat de recette navigateur ni score Lighthouse n’est revendiqué.
- Aucun paiement live, email, compte client ou produit réel n’a été créé pour les essais. La connexion PostgreSQL applicative et les variables de l’hébergement n’ont pas été remplacées.

Configuration et protocole de recette : [guide V1](../../docs/checkout-test-v1.md). Preuve des protections distantes : [contrôles d’intégration](integration-verification.json).
