# Référencement technique

L’indexation reste désactivée par défaut pour éviter l’exposition des données de démonstration et des déploiements de test aux moteurs. Le site public continue de fonctionner ; cela n’active ni les paiements ni les pages légales.

## Activation sur le site public

Quand le domaine de production et les contenus sont validés, renseigner directement dans l’environnement de déploiement :

- `NEXT_PUBLIC_SITE_URL` : l’origine HTTPS exacte du site public, sans chemin, paramètres, port ni identifiants ;
- `KAYART_DATA_SOURCE=prisma` ;
- `KAYART_INDEXING_ENABLED=true`.

Redéployer après modification. Sur Vercel, `VERCEL_ENV` doit être `production` ; les previews et environnements de développement restent exclus même si le drapeau est activé. Ne pas activer ce drapeau sur une base de test isolée.

Vérifier `/robots.txt`, `/sitemap.xml` et une fiche produit. Le sitemap doit utiliser uniquement ce domaine ; la fiche doit présenter son URL canonique. Sur un environnement non activé, robots interdit toute exploration, le sitemap est vide et les pages portent `noindex, nofollow`.

## Contenu fourni

Le sitemap contient l’accueil, la boutique, le contact, la réparation, le sur-mesure et les produits publiés. Il exclut brouillons, archives et produits masqués. Il sélectionne seulement les slugs et dates de modification des produits. Les trois pages légales sont ajoutées uniquement lorsque leur configuration est complète et approuvée. Journal et savoir-faire attendent la validation de leurs contenus avant inclusion.

Les fiches produit utilisent leur propre titre, description et image pour le partage. Administration, connexion, inscription, réinitialisation du mot de passe, panier et confirmation de commande restent non indexables. Ces directives ne sont pas des protections d’accès : les contrôles de session et de visibilité restent indispensables et conservés.

Le sitemap unique est limité à 49 990 produits pour rester sous 50 000 URL avec les pages fixes. Si le catalogue approche ce volume, le scinder en plusieurs sitemaps avant de dépasser ce seuil. Les données structurées de commerce et les textes éditoriaux restent à compléter à partir de données réelles et validées.

Implémentation fondée sur les conventions Next.js pour [robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) et [sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap).
