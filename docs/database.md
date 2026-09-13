# Base de donn?es et sources de v?rit?

1. `prisma/schema.prisma` d?crit le mod?le applicatif et g?n?re le client TypeScript.
2. `prisma/migrations/*/migration.sql` d?crit l??volution versionn?e, y compris les contraintes et protections que Prisma ne repr?sente pas enti?rement.
3. La base d?ploy?e doit ?tre compar?e ? cet historique : un fichier dans Git ne prouve pas son application.

Les anciens `database/schema-v1.sql`, `admin-auth-role.sql` et patches de construction sont des r?f?rences, **pas une seconde cha?ne de migrations ? appliquer apr?s Prisma**. Les scripts de r?les PostgreSQL ont une fonction sp?cialis?e ? suivre dans leur guide.

## Commandes

`db:generate` g?n?re le client sans modifier les donn?es. `db:migrate` correspond ? `prisma migrate dev`, r?serv? ? une base de d?veloppement. `db:push` n?applique pas l?historique SQL et ne remplace pas les migrations de s?curit?. `db:seed` n?est pas une commande de d?ploiement sur les donn?es de l?atelier.

`prisma.config.ts` charge les fichiers d?environnement en pr?servant les variables du processus et pr?f?re `DIRECT_URL`. L?application utilise `DATABASE_URL`. S?parer les credentials de migration du runtime : [guide d?di?](runtime-role-activation.md).

## Avant une migration distante

- V?rifier la cible, la sauvegarde et sa proc?dure de restauration.
- Lire `prisma migrate status` et comparer les objets r?ellement pr?sents.
- Identifier les migrations d?j? appliqu?es manuellement. Ne pas marquer une migration appliqu?e sans v?rifier ses objets.
- Pr?parer et tester la migration en recette, contr?ler les donn?es incompatibles.
- V?rifier ensuite contraintes, RLS, droits, index et buckets, puis les parcours applicatifs.

Ne pas rejouer `0_baseline` sur une base existante. Le lot du 13 septembre n?a modifi? aucune migration distante ni permission ; le contr?le du compte administrateur ?tait en lecture seule.
