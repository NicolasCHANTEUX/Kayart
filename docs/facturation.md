# Facturation : mise en service

La facturation est livrée **désactivée**. Elle ne doit être activée qu’après application de la migration, configuration du stockage privé et validation des informations juridiques et fiscales réelles de KayArt par l’expert-comptable. Les contrôles techniques vérifient la présence et le format des données ; ils ne certifient ni le régime fiscal choisi ni la conformité comptable du contenu.

## 1. Appliquer la migration

Sauvegarder la base, vérifier la cible et l’état des migrations, puis appliquer l’historique versionné :

```sh
npx prisma migrate status
npx prisma migrate deploy
```

La migration `20260929_invoices` crée les factures, le compteur annuel `FA`, les contraintes d’intégrité, l’index d’audit, les protections RLS et le verrou d’immutabilité. **Ne pas utiliser `prisma db push`** : il ne remplace pas le SQL spécialisé de la migration. Si le rôle `kayart_app` est provisionné séparément, réappliquer ensuite [sa procédure](runtime-role-activation.md) afin de garantir les droits minimaux décrits dans `database/runtime-role.sql`.

## 2. Configurer des valeurs réelles

Conserver `KAYART_INVOICING_ENABLED=false` jusqu’au dernier contrôle. Renseigner les variables exactes suivantes dans l’environnement serveur :

| Variable | Attendu |
| --- | --- |
| `KAYART_INVOICE_SIRET` | SIRET réel de l’émetteur, 14 chiffres |
| `KAYART_INVOICE_TAX_REGIME` | `franchise` ou `vat`, selon le régime validé |
| `KAYART_INVOICE_VAT_NUMBER` | Numéro de TVA réel, obligatoire avec le régime `vat` |
| `KAYART_INVOICE_VAT_RATE_BPS` | Taux validé en points de base, obligatoire avec le régime `vat` |
| `KAYART_INVOICE_OPERATION_CATEGORY` | Catégorie réelle des opérations facturées |
| `KAYART_INVOICE_PAYMENT_TERMS` | Conditions et échéances de paiement validées |
| `KAYART_INVOICE_LEGAL_NOTICES` | Mentions complémentaires applicables |
| `SUPABASE_INVOICE_BUCKET` | Nom du bucket privé réservé aux factures |

L’identité vendeur provient aussi de la configuration légale commune : `KAYART_LEGAL_APPROVED`, `KAYART_LEGAL_NAME`, `KAYART_LEGAL_FORM`, `KAYART_LEGAL_ADDRESS`, `KAYART_LEGAL_REGISTRATION` et `KAYART_LEGAL_TAX_STATEMENT`. Ne saisir aucune valeur de démonstration, aucun taux supposé et aucune mention fiscale générique. Faire valider l’ensemble, puis seulement définir `KAYART_INVOICING_ENABLED=true` et redéployer.

## 3. Créer le bucket privé

Le script utilise `SUPABASE_URL`, une clé serveur Supabase et `SUPABASE_INVOICE_BUCKET`. Il crée ou configure un bucket privé limité aux PDF de 10 Mio et refuse de réutiliser un bucket qui a été public :

```sh
node scripts/configure-invoice-storage.mjs --apply
node scripts/configure-invoice-storage.mjs --check
```

Le contrôle `--check` doit réussir sur l’environnement réellement déployé. Les factures ne doivent jamais être servies par une URL publique ; leur téléchargement reste soumis à l’authentification administrateur.

## 4. Règles d’émission

Une facture ne peut être émise que pour une commande PostgreSQL réelle, en euros, payée avec une date de paiement, non annulée et non remboursée. Le nom, l’e-mail et l’adresse de facturation doivent être complets et les lignes et totaux cohérents.

- Une commande `isTest=true` ne produit jamais de facture comptable.
- Une commande impayée ne produit jamais de facture.
- Un double clic ou une reprise renvoie la facture déjà liée à la commande : une commande ne reçoit qu’un numéro.
- Le compteur `FA-AAAA-NNNNNN` est verrouillé et incrémenté dans la même transaction que le snapshot. Un rollback ne consomme pas le numéro.
- Après émission, les identités, lignes, montants, dates et mentions fiscales sont figés. Le trigger SQL n’autorise que l’évolution des métadonnées d’archivage.
- Si la génération ou le stockage échoue, le numéro reste réservé et l’archivage passe en échec ; une reprise utilise la même facture, sans recréer de numéro.
- Le PDF est relu après stockage et son SHA-256 est enregistré. Ce hash aide à détecter une altération, mais ne constitue ni une signature électronique qualifiée, ni un horodatage qualifié, ni un système d’archivage certifié.

Ne pas créer une fausse vente « pour essayer » dans la séquence comptable réelle. Tester le rendu et les erreurs avec les tests automatisés ; après activation, réserver l’émission à une véritable commande éligible. Une correction ou un remboursement postérieur devra passer par un avoir ou une procédure comptable dédiée, non implémentée dans cette version.

## Conservation et limites

Les factures clients et fournisseurs sont des pièces justificatives à conserver pendant **10 ans à compter de la clôture de l’exercice**. Le bucket privé ne remplace pas une politique de conservation : sauvegarde, restauration testée, contrôle des accès, traçabilité et maintien de la lisibilité restent à organiser. La suppression d’un compte client ne doit pas entraîner automatiquement celle de ses factures. Voir la fiche officielle [Délais de conservation des documents pour les entreprises](https://entreprendre.service-public.fr/vosdroits/F10029).

Le PDF KayArt est une représentation lisible et archivée des données figées. Il n’implémente pas à lui seul la facturation électronique structurée, une plateforme agréée, l’e-reporting, UBL/CII ou un format mixte. Le ministère rappelle qu’un PDF ordinaire envoyé par courriel ne répond pas à la nouvelle définition de la facture électronique ; il faut déterminer avec l’expert-comptable les obligations applicables à KayArt et prévoir une intégration structurée distincte. Voir [Tout savoir sur la facturation électronique pour les entreprises](https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises).
