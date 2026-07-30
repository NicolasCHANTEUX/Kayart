# Configuration Supabase KayArt

Date : 14 juillet 2026

## Ce qui est configure

Le fichier local `.env.local` contient maintenant :

- l'URL du projet Supabase ;
- la cle publishable pour les futurs usages client ;
- la cle secret pour les futurs usages serveur/admin ;
- les variables Supabase et PostgreSQL locales.

Le fichier `.env.local` est ignore par Git.

## Ce qui manque

Prisma ne se connecte pas avec l'URL REST `/rest/v1`.

Il lui faut des URLs PostgreSQL du Connect dialog Supabase :

```text
Connect > ORMs > Prisma ou Connect > Pooler > Session
```

Pour notre projet :

- `DATABASE_URL` : transaction-mode pooler, port `6543`, avec `?pgbouncer=true`.
- `DIRECT_URL` : session-mode pooler, port `5432`, utilisee pour les migrations.

`DIRECT_URL` doit finir par :

```text
:5432/postgres
```

Les informations deja donnees ne suffisent donc pas pour `db:push` :

- URL projet Supabase : OK ;
- cle publishable : OK ;
- cle secret serveur : OK ;
- URL REST : utile pour l'API REST, mais pas pour Prisma ;
- URLs PostgreSQL : maintenant identifiees, il manque seulement le mot de passe.

## Preparation recommandee

Dans Supabase SQL Editor, lancer :

```sql
-- contenu de database/supabase-prisma-user.sql
```

Remplacer `replace_with_a_strong_password` par un vrai mot de passe fort.

Ensuite, utiliser l'utilisateur `prisma` et ce mot de passe dans les chaines `DATABASE_URL` et
`DIRECT_URL`, ou utiliser temporairement l'utilisateur `postgres` fourni par Supabase.

## Activation

Quand `DATABASE_URL` est rempli dans `.env.local` :

```text
KAYART_DATA_SOURCE=prisma
```

Puis redemarrer le serveur local.

Commandes a lancer ensuite :

```bat
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run db:seed
npm.cmd run typecheck
```

## Etat actuel

Le schema a ete pousse avec succes dans Supabase.

Le projet local est en mode :

```text
KAYART_DATA_SOURCE=prisma
```

Le seed catalogue est disponible avec :

```bat
npm.cmd run db:seed
```
