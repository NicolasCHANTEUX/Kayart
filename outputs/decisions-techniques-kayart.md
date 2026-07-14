# Décisions techniques - KayArt

Date : 13 juillet 2026  
Statut : recommandations initiales à valider avant développement

## 1. Stratégie générale

Recommandation : reconstruction complète.

L'ancien projet doit être utilisé comme inventaire fonctionnel, pas comme base technique.

Le nouveau projet doit viser :

- simplicité de maintenance ;
- sécurité ;
- performance ;
- SEO ;
- excellente expérience mobile ;
- administration claire ;
- capacité d'évolution.

## 2. Stack recommandée

### Option recommandée

- Next.js
- React
- TypeScript
- PostgreSQL
- Supabase ou PostgreSQL hébergé
- Prisma ou Drizzle
- Stripe Checkout
- stockage objet pour les médias
- email transactionnel dédié
- PWA progressive

Cette option permet de construire un monolithe moderne : site public, routes serveur, admin, API interne, SEO et PWA dans une même base cohérente.

### Pourquoi Next.js

Next.js est adapté car le projet a besoin :

- de pages publiques rapides ;
- de SEO ;
- de fiches produits indexables ;
- d'articles indexables ;
- de rendu serveur ou hybride ;
- d'une interface admin en React ;
- de routes serveur pour les actions métier ;
- d'une base compatible PWA ;
- d'un déploiement simple.

### Pourquoi TypeScript

TypeScript est recommandé pour :

- réduire les erreurs ;
- sécuriser les modèles de données ;
- mieux maintenir le projet ;
- faciliter les refactorings ;
- clarifier les contrats entre UI, serveur et base.

### Pourquoi PostgreSQL

PostgreSQL est recommandé car le projet contient des données relationnelles :

- produits ;
- catégories ;
- images ;
- commandes ;
- lignes de commande ;
- clients ;
- demandes ;
- réservations ;
- articles ;
- statuts ;
- médias.

## 3. Supabase

Supabase est une bonne option pour démarrer car il fournit :

- PostgreSQL ;
- authentification ;
- stockage de fichiers ;
- tableau de bord ;
- API ;
- Row Level Security ;
- offre gratuite ou peu coûteuse au démarrage.

Supabase peut gérer :

- l'auth admin ;
- plus tard l'auth client ;
- magic link ;
- Google ;
- Apple ;
- stockage d'images ;
- base relationnelle.

Point d'attention : même avec Supabase, les règles d'accès doivent être conçues proprement. La sécurité ne doit pas reposer uniquement sur l'interface.

## 4. ORM

Deux options principales :

### Prisma

Avantages :

- très lisible ;
- migrations claires ;
- excellent typage ;
- populaire ;
- productif.

Inconvénients :

- couche parfois un peu lourde ;
- certaines requêtes SQL avancées sont moins naturelles.

### Drizzle

Avantages :

- proche du SQL ;
- léger ;
- très typé ;
- bon contrôle.

Inconvénients :

- demande un peu plus de rigueur ;
- moins "clé en main" que Prisma pour certains profils.

Recommandation initiale : Prisma si l'objectif est d'avancer vite avec une structure très lisible. Drizzle si l'on veut une approche plus proche SQL.

## 5. Architecture applicative

Architecture recommandée : monolithe modulaire.

Un seul projet, mais découpé en domaines :

- `catalogue`
- `commerce`
- `admin`
- `requests`
- `content`
- `media`
- `auth`
- `seo`
- `emails`
- `shared`

Il ne faut pas séparer frontend et backend en deux applications au départ. Ce serait plus lourd sans bénéfice suffisant pour la V1.

## 6. Authentification

### Admin

Obligatoire en V1.

Exigences :

- login admin sécurisé ;
- accès `/admin` protégé ;
- rôle admin vérifié côté serveur ;
- aucun bouton admin dans la navigation publique ;
- logs des actions sensibles.

### Client

Non obligatoire pour acheter.

Principe :

- achat invité obligatoire ;
- compte client optionnel plus tard ;
- aucun blocage à l'achat ;
- possibilité future de magic link, Google, Apple.

Décision recommandée :

- V1 : pas d'espace client obligatoire ;
- préparer le modèle de données pour rattacher une commande à un email ou à un futur compte ;
- ajouter le compte client plus tard sans casser les commandes invitées.

## 7. Paiement

Recommandation : Stripe Checkout.

Principes :

- le panier est validé côté serveur avant création de session ;
- les prix sont recalculés côté serveur ;
- les stocks sont vérifiés côté serveur ;
- le paiement est confirmé via webhook ;
- le webhook vérifie la signature Stripe ;
- les données bancaires complètes ne sont jamais stockées ;
- les erreurs de paiement sont journalisées.

## 8. Factures

Options :

### Option A - facture générée par l'application

Avantages :

- contrôle complet ;
- personnalisation ;
- cohérence admin.

Inconvénients :

- responsabilité plus grande ;
- génération PDF à maintenir ;
- conformité à vérifier.

