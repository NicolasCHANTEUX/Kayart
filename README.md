# KayArt Web

Nouvelle application KayArt, reconstruite from scratch.

## Objectif

Créer une plateforme de marque et de vente pour KayArt : boutique, produits techniques, occasion, réparation, sur-mesure, journal, administration, paiement et PWA progressive.

## Stack cible

- Next.js
- React
- TypeScript
- PostgreSQL / Supabase
- Stripe Checkout
- PWA progressive

## Démarrage

```bash
npm install
npm run dev
```

Le site local sera disponible sur `http://localhost:3000`.

## Vérification

Avant de lancer un build, arrêter le serveur `npm run dev` s'il tourne déjà.

```bash
npm run clean
npm run verify
```

Next.js utilise le dossier `.next` en développement et en build. Éviter de lancer `next build` pendant que `next dev` tourne, sinon les artefacts peuvent se mélanger et provoquer des erreurs de chunks manquants.

## Documents de cadrage

- `outputs/cahier-des-charges-kayart.md`
- `outputs/feuille-de-route-v1-et-suite.md`
- `outputs/decisions-techniques-kayart.md`

## État actuel

Socle initial : structure Next.js, pages publiques principales, composants de base, données temporaires typées et PWA minimale.
