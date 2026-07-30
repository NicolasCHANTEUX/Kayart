# Progression technique KayArt

Date : 14 juillet 2026

## Etat stable actuel

- Installation npm OK cote utilisateur.
- `npm.cmd run verify` OK quand le serveur dev est arrete.
- Pages publiques principales en place.
- Admin produits en place.
- Formulaire nouveau produit en place.
- Chemin de sauvegarde produit prepare cote serveur, actif uniquement en mode Prisma.
- Mise a jour rapide du stock preparee dans l'admin produits, active uniquement en mode Prisma.
- Schema PostgreSQL/Supabase V1 en place.
- Prisma Client genere et audit npm propre cote utilisateur.
- Projet Supabase Kayart prepare cote variables locales.
- URLs PostgreSQL Supabase identifiees : transaction pooler et session pooler.
- Correction Supabase : le token des alertes stock n'utilise plus `gen_random_bytes`.
- `db:push` reussi cote utilisateur : la base Supabase est synchronisee avec Prisma.
- `KAYART_DATA_SOURCE=prisma` active dans `.env.local`.
- Seed catalogue ajoute via `npm.cmd run db:seed`.
- Rapport ancien admin analyse et decisions stock documentees.
- Formulaire produit renforce : SKU/categorie/description obligatoires, prix barre, poids, dimensions.
- Liste admin enrichie : recherche, filtres categorie/type/stock, badges de stock coherents.
- Export Sigma/Figma Make analyse et premiere charte graphique appliquee.
- Liste admin produits finalisee : message V1 retire, disponibilite en lecture seule, stock seul modifiable.
- Upload multi-images ajoute au formulaire produit avec drag/drop et image de couverture.
- Les cartes produit et l'admin affichent l'image principale quand elle existe.
- Formulaire de creation transforme en assistant progressif avec etapes bloquees et grisage anime.

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

Aujourd'hui, `.env.local` utilise le repository Prisma.

Le repository mock reste disponible pour developper sans base reelle ou diagnostiquer un probleme de
connexion, sans changer les pages boutique, fiche produit ou admin produits.

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

Le branchement technique est actif en local. Les prochaines etapes portent sur les donnees, l'admin et
les protections d'acces.

Un mapper est deja pret :

- `src/server/catalog/catalog.mapper.ts`

Il convertit les objets Prisma vers les types applicatifs KayArt.

Le formulaire admin nouveau produit passe par :

- `src/app/admin/produits/actions.ts`
- `src/server/catalog/catalog.input.ts`
- `src/server/catalog/catalog.repository.ts`

En mode `prisma`, le formulaire cree un produit en base.
En mode `mock`, le bouton reste desactive pour eviter une fausse sauvegarde.

La liste admin produits permet aussi de preparer la mise a jour rapide :

- statut catalogue ;
- quantite en stock.

Cette action est active en mode `prisma` et desactivee en mode `mock`.

## Prochaine etape technique

Initialiser les premieres donnees et tester l'admin :

1. Executer `npm.cmd run db:seed`.
2. Redemarrer `npm.cmd run dev`.
3. Ouvrir `/admin/produits`.
4. Verifier que les produits seedes apparaissent.
5. Tester la mise a jour rapide du stock.
6. Tester la creation d'un produit brouillon.
7. Verifier les filtres admin : recherche, categorie, type, stock.
8. Parcourir l'accueil et la boutique pour valider la nouvelle direction visuelle.
9. Creer un produit avec plusieurs images et verifier que la couverture apparait dans la liste.
10. Tester le verrouillage des etapes du formulaire admin produit.

Note Supabase : si `db:push` echoue sur `gen_random_bytes`, le schema a ete corrige pour ne plus
dependre de cette fonction. Relancer `npm.cmd run db:push`.

Les informations deja configurees localement :

- URL projet Supabase ;
- cle publishable cote client ;
- cle secret cote serveur.

L'URL REST `/rest/v1` ne suffit pas a Prisma : il faut une URL PostgreSQL.

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
