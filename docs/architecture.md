# Architecture KayArt

Les routes Next rendent les pages ou re?oivent les requ?tes. Les Server Actions v?rifient l?origine, analysent les formulaires et appellent les services. Les services administratifs v?rifient l?autorisation avant d?acc?der au repository ou ? Prisma.

## Donn?es et identit?s

Le catalogue utilise un repository mock ou Prisma selon `KAYART_DATA_SOURCE`. Les donn?es publiques sont filtr?es c?t? serveur ; un brouillon ne doit pas ?tre s?rialis? dans le HTML ou une r?ponse RSC.

L?identit? est v?rifi?e aupr?s de Supabase Auth. Le r?le vient du lien `customers.auth_user_id` vers cet identifiant v?rifi?. L?email et les revendications du JWT ne donnent pas de droits. Le middleware renouvelle les cookies ; il ne remplace pas les contr?les des services.

## Parcours

- Demandes : validation, limites anti-abus, photos priv?es, transaction d?enregistrement, suivi admin avec contr?le de conflit.
- Produits : saisie admin, validation m?tier, images r?encod?es et re?us sign?s, enregistrement transactionnel ; les imparfaits conservent leurs d?fauts et m?dias propres.
- Checkout test : recalcul serveur, r?servation de stock et commande, session Stripe idempotente, confirmation par webhook sign? ou r?conciliation. La page de retour ne marque jamais une commande pay?e.
- Livraison : retrait gratuit et zones administr?es ; aucun tarif valide signifie aucune option automatique pour cette destination.

Les composants clients g?rent les interactions locales ; ils ne d?cident pas du prix ni des droits. Les styles sont dans `src/styles`. Les tests unitaires remplacent des fronti?res externes ; les tests HTTP utilisent un v?ritable build avec donn?es simul?es et Auth local. Stripe et les comptes r?els demandent une recette suppl?mentaire.
