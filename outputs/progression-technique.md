# Progression technique KayArt

Date : 14 juillet 2026

## Etat stable actuel

- Installation npm OK cote utilisateur.
- `npm.cmd run verify` OK quand le serveur dev est arrete.
- Pages publiques principales en place.
- Admin produits en place.
- Formulaire nouveau produit en place.
- Chemin de sauvegarde produit prepare cote serveur, actif uniquement en mode Prisma.
- Schema PostgreSQL/Supabase V1 en place.
- Prisma Client genere et audit npm propre cote utilisateur.

## Regle de travail

Ne pas lancer `npm.cmd run build` pendant que `npm.cmd run dev` tourne.

Workflow de verification :

```bat
Ctrl+C
npm.cmd run clean
npm.cmd run verify
npm.cmd run clean
npm.cmd run dev
```

## Couche catalogue

Les pages ne lisent plus directement les donnees temporaires.

Elles passent par :

- `src/server/catalog/catalog.repository.ts`
- `src/server/catalog/catalog.service.ts`

Aujourd'hui, le repository utilise encore les donnees mockees par defaut.

Le repository Prisma est code, mais desactive par defaut. On pourra l'activer sans changer les pages
boutique, fiche produit ou admin produits.

Selection :

- `KAYART_DATA_SOURCE=mock` : donnees temporaires ;
- `KAYART_DATA_SOURCE=prisma` : base PostgreSQL/Supabase via Prisma, necessite `DATABASE_URL`.

## Etat du branchement Prisma

Le choix technique est acte pour la V1 :

- Prisma pour l'acces donnees ;
- PostgreSQL via Supabase pour la base ;
- repository mock conserve pour developper sans base reelle.

Le squelette Prisma est pret dans :

- `prisma/schema.prisma`
- `prisma/README.md`

Les dependances Prisma sont installees cote utilisateur.

Prisma 7 utilise :

- `prisma/schema.prisma` pour le modele ;
- `prisma.config.ts` pour l'URL de connexion CLI.
- un adapter runtime pour Prisma Client, par exemple `@prisma/adapter-pg` pour PostgreSQL.
- `.env` puis `.env.local` sont charges par `prisma.config.ts` pour les commandes Prisma.

Commande de verification :

```bat
npm.cmd run db:generate
npm.cmd run typecheck
```

Le branchement technique est pret ; il manque seulement la base reelle et les variables d'environnement.

Un mapper est deja pret :

- `src/server/catalog/catalog.mapper.ts`

Il convertit les objets Prisma vers les types applicatifs KayArt.

Le formulaire admin nouveau produit passe par :

- `src/app/admin/produits/actions.ts`
- `src/server/catalog/catalog.input.ts`
- `src/server/catalog/catalog.repository.ts`

En mode `mock`, le bouton reste desactive pour eviter une fausse sauvegarde.
En mode `prisma`, le formulaire creera un produit en base.

## Prochaine etape technique

Configurer Supabase/PostgreSQL :

1. Creer ou ouvrir le projet Supabase.
2. Recuperer l'URL PostgreSQL compatible Prisma.
3. Renseigner `DATABASE_URL` dans l'environnement local.
4. Passer `KAYART_DATA_SOURCE=prisma`.
5. Executer `npm.cmd run db:push` ou une migration quand le schema est valide.
6. Ajouter des donnees de depart pour les categories et produits.

## Audit Prisma / Hono

`npm audit` signale `@hono/node-server < 1.19.13` via `@prisma/dev`.

Correction retenue :

- override npm cible : `@hono/node-server@1.19.13` ;
- pas de `npm audit fix --force`, car npm propose un downgrade cassant vers Prisma 6.

Commande a lancer apres modification de l'override :

```bat
npm.cmd install
npm.cmd audit
```
