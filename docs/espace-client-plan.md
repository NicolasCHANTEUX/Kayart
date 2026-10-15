# Espace compte client — première version

## État du code

La première version est implémentée : `/compte`, `/compte/profil`, `/compte/commandes` et le détail d'une commande. Les lectures et modifications exigent une session Supabase vérifiée ; les commandes sont filtrées par `customers.auth_user_id`, jamais par l'email. Les nouvelles commandes de test lancées en étant connecté sont liées au client dans la transaction de checkout. Le checkout invité reste disponible.

La migration `20261015_customer_account` et les droits de `database/runtime-role.sql` sont prêts mais **n'ont pas été appliqués à la base distante** dans cet environnement. Avant la mise en production, appliquer les migrations avec `DIRECT_URL`, vérifier le rôle effectivement utilisé par `DATABASE_URL`, puis tester sous ce rôle la lecture et l'écriture du profil ainsi qu'un checkout test connecté. Un rôle `kayart_app` provisionné après la migration reçoit ces droits via `database/runtime-role.sql`.

## État actuel

- Supabase Auth fournit l'identité vérifiée (`user.id`, `user.email`) et les cookies de session. Le rôle applicatif est lu par `customers.auth_user_id` ; une simple correspondance d'email ne rattache jamais un compte.
- `customers` contient `first_name`, `last_name`, `phone` et `email`, mais la création d'un compte Supabase ne crée pas de ligne `customers`.
- Les commandes créées avant cette version ont généralement `customer_id = NULL` et restent hors de l'espace compte. Une commande créée ainsi ne peut pas être affichée dans un compte par simple correspondance d'email.
- Le rôle SQL `kayart_app` avait seulement `SELECT (id, auth_user_id, role)` sur `customers`. Les nouveaux droits sont dans la migration et dans sa procédure de provisionnement ; leur application distante reste à vérifier.
- La route `/compte` est exclue de l'indexation par `robots.ts`.

## Première version

1. `/compte` : page privée avec navigation vers profil et commandes, et états vides explicites.
2. `/compte/profil` : afficher l'email vérifié par Supabase en lecture seule ; modifier prénom, nom et téléphone avec validation côté serveur. Conserver `role` et `auth_user_id` hors des données modifiables.
3. `/compte/commandes` et `/compte/commandes/[id]` : afficher seulement les commandes liées par `orders.customer_id` à la ligne `customers` dont `auth_user_id` correspond à la session vérifiée. Montrer le statut, les articles, les montants et la livraison ; ne jamais utiliser `guest_email` pour autoriser la lecture.
4. Navigation : lien « Mon compte » pour les clients connectés, lien admin existant pour les administrateurs et déconnexion accessible.

## Architecture et contrôles

1. `requireAccountSession()` redirige les visiteurs vers `/connexion?redirect=%2Fcompte`. Chaque service de lecture ou d'écriture vérifie aussi la session ; les pages sont dynamiques et les réponses portant une session ne sont pas mises en cache.
2. Les lignes `customers` sont créées ou retrouvées uniquement par `auth_user_id` vérifié. Une collision avec l'index unique de l'email normalisé échoue sans reprendre automatiquement une autre ligne ; elle doit être traitée par le support, hors de cette première version.
3. Les droits SQL prévus pour `kayart_app` limitent `SELECT` aux champs utiles, `INSERT` aux colonnes d'identité et de profil (avec rôle par défaut `customer`) et `UPDATE` aux champs de profil et à `updated_at`. Ils n'autorisent ni modification de `role` ni modification de `auth_user_id`. Leur application sur l'hébergement reste à vérifier.
4. Les nouvelles commandes créées pendant une session vérifiée sont liées au client par `customer_id` dans la transaction de création. Le checkout invité reste disponible. Pour un achat connecté, l'email vérifié est prérempli et une valeur différente est refusée côté serveur ; la reprise de la même tentative vérifie aussi son propriétaire.
5. Les sélections Prisma du compte limitent les colonnes renvoyées et vérifient l'appartenance de chaque commande par la relation `customer.authUserId`. Les factures ne sont pas exposées dans cette version.
6. Les tests couvrent le refus anonyme au niveau service, l'isolation par identifiant Auth, les champs modifiables, la liaison et la reprise d'une commande connectée, ainsi que le checkout invité. Une recette navigateur avec deux vrais comptes et la base de test reste à faire après déploiement de la migration.

## Périmètre confirmé pour la première version

- **Anciennes commandes invité** : seules les commandes liées lors d'un achat connecté seront visibles. Aucun rattachement rétroactif par email.
- **Changement d'email** : email en lecture seule. Les champs modifiables sont prénom, nom et téléphone.
- **Autres contenus** : réservations, demandes de réparation et projets sur mesure peuvent venir après les commandes. Ils n'ont pas actuellement de lien fiable vers `customers`.
- **Paiement** : le checkout actuel est explicitement en mode test. L'espace compte doit l'indiquer et ne pas présenter ces commandes comme des achats réels.

## Recette de déploiement

1. Vérifier la cible de `DIRECT_URL`, puis appliquer `prisma migrate deploy`. Ne pas utiliser `DATABASE_URL` du rôle restreint pour les migrations.
2. Vérifier que `DATABASE_URL` de l'hébergement utilise le rôle attendu. Si `kayart_app` est activé après la migration, exécuter sa procédure de provisionnement documentée.
3. Tester avec deux comptes distincts : profil, commande test connectée, absence de commande chez l'autre compte, checkout invité, déconnexion et tentative de lecture directe d'une commande d'autrui.
4. Vérifier l'affichage à 320, 390, 768 et 1440 px sur une instance de test authentifiée avant le déploiement public.
