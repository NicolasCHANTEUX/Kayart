# Protections de la base — 8 septembre 2026

État de la base configurée : protections appliquées avec l’autorisation explicite de l’utilisateur le 8 septembre 2026. Contrôles RLS, droits, contraintes, triggers et bucket réussis. `0_baseline` et `20260908_security_integrity` sont enregistrées comme appliquées ; `prisma migrate status` confirme un schéma à jour. La comparaison Prisma ne détecte aucune différence dans le périmètre qu’elle prend en charge. Les contraintes CHECK, triggers et index d’expression restent gérés par le SQL et vérifiés séparément.

## Périmètre

`scripts/harden-database.mjs --check` ne modifie rien et affiche uniquement les nombres de conflits, les indicateurs de privilèges et les paramètres du bucket. Il ne journalise ni données clients, ni secrets.

`--apply` applique `prisma/migrations/20260908_security_integrity/migration.sql` dans une transaction PostgreSQL. Un conflit ou un délai de verrouillage dépassé annule toute la transaction. Il configure ensuite le bucket public : 4 Mo, WebP. Cette seconde opération Storage est distincte de la transaction SQL ; le rapport indique séparément les deux résultats. Aucun fichier existant n’est supprimé.

Les 16 tables ont RLS activé et aucun accès direct `anon`/`authenticated`. L’application utilise sa couche serveur pour le catalogue et les opérations admin. Les contraintes couvrent les prix, stocks, totaux, quantités, tailles, emails normalisés uniques et une seule couverture par produit. Des triggers actualisent les dates de modification.

## Historique des migrations

`0_baseline` décrit le schéma Prisma existant. **Ne pas l’exécuter sur une base déjà peuplée** : après comparaison avec le schéma réel et sauvegarde, enregistrer ce point de départ avec `prisma migrate resolve --applied 0_baseline`. Si le script de durcissement a déjà été appliqué avec succès, enregistrer aussi `prisma migrate resolve --applied 20260908_security_integrity` avant d’utiliser `prisma migrate deploy` pour les évolutions suivantes. Ces commandes modifient l’historique des migrations ; elles ne font pas partie de `--check`.

Pour une nouvelle base Supabase vide, les migrations peuvent être appliquées dans l’ordre après vérification de la cible. Le SQL utilise les rôles Supabase `anon` et `authenticated` : il ne cible pas un PostgreSQL générique sans ces rôles.

## Compte applicatif restant à isoler

L’inspection a confirmé que la connexion configurée utilise un rôle avec `BYPASSRLS` et `CREATEDB`. Activer RLS ne restreint pas ce rôle. Il faut provisionner un utilisateur PostgreSQL dédié au serveur, sans ces privilèges, avec seulement les droits nécessaires et des politiques RLS réservées à ce rôle. Le compte de migration reste distinct dans `DIRECT_URL`. Tester ensuite le catalogue et l’authentification avec cette nouvelle connexion avant de remplacer `DATABASE_URL` dans l’hébergement.

Cette rotation n’est pas automatisée : modifier le rôle de gestion Supabase ou ses privilèges peut casser les migrations et les services gérés. Ne jamais mettre la connexion de gestion dans une variable `NEXT_PUBLIC_*`.

## Comptes administrateurs

L’application ne réassocie plus automatiquement les comptes par email. Un administrateur existant doit avoir un `customers.auth_user_id` explicitement rattaché au bon utilisateur Supabase Auth. Contrôler ce rattachement via les outils d’administration avant déploiement ; ne pas rétablir une association automatique par email.

## Déploiement des images

Déployer le code avec le bucket configuré. L’ancien endpoint de signatures publiques répond désormais 410. Les photos passent par `/api/admin/product-images/upload`, sont décodées, converties en WebP, puis accompagnées d’un reçu signé lié à l’administrateur, valable une heure. Les GIF/WebP animés sont refusés. Les anciennes images ne sont pas automatiquement réanalysées ; contrôler leur contenu séparément et attendre l’expiration des anciennes URL d’envoi signées.

Le stockage local est réservé au développement. Sur l’hébergement, configurer Supabase et conserver `KAYART_ENABLE_ORDER_SIMULATOR=false`. Un secret HMAC dédié `PRODUCT_IMAGE_RECEIPT_SECRET` est possible ; à défaut, la clé Supabase du serveur sert à signer les reçus.
