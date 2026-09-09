# Activation des priorités — 9 septembre 2026

## Déploiement constaté

Le commit `419be1f4cc0764756ef4ff62e296f6b7dfa7d87a` (`v11.2`, Next.js 15.5.25) possède un déploiement **Production réussi** dans les métadonnées GitHub/Vercel :

- [Déploiement Vercel](https://vercel.com/ecofoodstock/kayart/DAQZQce4y8PLYtaL7nCMpaJGwCb9)
- URL retournée par ce déploiement : `https://kayart-a4978f07n-ecofoodstock.vercel.app`

Les requêtes vers `/`, `/admin`, `/mentions-legales` et `/api/cron/checkouts` sont redirigées vers le SSO Vercel (302). Cela prouve la protection du déploiement ; cela ne valide pas les routes applicatives situées derrière. Aucun contournement ni désactivation de cette protection effectué. Un domaine public canonique ou une session autorisée est nécessaire à la recette distante.

## Compte Supabase restreint

Nouveau contrôle : `kayart_app` absent, connexion `DIRECT_URL` sans `CREATEROLE`. La création reste techniquement impossible avec cet accès. Aucun changement de la connexion applicative.

L’administrateur doit renseigner directement dans l’environnement une connexion de gestion autorisée, puis suivre [l’activation du rôle](runtime-role-activation.md). Ne pas envoyer de mot de passe dans la conversation. Aucune API de gestion Supabase ou Vercel ni credential correspondant n’est disponible dans cette session.

## Expiration et surveillance des paiements test

Le workflow `.github/workflows/checkout-reconciliation.yml` prévoit un passage toutes les cinq minutes et un lancement manuel. Il reste **désactivé** jusqu’à `KAYART_CHECKOUT_CRON_ENABLED=true` dans les variables GitHub du dépôt. Cela évite un cron quotidien imposé arbitrairement : les crons fréquents Vercel ne sont pas disponibles sur Hobby et peuvent faire échouer le déploiement ([limites Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing)).

Sur l’environnement Vercel de **test isolé**, renseigner :

- les clés Stripe test du compte KayArt choisi, le secret webhook et `KAYART_CHECKOUT_MODE=test` ;
- `CRON_SECRET`, aléatoire, au moins 32 caractères ;
- une URL de site correcte et une base de test distincte du stock réel.

Dans GitHub, renseigner directement :

- variable `KAYART_TEST_SITE_URL` : origine HTTPS de cet environnement, sans chemin, paramètres ni identifiants ;
- secret `KAYART_TEST_CRON_SECRET` : même valeur que son `CRON_SECRET` ;
- si nécessaire, secret `VERCEL_AUTOMATION_BYPASS_SECRET`, fourni par l’administrateur pour autoriser cette automatisation sur le déploiement protégé ; ne pas désactiver le SSO ;
- variable `KAYART_CHECKOUT_CRON_ENABLED=true`, uniquement après ces réglages.

Lancer ensuite manuellement le workflow et vérifier son succès. `needsReview > 0`, `failed > 0`, erreur HTTP ou réponse de connexion font échouer l’exécution, visible dans GitHub Actions. Le script refuse les redirections pour éviter de transmettre les credentials ailleurs et ne journalise ni secrets ni réponses contenant des données clients. Aucun email personnalisé n’est envoyé.

Le déclenchement GitHub peut être retardé ; il complète les webhooks Stripe, il ne garantit pas une exécution à la seconde. Les workflows planifiés des dépôts publics peuvent aussi être désactivés après inactivité : surveiller l’état dans Actions ([documentation GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)).

Pour Stripe, l’administrateur doit choisir le compte dédié puis configurer le webhook test et les événements décrits dans le [guide de recette](checkout-test-v1.md). Aucune clé Stripe n’est disponible : aucun parcours de paiement sur un vrai compte test ne peut encore être exécuté.

## Tarifs et juridique

Aucune nouvelle valeur réelle fournie. Retrait gratuit sur rendez-vous conservé ; zone France désactivée sans prix ; transports particuliers sur devis. Les pages légales restent bloquées. Ces priorités nécessitent toujours les frais validés et l’identité juridique complète, pas de nouvelles données de maquette.

## Tests

42 tests passent et TypeScript valide le projet. Les ajouts couvrent le refus des sessions absentes/expirées/clientes avant lecture administrative ou photo privée, la destination du cron, l’interdiction de redirections et la détection de ses erreurs. Ces tests utilisent des réponses d’authentification simulées ; ils ne remplacent pas la recette d’un vrai compte dans un navigateur.

La découverte des surfaces navigateur a retourné une liste vide. La recette desktop/mobile et les comptes réels restent donc en attente d’un navigateur connecté. Aucun paiement, email ni compte créé pour ces contrôles.