### Option B - facture ou reçu via Stripe / outil externe

Avantages :

- plus rapide ;
- moins de maintenance ;
- plus fiable au démarrage.

Inconvénients :

- moins personnalisé ;
- dépendance externe.

Recommandation initiale : commencer avec une preuve de commande propre et étudier la facture interne avant production selon les besoins légaux et comptables.

## 9. Emails

Emails V1 nécessaires :

- confirmation de commande ;
- notification admin nouvelle commande ;
- confirmation demande contact ;
- notification admin demande contact ;
- confirmation demande réparation ;
- notification admin demande réparation ;
- confirmation demande sur-mesure ;
- notification admin demande sur-mesure ;
- alerte de stock si retenue.

Service possible :

- Resend ;
- Brevo ;
- Mailgun ;
- autre service transactionnel.

Éviter de dépendre d'une boîte Gmail classique en production.

## 10. Médias

Stockage possible :

- Supabase Storage ;
- S3 compatible ;
- Cloudflare R2.

Exigences :

- validation serveur ;
- limitation taille ;
- contrôle MIME ;
- formats optimisés ;
- suppression maîtrisée ;
- séparation médias publics / privés ;
- images de demandes réparation protégées si nécessaire.

## 11. Recherche

V1 :

- recherche SQL simple sur nom, référence, description.

Plus tard :

- recherche full-text PostgreSQL ;
- moteur dédié si le catalogue grossit beaucoup.

## 12. PWA

La PWA doit être progressive.

V1 :

- manifest ;
- installation ;
- icônes ;
- thème ;
- cache basique.

Plus tard :

- notifications ;
- offline plus poussé ;
- raccourcis app ;
- expérience espace client enrichie.

## 13. Multilingue

Recommandation :

- prévoir l'architecture compatible ;
- ne pas bloquer la V1 si les traductions anglaises ne sont pas prêtes.

Deux approches possibles :

- routes `/fr` et `/en` ;
- domaine ou paramètre de langue.

Recommandation : routes propres `/fr` et `/en` si le multilingue est activé, car c'est plus clair pour le SEO.

## 14. Modèle de données initial

Entités principales :

- User
- AdminProfile
- CustomerProfile optionnel
- Product
- ProductCategory
- ProductImage
- ProductTechnicalAttribute
- Cart ou panier session
- Order
- OrderItem
- Payment
- Reservation
- ContactRequest
- RepairRequest
- CustomRequest
- MediaAsset
- BlogPost
- LegalPage
- StockAlert
- AuditLog

Relations importantes :

- un produit appartient à une catégorie ;
- un produit possède plusieurs images ;
- une commande possède plusieurs lignes ;
- une commande peut être liée à un utilisateur ou seulement à un email invité ;
- une demande peut avoir plusieurs fichiers ;
- une réservation concerne un produit ;
- un article possède une image de couverture.

## 15. Environnements

Prévoir :

- développement local ;
- préproduction ou preview ;
- production.

Chaque environnement doit avoir :

- variables dédiées ;
- base dédiée ou schéma dédié ;
- clés Stripe de test ou production ;
- stockage approprié ;
- emails test ou production.

## 16. Tests

V1 doit inclure au minimum :

- tests des fonctions critiques ;
- tests de validation panier ;
- tests webhook Stripe ;
- tests permissions admin ;
- tests formulaires ;
- tests manuels responsive ;
- test Lighthouse ou équivalent sur pages clés.

## 17. Déploiement

Option simple :

- Vercel pour Next.js ;
- Supabase pour base/auth/storage ;
- service email transactionnel ;
- Stripe.

Avantages :

- rapide ;
- peu d'infrastructure ;
- previews faciles ;
- coût initial raisonnable.

Points à surveiller :

- coûts si trafic ou médias augmentent ;
- sauvegardes ;
- limites de plateforme ;
- verrouillage fournisseur.

## 18. CI/CD

À prévoir :

- vérification TypeScript ;
- lint ;
- tests ;
- build ;
- déploiement preview ;
- déploiement production contrôlé.

## 19. Sécurité technique

Checklist :

- secrets hors code ;
- validation serveur ;
- contrôle des rôles ;
- uploads sécurisés ;
- webhooks signés ;
- rate limiting ;
- logs ;
- suppression des routes de test ;
- dépendances mises à jour ;
- sauvegardes ;
- politique de CORS si API exposée ;
- headers de sécurité.

## 20. Décisions à valider avant codage

- Next.js confirmé ou autre framework ?
- Supabase confirmé ou Postgres hébergé séparément ?
- Prisma ou Drizzle ?
- Vercel ou autre hébergement ?
- Stripe Checkout confirmé ?
- facture interne dès V1 ou preuve de commande d'abord ?
- français seul ou multilingue dès V1 ?
- occasion réservée ou achetée ?
- compte client absent en V1 ou optionnel dès V1 ?
- service email transactionnel retenu ?
- stockage média retenu ?

