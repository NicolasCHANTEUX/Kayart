# Prisma

Ce dossier prepare le branchement PostgreSQL/Supabase.

## Installation des dependances

Quand on decide d'activer Prisma :

```bat
npm.cmd install @prisma/client
npm.cmd install -D prisma
npm.cmd install @prisma/adapter-pg pg
```

Puis :

```bat
npm.cmd run db:generate
```

## Variables attendues

Avec Prisma 7, l'URL de connexion est declaree dans `prisma.config.ts`, pas dans `schema.prisma`.

Dans l'environnement du terminal, dans `.env`, ou dans `.env.local` :

```text
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
KAYART_DATA_SOURCE="mock"
```

`db:generate` peut fonctionner sans URL reelle. `db:push` et `db:migrate` necessiteront une vraie `DATABASE_URL`.

Pour Supabase, utiliser les chaines PostgreSQL du Connect dialog, pas l'URL REST `/rest/v1`.

- `DATABASE_URL` : transaction-mode pooler, port `6543`, utilisee par l'application.
- `DIRECT_URL` : session-mode pooler, port `5432`, utilisee par Prisma pour `db:push` et les migrations.

Le fichier `prisma.config.ts` charge `.env` puis `.env.local` pour que les commandes Prisma voient les
memes variables que le serveur Next local. Il utilise `DIRECT_URL` en priorite pour les commandes Prisma,
puis `DATABASE_URL` en secours.

Avant de remplir `DATABASE_URL`, lancer dans Supabase SQL Editor :

```sql
-- database/supabase-prisma-user.sql
```

Puis creer un mot de passe fort pour l'utilisateur `prisma` et l'utiliser dans la chaine de connexion.

## Commandes prevues

```bat
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run db:migrate
npm.cmd run db:seed
```

## Etat

Le schema Prisma est un squelette V1 aligne sur `database/schema-v1.sql`.

Prisma Client est genere. En local, l'application utilise le repository Prisma quand
`KAYART_DATA_SOURCE=prisma`.

Le repository Prisma sait lire les categories/produits, creer un produit depuis l'admin et mettre a jour
rapidement le stock.

Avec Prisma 7, une connexion PostgreSQL directe necessite un adapter runtime, par exemple `@prisma/adapter-pg`, puis une instanciation du type :

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

L'application utilise `KAYART_DATA_SOURCE`.

- `mock` : donnees temporaires locales ;
- `prisma` : repository Prisma, necessite `DATABASE_URL`.

Tant que Supabase/PostgreSQL n'est pas configure dans un autre environnement, garder
`KAYART_DATA_SOURCE=mock`.

Quand la base sera prete :

```bat
npm.cmd run db:push
npm.cmd run db:seed
```

Puis basculer :

```text
KAYART_DATA_SOURCE="prisma"
```

## Audit npm

Prisma 7.8.0 embarque actuellement `@prisma/dev`, qui depend de `@hono/node-server@1.19.11`.

Comme `@hono/node-server < 1.19.13` est signale vulnerable par `npm audit`, le projet force temporairement :

```json
"overrides": {
  "@hono/node-server": "1.19.13"
}
```

Ne pas utiliser `npm audit fix --force`, car npm propose un downgrade cassant vers Prisma 6.
