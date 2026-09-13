# Prisma

Le sch?ma d?crit produits, m?dias, clients, commandes, demandes, zones, r?servations de checkout et autres mod?les dont l?impl?mentation est pr?cis?e dans [l??tat V1](../docs/v1-status.md).

- `db:generate` : g?n?ration du client.
- `db:migrate` : migrations de d?veloppement.
- `db:push` : synchronisation directe pour une base jetable ; ne remplace pas le SQL de s?curit?.
- `db:seed` : donn?es initiales ; ne pas lancer automatiquement sur la base r?elle.

`prisma.config.ts` d?finit la source des commandes et les migrations. L?application utilise `@prisma/adapter-pg` quand `KAYART_DATA_SOURCE=prisma`.

Le [guide base de donn?es](../docs/database.md) fait r?f?rence pour l?historique, les op?rations distantes et les SQL sp?cialis?s. Les versions et overrides font foi dans `package.json` et `package-lock.json`, pas dans d?anciennes notes d?audit.
