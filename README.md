# KayArt

Application d?atelier et de boutique : catalogue neuf/imparfait/occasion, demandes de r?paration et de sur-mesure, administration, panier et int?gration Stripe **en mode test uniquement**.

Le projet est en pr?production. La refonte UI est pr?sente dans le travail local. Les informations commerciales et l?gales d?finitives et la recette Stripe r?elle restent ? terminer. Voir [l??tat V1](docs/v1-status.md) pour les fonctionnalit?s et leurs limites.

## D?marrer

Node.js 24 et npm sont utilis?s en CI.

```sh
npm ci
npm run db:generate
npm run dev
```

Le site est disponible sur http://localhost:3000. Utiliser `.env.example` comme r?f?rence pour cr?er `.env.local`, sans committer les secrets.

- `KAYART_DATA_SOURCE=mock` : catalogue de d?monstration ; les comptes connect?s restent clients.
- `KAYART_DATA_SOURCE=prisma` : donn?es PostgreSQL/Supabase ; r?le admin li? ? l?identifiant Auth v?rifi?.
- `/admin` : produits, commandes, demandes et livraison, r?serv?s aux administrateurs.

Ne pas lancer de seed ou de `db push` sur une base existante pour passer aux donn?es r?elles. Suivre [le guide base de donn?es](docs/database.md).

## V?rifier

```sh
npm run lint
npm test
npm run typecheck
npm run test:production
```

`lint` lance ESLint avec les r?gles Next.js/React/TypeScript et aucun avertissement tol?r?. `test:production` compile une copie isol?e avec des donn?es priv?es de test, d?marre le serveur sur 3107 et ex?cute les contr?les HTTP, avec un double Auth sur 3108. Aucun secret applicatif n?est transmis ? cette copie. Ces ports doivent ?tre libres.

`npm run verify` lance lint, tests, types et build dans le dossier courant. **Arr?ter le serveur de d?veloppement avant ce build**, car Next partage `.next`. Le contr?le isol? `test:production` peut fonctionner pendant le d?veloppement.

La CI ex?cute installation, g?n?ration Prisma, lint, tests, types et recette HTTP sur le build isol?. Elle ne valide pas le d?ploiement Vercel, un compte Stripe r?el ni les r?gles commerciales.

## Organisation et guides

- `src/app`, `src/components` : routes, actions et interface.
- `src/server` : authentification, m?tier, donn?es et s?curit?.
- `src/styles` : styles organis?s avec ordre de cascade document?.
- `prisma/schema.prisma` et `prisma/migrations` : mod?le et historique versionn?.
- `database` : SQL sp?cialis?s et contrats historiques.
- `tests`, `scripts` : v?rifications et op?rations explicites.
- `docs` : guides actifs ; `outputs` : preuves dat?es et archives.

Lire [l??tat V1](docs/v1-status.md), [l?architecture](docs/architecture.md), [le d?ploiement](docs/deployment.md), [la s?curit?](docs/security.md), [la recette Stripe test](docs/checkout-test-v1.md) et [l?index documentaire](docs/README.md).

Les paiements r?els sont refus?s dans le code : une cl? de production ne suffit pas ? les activer. Les pages l?gales et l?indexation restent soumises ? leur configuration et validation explicites.
