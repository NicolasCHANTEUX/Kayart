# SQL sp?cialis?s et historiques

Le mod?le courant est dans `prisma/schema.prisma` et son historique dans `prisma/migrations`. Lire [le guide de la base](../docs/database.md) avant toute op?ration.

`schema-v1.sql` et les patches de construction sont des r?f?rences historiques. Les scripts de r?les et permissions restent des op?rations sp?cialis?es : voir [le durcissement](../docs/database-hardening.md) et [le r?le runtime](../docs/runtime-role-activation.md).

Ne pas ex?cuter tous les fichiers sur une base existante. Ne jamais associer automatiquement un administrateur sur la seule base de son email.
