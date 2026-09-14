# Documentation active

Commencer par [l??tat V1](v1-status.md), qui distingue code livr?, validations en attente et fonctions absentes.

| Guide | Usage |
| --- | --- |
| [Panier et commande](panier-commande.md) | Parcours séparé, erreurs par article et recette navigateur |
| [Architecture](architecture.md) | Responsabilit?s et parcours des donn?es |
| [D?ploiement](deployment.md) | Recette et conditions d?ouverture |
| [Base de donn?es](database.md) | Sources de v?rit? et migrations |
| [S?curit?](security.md) | Acc?s, contr?les et limites |
| [Checkout test](checkout-test-v1.md) | Configuration et sc?narios Stripe |
| [Sessions](sessions.md) | Renouvellement et d?connexion |
| [R?f?rencement](referencement.md) | Activation robots et sitemap |
| [Identité KayArt](ui-brand.md) | Direction actuelle, inspirée des logos |
| [UI compacte](ui-compact.md) | Version actuelle, mesures et captures |
| [UI V2](ui-v2.md) | Direction graphique et recette |
| [Durcissement DB](database-hardening.md) | Protections SQL et storage |
| [R?le runtime](runtime-role-activation.md) | Droits limit?s |

Les rapports dat?s d?activation et `outputs/` d?crivent des interventions ant?rieures. Leurs nombres de tests, configurations et captures ne d?crivent pas automatiquement la version courante. Ce sont des archives ; les guides actifs priment sur les anciennes proc?dures.

Les nouvelles preuves temporaires vont dans `outputs/latest-verification/`, ignor? par Git. Une preuve durable peut ?tre s?lectionn?e dans un dossier dat? avec sa port?e et ses limites. Les profils navigateur et copies de test vont dans `work/`, ?galement ignor?. Ne jamais archiver d?environnement, de jeton ni de donn?es clients.
