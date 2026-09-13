# Sécurité et accès

Les gardes des services administratifs vérifient une identité Supabase et son rôle lié par identifiant Auth avant l’accès aux données. Les cookies sont HttpOnly ; le renouvellement ne transforme jamais une revendication JWT en rôle. La protection d’une page ou l’absence d’un lien ne remplace pas le contrôle de chaque opération.

## Diagnostiquer un accès administrateur

Un administrateur connecté voit la barre d’accès aux produits, commandes, demandes et livraison. Un client qui demande `/admin` arrive sur une explication de refus, avec l’identité connectée et une action de déconnexion. Un visiteur anonyme doit se connecter.

`node scripts/check-admin-access.mjs --email adresse-du-compte` vérifie en lecture seule le rôle et le rattachement du seul compte demandé. Il ne modifie aucun droit et n’affiche ni credentials ni tokens. Selon les droits disponibles, il compare le lien à Auth par SQL ou par l’API d’administration Supabase. Un résultat non vérifié n’est pas un résultat valide : contrôler alors dans l’outil d’administration autorisé.

Le 13 septembre, le compte indiqué par l’exploitant a été trouvé admin, correctement lié et confirmé ; après reconnexion, l’exploitant a confirmé l’ouverture de l’administration. Aucune promotion ni association automatique par email n’a été ajoutée.

## Contrôles en place et limites

- Origine des actions, validation serveur, limites de taille et anti-abus.
- Images décodées/réencodées, reçus signés, photos de demandes privées avec contrôle d’accès.
- Transactions, prix serveur, idempotence et signatures Stripe pour les paiements de test.
- RLS, contraintes, index et droits : voir [le durcissement DB](database-hardening.md) ; les fichiers ne prouvent pas l’état d’un nouvel environnement.
- CSP et autres en-têtes présents ; `script-src 'unsafe-inline'` reste à remplacer par une stratégie nonce/hash testée avec Next avant de déclarer la CSP stricte.
- `unsafe-eval` est autorisé uniquement avec `NODE_ENV=development`, pour le runtime local de Next.js. Les tests vérifient son absence en production et l’ouverture réelle du menu administrateur en développement ; voir [le correctif](admin-menu-fix.md).
- AuditLog existe au schéma sans journalisation applicative systématique ; conservation et purge des médias restent à définir.
- Les tests automatisés et l’audit de dépendances ne constituent pas une certification de sécurité ni un test d’intrusion complet.

Le lint repose sur la [configuration officielle Next 15](https://nextjs.org/docs/15/pages/api-reference/config/eslint). ESLint 9 est utilisé pour rester compatible avec cette branche ; sa fin de support est un point à traiter lors de la mise à niveau coordonnée de Next et de son outillage. Le seul affichage `<img>` commun garde les requêtes natives pour les images privées et les aperçus blob ; les images envoyées sont déjà réencodées côté serveur. L’exception à la règle Next est localisée et commentée.
