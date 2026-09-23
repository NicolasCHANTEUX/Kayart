# KayArt — Configuration et recette V1

Mise à jour le 9 septembre 2026. Le parcours implémenté utilise exclusivement Stripe **test**. Une clé `sk_live_` ou `rk_live_` est refusée. Aucun compte Stripe n’a été choisi ou connecté par l’agent.

## Environnements et activation

1. Déployer le code et appliquer les migrations avec `npx prisma migrate deploy`. Ne pas utiliser `db push` pour remplacer les migrations contenant les contraintes et RLS.
2. Pour la recette de paiement, utiliser une base/catalogue isolés : même en mode test, une tentative réserve le stock et un paiement confirmé le consomme. Ne pas activer ce mode sur le stock destiné aux clients réels.
3. Renseigner directement dans les variables de déploiement du compte KayArt : `STRIPE_SECRET_KEY` de test, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` de test, `KAYART_DATA_SOURCE=prisma`, `KAYART_CHECKOUT_MODE=test` et `NEXT_PUBLIC_SITE_URL` correspondant au site de recette. Le checkout hébergé utilise la clé serveur ; la clé publique est prévue sans être nécessaire à la redirection actuelle.
4. Configurer le webhook Stripe test vers `/api/stripe/webhook` pour `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Aucun secret dans Git, les rapports ou la conversation.
5. Définir `CRON_SECRET`, puis activer le workflow GitHub d’expiration préparé selon le [guide d’activation](activation-priorites.md). Il appelle `/api/cron/checkouts` et signale les compteurs `failed` et `needsReview` par un échec d’exécution ; il ne déclenche pas d’email personnalisé. La planification reste inactive sans configuration explicite.

Les sessions expirent après une heure. Le stock est libéré seulement après une expiration/annulation Stripe vérifiée, ou un refus explicite de création par Stripe. Une panne réseau ambiguë conserve la réservation : reprendre exactement la même tentative permet de réutiliser la clé d’idempotence. Si aucun identifiant de session n’a pu être enregistré et que la reprise n’est plus possible, une vérification manuelle dans Stripe est nécessaire avant toute libération. Le traitement périodique fait tourner les tentatives pour éviter qu’un groupe en erreur bloque les suivantes.

La page de retour ne confirme jamais le paiement : elle affiche l’état enregistré après vérification Stripe. Une fois le paiement confirmé, les articles correspondants sont retirés du panier du navigateur qui avait lancé cette tentative. Aucun email de commande ni remboursement n’est envoyé automatiquement.

## Livraison et retrait

Le retrait atelier est gratuit, sur rendez-vous. Aucune adresse d’atelier fictive n’est affichée.

`/admin/livraison` permet de créer et modifier les zones, pays ISO, préfixes postaux inclus/exclus et prix en euros. Les montants sont conservés en centimes. Un tarif vide ou nul ne peut pas être activé. Aucun seuil de gratuité n’existe.

La migration initialise uniquement « France métropolitaine », désactivée et sans prix, avec exclusion des préfixes `20`, `97`, `98`. Corse, outre-mer et international restent sur devis tant qu’aucune règle explicite n’est activée. Les autres pays peuvent être ajoutés depuis cette administration sans modifier le checkout.

Chaque produit a un mode : transport sur devis (valeur prudente par défaut), retrait uniquement, ou expédiable. Une livraison automatique n’est proposée que si **tous** les articles sont expédiables et qu’une zone active correspond. Kayaks, pièces longues ou volumineuses doivent conserver « sur devis » jusqu’à validation du transport ; services et produits personnalisables passent par une demande.

## Demandes et photos

Contact, réparation et sur-mesure enregistrent les demandes et leur accusé de lecture de l’information sur les données. L’administration `/admin/demandes` filtre et pagine les demandes, avec les états nouvelle, en cours, répondue et clôturée. Changer l’état ne transmet aucun message au client.

Le bucket `request-images` doit être privé et autoriser 5 Mo par fichier : `node scripts/configure-request-storage.mjs --check` vérifie sa configuration ; `--apply` le crée/configure et refuse de réutiliser un bucket public. Jusqu’à trois photos fixes de 5 Mo, décodées et reconverties en WebP. Leur lecture passe par une route réservée aux administrateurs. Les limites anti-spam sont persistantes et les identifiants de limitation sont hachés par HMAC ; `REQUEST_RATE_LIMIT_SECRET` permet une clé dédiée.

## Publication légale

La configuration centrale est `src/config/legal.ts`. Toutes les variables sont répertoriées dans `.env.example`. Les seuls renseignements confirmés intégrés sont KayArt, contact.kayart@gmail.com et +33 6 64 63 15 43.

Les mentions légales, CGV et confidentialité renvoient HTTP 404 et sont absentes du footer tant que la configuration est incomplète, contient une ancienne identité de maquette, ou que `KAYART_LEGAL_APPROVED` n’est pas `true`. Il faut renseigner les données réelles, relire les textes applicables, puis approuver explicitement. Ce contrôle technique vérifie la présence et les maquettes connues ; il ne certifie pas la validité juridique des valeurs fournies.

`KAYART_STANDARD_TERMS` et `KAYART_CUSTOM_TERMS` séparent les conditions des produits standards de celles des biens réellement personnalisés, notamment les règles de rétractation à faire valider. Ne pas activer les pages avec des valeurs de remplissage. Les informations de collecte des formulaires devront également être complétées avec les bases, durées et destinataires réels avant exploitation commerciale.

## Recette restant à faire avec le compte Stripe

- Paiement test réussi puis webhook retardé/rejoué ; une seule commande payée et un seul mouvement de stock.
- Refus de carte, abandon, expiration, retour au panier, reprise et annulation ; remise en stock uniquement après confirmation.
- Deux navigateurs convoitent le dernier exemplaire sur la base isolée ; une seule réservation réussit.
- Tarif absent, France configurée, Corse/outre-mer exclus, panier mêlant produit expédiable et transport spécial.
- Administration connectée : demandes avec photos, accès refusé à un compte client, suivi préparation/retrait/expédition.
- Recette visuelle desktop/mobile, clavier et lecteur d’écran. Aucun navigateur pilotable n’était disponible pendant les contrôles automatisés.

Références techniques : [création Checkout Stripe](https://docs.stripe.com/api/checkout/sessions/create), [expiration](https://docs.stripe.com/api/checkout/sessions/expire), [signature webhook](https://docs.stripe.com/webhooks/signature).
