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
KAYART_DATA_SOURCE="mock"
```

`db:generate` peut fonctionner sans URL reelle. `db:push` et `db:migrate` necessiteront une vraie `DATABASE_URL`.

Le fichier `prisma.config.ts` charge `.env` puis `.env.local` pour que les commandes Prisma voient les
memes variables que le serveur Next local.

## Commandes prevues

```bat
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run db:migrate
```

## Etat

Le schema Prisma est un squelette V1 aligne sur `database/schema-v1.sql`.

Prisma Client est genere. L'application utilise le repository mock tant que la base n'est pas configuree,
mais le repository Prisma sait deja lire les categories/produits et creer un produit depuis l'admin.

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

Tant que Supabase/PostgreSQL n'est pas configure, garder `KAYART_DATA_SOURCE=mock`.

Quand la base sera prete :

```bat
npm.cmd run db:push
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
