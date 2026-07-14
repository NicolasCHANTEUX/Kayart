# Database

Ce dossier contient les premiers contrats de base de donnees pour KayArt.

## Fichier actuel

- `schema-v1.sql` : brouillon PostgreSQL/Supabase pour la V1.

## Principes

- L'achat invite doit etre possible : une commande peut exister avec `guest_email`, sans compte client.
- Un futur compte client pourra etre rattache plus tard via `customers.auth_user_id`.
- Les demandes reparation et sur-mesure sont separees pour eviter un formulaire unique trop flou.
- Les medias peuvent etre publics ou prives.
- Les paiements Stripe sont suivis dans `orders` via les identifiants Checkout/PaymentIntent.
- Les actions sensibles pourront etre journalisees dans `audit_logs`.

## Avant production

Il faudra encore definir :

- les politiques RLS Supabase ;
- les triggers `updated_at` ;
- la strategie de numerotation des commandes ;
- la strategie exacte de facturation ;
- les migrations versionnees ;
- les seeds de developpement ;
- la politique de conservation des fichiers de demandes.
