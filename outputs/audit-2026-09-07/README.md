# Audit KayArt — 7 septembre 2026

**Le projet possède un catalogue et une administration déjà développés, mais la vente, les demandes clients et la publication d’articles restent à construire. Une fuite de données admin doit être corrigée en premier.**

Deux rapports livrés :

1. [Urgences : 13 points priorisés](01-urgences.md) — failles, pertes de données, problèmes métier et blocages de lancement, avec preuves et critères de correction.
2. [Fonctionnalités et complétude](02-fonctionnalites-et-completion.md) — inventaire fonctionnel, 38 consolidations, 14 lots de développement et définition d’une V1 terminée.

Les cinq constats les plus importants :

- **Fuite admin reproduite sans connexion** : brouillon, email et note fictifs présents dans les réponses HTTP malgré une redirection.
- **Modification de prix involontaire** : une fiche à 19,90 € peut passer à 20 € lors d’un réenregistrement.
- **Perte de caractéristiques et d’historique** : l’édition remplace les attributs, et la suppression produit efface les réservations.
- **Vente et demandes absentes** : le bouton panier est un lien, les formulaires métier ne sont pas branchés, Stripe n’est pas implémenté.
- **Configuration à consolider** : contraintes attendues absentes et bucket sans limites explicites. Les droits publics des tables sont en revanche refusés.

## Portée de la vérification

- Branche `main`, commit `9272785`, arbre suivi initialement propre.
- 169 fichiers suivis inventoriés, dont 68 fichiers de l’application active et 66 de la maquette distincte.
- Typecheck réussi ; build de production réussi sur copie isolée en mode mock.
- Tests HTTP, reproductions en mémoire et démonstration de fuite avec données fictives locales.
- Inspection Supabase autorisée en lecture seule, limitée aux métadonnées ; aucun contenu client lu.
- Dernier audit npm : 10 paquets affectés, 7 entrées élevées et 3 modérées ; pas dix exploits applicatifs démontrés.
- Pas de navigateur disponible : rendu visuel, accessibilité réelle, parcours connectés et performance mesurée restent à recetter.
- Aucun changement de code applicatif, de base, de comptes, de commande ou de déploiement effectué. Les fichiers créés sont les rapports et les preuves d’audit.

## Preuves et inventaire

| Fichier | Contenu |
|---|---|
| [inventaire-fichiers.csv](inventaire-fichiers.csv) | Inventaire lisible des 169 fichiers suivis |
| [inventaire-fichiers.json](inventaire-fichiers.json) | Empreintes, imports et classement des fichiers |
| [preuves-reproductions.json](preuves-reproductions.json) | Reproductions sur fonctions réelles et doubles locaux |
| [preuves-fuite-admin.json](preuves-fuite-admin.json) | Comparaison public/admin avec données privées fictives |
| [preuves-http.json](preuves-http.json) | 28 GET et 2 POST sur copie isolée |
| [preuves-base.json](preuves-base.json) | Droits, RLS, contraintes, index, triggers et limites du bucket |
| [preuves-npm-audit.json](preuves-npm-audit.json) | Résultat complet du dernier audit npm |
| [preuves-dependances.json](preuves-dependances.json) | Arbre installé des dépendances examinées |
| [preuves-build.txt](preuves-build.txt) | Build du code copié sans modification métier |
| [preuves-build-fixtures.txt](preuves-build-fixtures.txt) | Build avec fixtures synthétiques dans la copie uniquement |

Les fichiers HTML `fixture-*.html` contiennent exclusivement les données fictives de l’audit. Ils ne sont pas des exports de clients réels.

Les scripts `verification.mjs`, `inspect-http.mjs`, `prepare-private-fixtures.mjs` et `inspect-private-stream.mjs` permettent de comprendre et répéter les contrôles. Le script `inspect-database.mjs` utilise la configuration locale et nécessite l’autorisation d’accès à la base ; il ne doit pas être intégré à l’application ni à une route publique.

Pour les reproductions en mémoire, depuis la racine du dépôt :

```powershell
node outputs/audit-2026-09-07/verification.mjs
```

Pour les tests HTTP, recréer une copie isolée de `src`, `public`, `prisma`, des configurations Next/TypeScript et des manifests de paquets dans `work/audit-2026-09-07-app`, sans `.env.local`. Construire cette copie avec `KAYART_DATA_SOURCE=mock`, puis la démarrer sur `127.0.0.1:3107`. Le test de fuite utilise ensuite les fixtures du script prévu, suivies d’un nouveau build de cette seule copie. Les processus de test ont été arrêtés après vérification.

Cet audit ne constitue pas une garantie d’absence de toute faille. Il fournit un état argumenté du dépôt examiné et une liste de critères vérifiables pour le compléter.
