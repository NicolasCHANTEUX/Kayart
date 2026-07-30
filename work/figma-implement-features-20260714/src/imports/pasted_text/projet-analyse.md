# Analyse exhaustive du projet `APP-WEB-Vincent-2`

J’ai analysé la branche `main` dans son état actuel, au commit `4409c6b3c68eaead2adf35c15eb8f4ffb8079224` du **4 avril 2026**. L’analyse repose sur les routes, contrôleurs, modèles, bibliothèques, migrations, filtres, helpers, vues et scripts JavaScript présents dans le dépôt.

Je n’ai pas démarré l’application avec sa véritable base de données, ses variables d’environnement, Stripe et son serveur SMTP. Par conséquent :

* **Implémenté** signifie que le parcours existe dans le code et possède une route explicite.
* **Partiel** signifie qu’une interface, un modèle ou une méthode existe, mais que le parcours n’est pas entièrement relié.
* **Prévu** signifie que la base de données ou l’architecture anticipe la fonctionnalité sans l’exposer actuellement.

## 1. Ce qu’est réellement ce projet

Ce n’est pas uniquement un site vitrine. C’est une **application web e-commerce et éditoriale complète pour KayArt**, centrée sur des produits artisanaux liés notamment au carbone, aux pagaies, aux kayaks et aux prestations de réparation ou de fabrication.

Elle contient six grands systèmes :

1. un site vitrine bilingue ;
2. un catalogue de produits neufs, d’occasion et de services ;
3. une boutique avec panier, Stripe, commandes et factures ;
4. un système de réservations et de demandes clients ;
5. un blog avec commentaires modérés ;
6. un back-office d’administration.

Le projet est inachevé, mais il est déjà beaucoup plus étendu qu’un simple projet CRUD débutant.

---

# 2. Architecture générale

## 2.1 Technologies utilisées

Le projet repose principalement sur :

* **PHP 8.1 ou supérieur** ;
* **CodeIgniter 4** comme framework MVC ;
* **Tailwind CSS 3.4** pour le design ;
* du **JavaScript natif** pour les interactions dynamiques ;
* **Stripe PHP** et Stripe Checkout pour le paiement ;
* **Dompdf** pour les factures PDF ;
* le composant Email de CodeIgniter pour les emails ;
* **Leaflet et OpenStreetMap** pour la carte ;
* **Lucide Icons** pour les icônes ;
* une base de données relationnelle administrée à travers CodeIgniter.

## 2.2 Organisation des dossiers

L’application suit cette organisation logique :

```text
app/
├── Config/              Configuration, routes, filtres, sessions
├── Controllers/         Traitement des requêtes publiques et administratives
├── Models/              Accès aux données et logique de requêtes
├── Libraries/           Panier, images, facturation PDF
├── Views/
│   ├── layouts/         Structure générale des pages
│   ├── pages/           Pages complètes
│   └── components/      Sections et éléments réutilisables
├── Cells/               Composants CodeIgniter réutilisables
├── Filters/             Authentification admin, cache, langue
├── Helpers/             Traductions, images de blog, fonctions diverses
├── Language/            Textes français et anglais
├── Database/
│   └── Migrations/      Création et évolution des tables
└── Commands/            Commandes CLI de développement
```

Le flux principal est :

```text
Navigateur
    ↓
Routes CodeIgniter
    ↓
Contrôleur
    ↓
Modèles et bibliothèques métier
    ↓
Base de données / Stripe / Email / fichiers
    ↓
Vue PHP + composants + JavaScript
```

L’application est donc rendue côté serveur. Ce n’est pas une SPA React, Vue ou Angular. Les comportements dynamiques sont ajoutés avec du JavaScript directement dans les vues.

## 2.3 Découpage des contrôleurs

### Partie publique

* `Home`
* `ProduitsControler`
* `ServicesControler`
* `ContactControler`
* `ConnexionControler`
* `AuthController`
* `BlogController`
* `CartController`
* `CheckoutController`
* `MediaController`
* `SitemapController`
* `PagesController`

### Partie administration

* `AdminDashboardController`
* `AdminProduitsController`
* `AdminReservationsController`
* `AdminCommandesController`
* `AdminDemandesController`
* `AdminBlogController`

### Outils de développement

* `TestLog`
* `SessionTest`
* la commande CLI `test:contact`

---

# 3. Les types d’utilisateurs

## 3.1 Visiteur ou client non connecté

Un client peut :

* consulter tout le site ;
* rechercher des produits ;
* acheter sans créer de compte ;
* réserver un produit d’occasion ;
* demander à être averti d’un retour en stock ;
* envoyer une demande de contact ;
* publier un commentaire sur un article.

Le panier est conservé dans la session.

## 3.2 Administrateur

L’administrateur peut accéder au back-office après authentification.

L’identification repose actuellement sur une adresse email et un hash de mot de passe fournis dans les variables d’environnement. Une fois authentifié, le système place notamment `is_admin` dans la session.

Toutes les URL `/admin` et `/admin/*` sont protégées par le filtre `adminauth`. Un utilisateur non authentifié est redirigé vers la page de connexion.

## 3.3 Comptes clients

Il n’existe actuellement **aucune inscription client, aucun espace personnel et aucune connexion client**.

Une table `user` avec des rôles `admin` et `editor` existe pourtant dans les migrations, mais elle n’est pas utilisée par le système d’authentification actuel.

---

# 4. Structure visuelle commune

## 4.1 Mise en page globale

Toutes les pages principales héritent d’un layout racine qui gère :

* le titre de page ;
* la langue HTML ;
* les métadonnées ;
* la barre de navigation ;
* le pied de page ;
* les messages temporaires de succès ou d’erreur ;
* le chargement différé des icônes Lucide ;
* les données structurées ;
* les scripts communs.

Les messages temporaires peuvent être automatiquement masqués après affichage. Le chargement des icônes est différé pour diminuer le travail initial du navigateur.

## 4.2 Barre de navigation

La navigation propose notamment :

* Accueil ;
* Produits ;
* Services ;
* Contact ;
* Actualités ;
* Connexion administrateur ;
* Dashboard et déconnexion quand un administrateur est connecté ;
* changement de langue français/anglais ;
* menu mobile ;
* aperçu du panier.

Le menu mobile est ouvert ou fermé avec un bouton JavaScript.

## 4.3 Aperçu du panier dans la navigation

Lorsque le panier contient des produits :

* une icône panier apparaît ;
* un badge indique le nombre de lignes ;
* un menu s’ouvre au survol ;
* les produits, quantités, remises et sous-totaux sont affichés ;
* le total TTC est affiché ;
* les données sont rechargées automatiquement ;
* le rafraîchissement s’arrête quand l’onglet est masqué ;
* l’événement JavaScript `cart-updated` déclenche une mise à jour immédiate.

La version intégrée à la navigation interroge le panier toutes les 30 secondes.

Une seconde implémentation de panier flottant existe également dans les composants. Elle contient :

* un bouton fixe animé ;
* un badge ;
* un aperçu au survol ;
* la liste des articles ;
* le total ;
* un rafraîchissement toutes les cinq secondes.

Cette seconde version semble être une variante ou une ancienne expérimentation de la même fonctionnalité.

## 4.4 Pied de page

Le pied de page affiche :

* le logo et le slogan KayArt ;
* les liens principaux ;
* un accès à la FAQ ;
* l’adresse ;
* le téléphone ;
* l’email ;
* les liens Instagram, Facebook et LinkedIn ;
* des éléments de réassurance sur Stripe, l’expédition suivie et l’accompagnement humain.

---

# 5. Gestion bilingue français/anglais

Le site possède un système de traduction personnalisé.

La langue peut être sélectionnée avec :

```text
?lang=fr
?lang=en
```

Elle est ensuite conservée dans un cookie pendant un an. En l’absence de paramètre ou de cookie valide, le français est utilisé.

La fonction `trans()` charge les textes depuis :

```text
app/Language/fr/Texts.php
app/Language/en/Texts.php
```

Le bouton de la barre de navigation mémorise également la langue dans `localStorage` et reconstruit l’URL courante avec le nouveau paramètre.

D’anciennes URL sont prises en charge :

* `/fr`
* `/en`
* `/fr/produits`
* `/en/contact`
* `/produits/lang/fr`

Elles sont redirigées vers les nouvelles URL avec `?lang=...`.

---

# 6. Page d’accueil

La page d’accueil est assemblée à partir de plusieurs composants indépendants :

1. un Hero ;
2. une section de bienvenue ;
3. une section consacrée aux pièces uniques ;
4. une section autour de l’art et du carbone ;
5. une section consacrée à la réparation ;
6. une FAQ.

## 6.1 Hero

Le Hero prend en charge :

* un titre traduit ;
* un sous-titre traduit ;
* le logo KayArt ;
* une image d’arrière-plan ;
* une intensité de flou configurable ;
* une hauteur configurable.

## 6.2 FAQ de l’accueil

La FAQ contient cinq questions/réponses.

Elle possède :

* une ouverture et fermeture en accordéon ;
* une flèche animée ;
* des attributs d’accessibilité `aria-expanded` ;
* des liens vers les produits ou le contact ;
* des données structurées `FAQPage` pour Google.

---

# 7. Page Services

Une page dédiée présente quatre familles de prestations :

1. fabrication sur mesure ;
2. réparation et rénovation ;
3. optimisation ;
4. conseil et expertise.

Chaque service possède une icône, un titre et une description. La page se termine par un appel à l’action vers le formulaire de contact.

Il faut distinguer cette page de présentation de la catégorie de produits « Service » du catalogue, qui peut contenir des services réellement achetables.

---

# 8. Catalogue de produits

## 8.1 Affichage des produits

Le catalogue affiche les produits sous forme de cartes.

Chaque produit peut comporter :

* un titre ;
* un slug ;
* une référence SKU ;
* une description ;
* un prix ;
* une réduction en pourcentage ;
* une catégorie ;
* un état neuf ou occasion ;
* un stock ;
* un poids ;
* des dimensions ;
* plusieurs images ;
* une image principale ;
* un statut actif ou inactif ;
* des dates de création et de modification.

## 8.2 Catégories dynamiques

Les catégories viennent de la base de données.

La barre latérale permet de :

* afficher tous les produits ;
* sélectionner une catégorie ;
* conserver la langue choisie ;
* revenir facilement au catalogue complet.

Une catégorie indique notamment un nom, un slug et éventuellement une description.

## 8.3 Filtre produits d’occasion

Un bouton « Seconde Main » affiche uniquement les produits marqués comme occasion.

Lorsqu’il est sélectionné :

* le filtre de catégorie est retiré ;
* le catalogue bascule sur les produits d’occasion ;
* l’état actif est représenté visuellement.

## 8.4 Recherche

Une barre permet de rechercher un produit par texte.

La recherche porte sur les informations telles que :

* le titre ;
* la description.

Elle conserve :

* la langue ;
* la catégorie sélectionnée ;
* le filtre occasion.

Une croix permet de supprimer le texte recherché.

## 8.5 Pagination et chargement progressif

Le catalogue charge initialement un nombre limité de produits.

Un bouton « Voir plus de produits » :

* appelle `/produits/load-more` en AJAX ;
* transmet la page suivante ;
* conserve la catégorie ;
* ajoute les nouvelles cartes sans recharger toute la page ;
* actualise le compteur ;
* disparaît quand tous les produits sont affichés ;
* présente un état « Chargement… » ;
* affiche un message en cas d’erreur.

## 8.6 Règles d’affichage métier

Le code différencie plusieurs situations :

* les produits inactifs ne sont pas destinés à être affichés ;
* un produit neuf sans stock peut rester visible afin que le client demande une alerte ;
* un produit d’occasion déjà vendu n’est plus destiné au catalogue ;
* les services peuvent être disponibles sans quantité de stock traditionnelle ;
* les réductions sont calculées à partir d’un pourcentage.

---

# 9. Fiche détaillée d’un produit

## 9.1 Informations affichées

La fiche affiche :

* le titre ;
* la description ;
* le prix ;
* le prix barré en cas de promotion ;
* le prix remisé ;
* le pourcentage de réduction ;
* le SKU ;
* l’état neuf ou occasion ;
* le poids ;
* les dimensions ;
* la catégorie ;
* la date d’ajout ;
* le niveau de stock ;
* des arguments de réassurance ;
* les produits apparentés.

## 9.2 Badges

Plusieurs badges peuvent apparaître :

* « Nouveau » lorsque le produit a moins de trente jours ;
* « Neuf » ;
* « Occasion » ;
* disponible ;
* stock limité ;
* rupture de stock.

Le stock est présenté selon trois niveaux :

* supérieur à dix ;
* compris entre un et dix ;
* égal à zéro.

## 9.3 Galerie d’images

La fiche prend en charge :

* une image principale ;
* plusieurs miniatures ;
* le changement d’image principale en cliquant sur une miniature ;
* un `srcset` adapté aux différentes tailles d’écran ;
* une version miniature ;
* une version intermédiaire ;
* une version originale ;
* un remplacement par une image par défaut en cas d’erreur.

## 9.4 Lightbox et zoom

Le bouton d’agrandissement ouvre une lightbox plein écran.

Cette lightbox permet :

* de voir la version originale ;
* de zoomer à 200 % en cliquant ;
* de dézoomer ;
* de fermer en cliquant sur le fond ;
* de fermer avec le bouton ;
* de fermer avec la touche Échap ;
* de bloquer le défilement de la page pendant l’ouverture ;
* de conserver l’image choisie dans la galerie.

## 9.5 FAQ produit

Le contrôleur peut fournir une FAQ spécifique sur certaines fiches produits.

Cette FAQ n’est pas administrable depuis le back-office : elle est actuellement configurée dans le code pour un petit ensemble de produits identifiés directement.

## 9.6 Produits apparentés

La fiche peut afficher jusqu’à quatre produits apparentés avec :

* leur image ;
* leur titre ;
* leur catégorie ;
* leur prix ;
* leur éventuel prix remisé ;
* un lien vers leur fiche.

## 9.7 Trois comportements selon le type de produit

### Produit neuf disponible

Le client peut :

* sélectionner une quantité ;
* utiliser les boutons plus et moins ;
* être limité par le stock disponible ;
* ajouter le produit au panier en AJAX ;
* voir une animation de chargement ;
* voir la confirmation « Ajouté ! » ;
* provoquer le rafraîchissement automatique du panier.

### Service

Un produit appartenant à la catégorie Service :

* est traité comme neuf ;
* n’est pas limité par un stock physique ;
* peut être ajouté au panier ;
* peut être payé avec Stripe.

### Produit d’occasion

Le produit d’occasion n’est pas ajouté directement au panier.

La fiche affiche un formulaire de réservation contenant :

* nom ;
* email ;
* téléphone facultatif ;
* message facultatif ;
* quantité fixée à un ;
* validation ;
* messages d’erreur ;
* mention de confidentialité.

### Produit neuf en rupture

La fiche affiche un formulaire d’alerte avec :

* l’email ;
* l’identifiant du produit ;
* le slug ;
* un bouton pour demander une notification.

---

# 10. Traitement des images de produits

Le projet possède une véritable bibliothèque de traitement d’images.

## 10.1 Contraintes

Elle accepte :

* JPEG ;
* PNG ;
* WebP.

Elle contrôle notamment :

* le type ;
* la validité ;
* une taille maximale d’environ 10 Mo ;
* une limite de six images par produit.

## 10.2 Transformations automatiques

Lors d’un téléversement :

* l’orientation EXIF peut être corrigée ;
* le nom est normalisé à partir du SKU ;
* les images sont converties en WebP ;
* trois versions sont générées.

Les formats prévus sont approximativement :

* **original** : jusqu’à 1920 pixels, qualité élevée ;
* **format1** : environ 800 pixels ;
* **format2** : environ 350 pixels pour les miniatures.

## 10.3 Gestion des fichiers

La bibliothèque sait également :

* retrouver l’URL d’une image ;
* générer les informations responsive ;
* utiliser une image par défaut ;
* supprimer les trois formats ;
* supprimer toutes les images d’un produit.

## 10.4 Images principales et ordre

Le modèle des images permet :

* de récupérer toutes les images dans l’ordre ;
* d’identifier l’image principale ;
* de prendre la première image comme secours ;
* de rendre une image principale ;
* de modifier les positions ;
* de connaître le prochain numéro disponible ;
* de supprimer une image ;
* de supprimer toute la galerie.

---

# 11. Panier

Le panier est stocké dans la session et ne nécessite aucun compte client.

## 11.1 Ajouter un produit

L’ajout :

* se fait en AJAX ;
* vérifie l’existence du produit ;
* refuse les produits d’occasion ;
* vérifie le stock pour les produits physiques ;
* accepte les services sans stock ;
* augmente la quantité si le produit existe déjà ;
* applique la réduction du produit ;
* conserve les informations nécessaires dans la session.

## 11.2 Modifier le panier

Le client peut :

* augmenter une quantité ;
* diminuer une quantité ;
* entrer une quantité manuellement ;
* retirer un article ;
* vider le panier ;
* revenir au catalogue.

Les actions de modification et de suppression sont envoyées au serveur en AJAX, puis la page est actualisée.

## 11.3 Informations affichées

Pour chaque ligne :

* image ;
* titre ;
* SKU ;
* prix unitaire ;
* remise ;
* ancien prix ;
* quantité ;
* sous-total.

## 11.4 Calculs

Le panier calcule :

* le sous-total ;
* le total hors taxes ;
* la TVA à 20 % ;
* le total TTC ;
* le nombre d’articles ;
* le poids total ;
* le sous-total de chaque ligne.

Le résumé présente distinctement le HT, la TVA et le TTC.

## 11.5 Vérification avant paiement

Avant le checkout, le système peut revérifier :

* que les produits existent toujours ;
* que les quantités sont encore disponibles ;
* que le prix et la réduction peuvent être recalculés ;
* que le panier n’est pas vide.

---

# 12. Checkout et paiement Stripe

## 12.1 Formulaire client

Le checkout demande :

* prénom ;
* nom ;
* email ;
* téléphone.

## 12.2 Adresse de livraison

Il demande également :

* adresse ;
* complément d’adresse facultatif ;
* ville ;
* code postal ;
* pays.

Les pays visibles sont :

* France ;
* Belgique ;
* Suisse ;
* Luxembourg ;
* Monaco.

Une case permet d’indiquer que l’adresse de livraison est également l’adresse de facturation.

## 12.3 Récapitulatif

Le client retrouve :

* chaque article ;
* l’image ;
* la quantité ;
* le prix remisé ;
* le total par ligne ;
* le total HT ;
* la TVA ;
* le total TTC ;
* les informations de réassurance.

## 12.4 Création de la session Stripe

Lors de la soumission :

1. le formulaire est envoyé à `/checkout/create-session` ;
2. le serveur vérifie les données et le stock ;
3. une session Stripe Checkout est créée ;
4. les lignes Stripe reprennent les produits et réductions ;
5. le navigateur est redirigé vers Stripe ;
6. le bouton affiche un état de chargement ;
7. les erreurs sont renvoyées au client.

Le moyen de paiement réellement exposé est la carte bancaire gérée par Stripe.

## 12.5 Retour de Stripe

Trois parcours sont prévus :

* succès du paiement ;
* annulation ;
* webhook Stripe.

La page d’annulation conserve le panier.

La page de succès vérifie que la session Stripe est payée avant de créer la commande.

Le webhook sait reconnaître notamment :

* une session Checkout terminée ;
* un paiement réussi ;
* un paiement échoué.

Les routes correspondantes sont explicitement déclarées.

---

# 13. Création d’une commande

Après un paiement confirmé, le système :

1. génère une référence de commande ;
2. enregistre les informations du client ;
3. enregistre l’adresse de livraison ;
4. enregistre l’adresse de facturation ;
5. enregistre le montant ;
6. enregistre l’identifiant de transaction Stripe ;
7. crée les lignes de commande ;
8. diminue le stock ;
9. crée une facture ;
10. génère le PDF ;
11. envoie un email de confirmation ;
12. joint la facture si elle a été générée ;
13. vide le panier.

## 13.1 Référence

Le format prévu ressemble à :

```text
CMD-2026-001
```

## 13.2 Commandes invitées

Le champ `user_id` peut être vide, ce qui autorise les commandes sans compte.

Les informations client et les adresses sont enregistrées sous forme de snapshots JSON. Cela permet de conserver les données utilisées au moment de la commande, même si elles changent ensuite.

## 13.3 Lignes de commande

Chaque ligne conserve une copie de :

* l’identifiant du produit ;
* son titre ;
* son SKU ;
* sa description ;
* son image ;
* son poids ;
* ses dimensions ;
* son prix ;
* son pourcentage de remise ;
* la quantité.

Ainsi, une modification ultérieure du produit ne doit pas modifier rétroactivement une ancienne commande.

## 13.4 Stock

Le stock est diminué pour les produits physiques.

Il n’est pas diminué pour les produits appartenant à la catégorie Service.

## 13.5 Statuts de commande

La base prévoit :

* `new` ;
* `processing` ;
* `shipped` ;
* `completed` ;
* `cancelled`.

## 13.6 Statuts de paiement

La base prévoit :

* `pending` ;
* `paid` ;
* `failed` ;
* `refunded`.

## 13.7 Moyens de paiement anticipés

La base de données anticipe :

* Stripe ;
* PayPal ;
* virement ;
* espèces ;
* autre.

Cependant, seul Stripe est actuellement connecté au parcours client.

---

# 14. Factures PDF

Le projet possède un véritable système de facturation.

## 14.1 Numérotation

Le format prévu ressemble à :

```text
2026-001
```

## 14.2 Informations stockées

Une facture contient notamment :

* l’identifiant de commande ;
* son numéro ;
* le montant HT ;
* la TVA ;
* le total TTC ;
* la date d’émission ;
* la date d’échéance ;
* le chemin vers le PDF ;
* la date d’envoi.

L’échéance est calculée environ trente jours après l’émission.

## 14.3 Contenu du PDF

Le document généré avec Dompdf reprend :

* les informations du vendeur ;
* les informations du client ;
* la référence de commande ;
* les lignes ;
* les quantités ;
* les prix ;
* les remises ;
* les totaux ;
* le statut de paiement ;
* les mentions de facturation.

## 14.4 Utilisations possibles

Le système sait :

* générer une facture ;
* la sauvegarder ;
* la diffuser au navigateur ;
* la régénérer ;
* l’attacher à un email ;
* marquer la facture comme envoyée.

---

# 15. Réservations de produits d’occasion

## 15.1 Création côté client

Le client envoie :

* son nom ;
* son email ;
* son téléphone ;
* un message ;
* le produit concerné ;
* une quantité fixée à un.

Le système :

* valide le produit ;
* valide les informations ;
* crée la réservation avec le statut `new` ;
* envoie un email à l’administrateur ;
* affiche un message au client.

## 15.2 Informations envoyées à l’administrateur

L’email peut contenir :

* le produit ;
* le client ;
* l’email ;
* le téléphone ;
* le message ;
* la date ;
* un lien vers l’administration.

## 15.3 Statuts prévus

Les réservations possèdent les états :

* nouvelle ;
* contactée ;
* confirmée ;
* terminée ;
* annulée.

Le modèle sait également :

* rechercher par statut ;
* rechercher par produit ;
* joindre les informations du produit et de sa catégorie ;
* calculer des statistiques ;
* marquer une réservation comme contactée.

## 15.4 État actuel du back-office réservation

La liste administrative est fonctionnelle :

* statistiques par statut ;
* onglets de filtrage ;
* informations client ;
* téléphone ;
* produit ;
* catégorie ;
* prix ;
* quantité ;
* date ;
* statut.

En revanche :

* le bouton de détail appelle encore une fonction JavaScript `TODO` ;
* le bouton de changement de statut appelle encore une fonction `TODO` ;
* les méthodes serveur correspondantes existent, mais ne disposent pas de routes explicites.

La consultation et la modification avancées sont donc **préparées mais pas entièrement reliées à l’interface**.

---

# 16. Alertes de retour en stock

## 16.1 Abonnement

Pour un produit neuf en rupture, le client peut fournir son email.

Le système :

* vérifie l’adresse ;
* vérifie que le produit existe ;
* vérifie qu’il est réellement en rupture ;
* évite les abonnements en double ;
* crée un token d’annulation ;
* enregistre la demande ;
* envoie un email de confirmation au client ;
* avertit l’administrateur.

## 16.2 Désabonnement

Le client peut ouvrir un lien contenant son token pour supprimer son alerte.

La route est de la forme :

```text
/produits/cancel-alert/{token}
```

## 16.3 Notification lors du réapprovisionnement

Lorsque l’administrateur modifie un produit et que son stock passe de zéro à une valeur positive :

* les abonnements non traités sont recherchés ;
* un email est envoyé aux personnes inscrites ;
* l’alerte est marquée comme notifiée.

C’est donc un parcours assez complet : inscription, confirmation, désabonnement et notification finale.

---

# 17. Formulaire de contact

## 17.1 Informations demandées

Le formulaire contient :

* nom ;
* email ;
* téléphone facultatif ;
* sujet ;
* message ;
* sélection multiple d’images ;
* champ honeypot invisible.

Les sujets proposés sont :

* demande de devis ;
* réparation ;
* autre.

## 17.2 Téléphone international

Le formulaire propose les indicatifs de plusieurs pays :

* France ;
* Belgique ;
* Suisse ;
* Royaume-Uni ;
* États-Unis ;
* Allemagne ;
* Espagne ;
* Italie ;
* Portugal ;
* Finlande ;
* Norvège ;
* République tchèque.

Le JavaScript :

* retire les caractères non numériques ;
* ajoute automatiquement des espaces ;
* applique un format particulier à la France ;
* utilise un format générique pour les autres pays ;
* combine l’indicatif et le numéro dans un champ caché.

## 17.3 Enregistrement et notification

Le contrôleur :

* valide les champs ;
* détecte le honeypot ;
* enregistre la demande en base ;
* lui attribue un statut initial ;
* envoie un email à l’administrateur ;
* configure l’adresse du client comme `Reply-To` ;
* affiche un message de réussite ou d’échec.

## 17.4 Pièces jointes

Le projet contient :

* un champ `images[]` dans le formulaire ;
* une table `contact_attachment` ;
* une relation vers la demande de contact ;
* le nom serveur et le nom d’origine du fichier.

Cependant, le contrôleur public actuel n’effectue pas encore le téléversement ni l’enregistrement de ces images.

Cette fonctionnalité est donc **préparée dans l’interface et la base, mais non terminée côté serveur**.

---

# 18. Carte interactive

La partie contact inclut une carte Leaflet utilisant OpenStreetMap.

Elle prend en charge :

* un ou plusieurs points ;
* des marqueurs colorés ;
* un point principal ;
* le centrage automatique ;
* l’ajustement de la carte à plusieurs points ;
* une infobulle ;
* l’ouverture automatique de l’infobulle principale ;
* un lien vers Google Maps ;
* un redimensionnement forcé pour éviter l’affichage gris.

Les coordonnées par défaut sont configurées autour de **Saint-Aubin-des-Coudrais**.

---

# 19. Gestion des demandes de contact dans l’administration

## 19.1 Liste

Le back-office peut présenter les demandes par état :

* nouvelle ;
* en cours ;
* terminée ;
* archivée.

Il affiche :

* le nom ;
* l’email ;
* le téléphone ;
* le sujet ;
* le message ;
* la date ;
* le statut.

## 19.2 Détail

Une page de détail existe avec les informations complètes de la demande.

## 19.3 Mise à jour du statut

Une route permet à l’administrateur de modifier le statut d’une demande :

```text
POST /admin/demandes/{id}/status
```

## 19.4 Réponse par email

Le contrôleur contient également une logique pour :

* écrire une réponse administrative ;
* l’enregistrer ;
* mémoriser la date de réponse ;
* passer la demande à l’état terminé ;
* envoyer un email mis en forme au client.

Cependant, aucune route explicite vers cette méthode de réponse n’apparaît dans le fichier de routes actuel. La logique existe donc, mais son branchement final n’est pas terminé. Les routes réellement déclarées sont la liste, le détail et la modification du statut.

---

# 20. Blog et actualités

## 20.1 Liste publique

La page Actualités affiche les articles publiés.

Elle prend en charge :

* une pagination d’environ neuf articles ;
* une image de couverture ;
* le titre ;
* un extrait ;
* la date ;
* le nombre de commentaires ;
* un lien vers la fiche.

L’extrait peut être :

* saisi manuellement ;
* généré automatiquement à partir du contenu.

## 20.2 Page d’article

Une page d’article contient :

* un fil d’Ariane ;
* le titre ;
* la date ;
* le nombre de commentaires ;
* l’image de couverture ;
* le contenu ;
* les blocs de contenu ;
* les commentaires approuvés ;
* un formulaire de commentaire ;
* un lien de retour aux actualités.

## 20.3 Contenu par blocs

Le blog peut utiliser deux formats :

1. l’ancien champ de contenu texte ;
2. le nouveau système de blocs ordonnés.

Les blocs peuvent être :

* un paragraphe ;
* un paragraphe avec sous-titre ;
* une image.

## 20.4 Commentaires visiteurs

Le formulaire de commentaire demande :

* nom obligatoire ;
* email facultatif ;
* contenu obligatoire ;
* maximum 1 000 caractères ;
* honeypot invisible.

Le JavaScript fournit :

* un compteur de caractères ;
* une couleur d’avertissement à l’approche de la limite ;
* une soumission AJAX ;
* un bouton en état de chargement ;
* un message de succès ou d’erreur ;
* une réinitialisation après succès.

## 20.5 Modération

Un commentaire est créé avec un statut en attente.

Le système prévoit :

* `pending` ;
* `approved` ;
* `rejected`.

Seuls les commentaires approuvés sont affichés publiquement.

Le modèle conserve aussi une compatibilité avec l’ancien champ `is_approved`.

## 20.6 Protection contre le spam

Le blog utilise :

* un honeypot ;
* une validation serveur ;
* un nettoyage du contenu ;
* une limitation temporelle d’environ quinze secondes entre deux commentaires dans une même session.

## 20.7 Notification administrateur

Lorsqu’un commentaire est envoyé, l’administrateur peut recevoir un email comprenant :

* l’auteur ;
* son email ;
* son adresse IP ;
* la date ;
* un extrait ;
* l’article concerné ;
* des liens vers la modération.

---

# 21. Administration du blog

## 21.1 Liste des articles

L’administration permet :

* d’afficher les articles ;
* de paginer la liste ;
* de voir leur état publié ou brouillon ;
* de connaître le nombre de commentaires à modérer ;
* d’accéder à la création ;
* d’accéder à la modification ;
* de supprimer un article.

## 21.2 Création et modification

Le formulaire propose :

* titre ;
* slug généré automatiquement ;
* image de couverture ;
* extrait facultatif ;
* publication immédiate ou brouillon ;
* éditeur de blocs.

## 21.3 Éditeur de blocs

L’administrateur peut :

* ajouter un paragraphe ;
* ajouter une image ;
* ajouter un sous-titre à un paragraphe ;
* insérer un paragraphe après un bloc ;
* insérer une image après un bloc ;
* supprimer un bloc ;
* conserver une ancienne image lors d’une modification ;
* prévisualiser une nouvelle image avant l’envoi ;
* ordonner les blocs selon leur position.

Le formulaire garantit qu’au moins un bloc paragraphe reste disponible.

## 21.4 Images de blog

Les images sont différenciées en :

* image de couverture ;
* miniature de couverture ;
* image de bloc.

Le `MediaController` peut servir les fichiers depuis un stockage interne, avec un fallback dans le dossier public et une image par défaut.

## 21.5 Suppression

La suppression d’un article peut également entraîner :

* la suppression de ses blocs ;
* la suppression de ses commentaires par relation ;
* la suppression de ses images associées.

## 21.6 Modération des commentaires

Le back-office possède des routes permettant de :

* afficher les commentaires ;
* approuver ;
* rejeter ;
* supprimer.

---

# 22. Authentification administrateur

La page `/connexion` permet à l’administrateur de s’identifier.

Le processus :

* récupère l’email ;
* récupère le mot de passe ;
* compare l’email à la configuration ;
* vérifie le mot de passe avec un hash ;
* régénère ou utilise la session ;
* mémorise l’état administrateur ;
* redirige vers le dashboard.

La déconnexion détruit la session et revient à l’accueil.

---

# 23. Dashboard administrateur

Le dashboard affiche notamment :

* le nombre total de produits ;
* le nombre total de réservations ou commandes suivies ;
* le nombre de nouvelles demandes ;
* un indicateur « Administration active » ;
* les demandes récentes ;
* les réservations ou commandes récentes.

Il fournit des raccourcis vers :

* les produits ;
* les commandes ;
* les réservations ;
* les demandes ;
* le blog.

La liste des demandes récentes affiche :

* client ;
* email ;
* date ;
* statut ;
* action de consultation.

---

# 24. Gestion administrative des produits

## 24.1 Liste et filtres

L’administrateur peut filtrer les produits selon :

* la catégorie ;
* l’état neuf ou occasion ;
* le stock ;
* les faibles stocks ;
* les stocks élevés ;
* les ruptures ;
* le titre ;
* le SKU.

La liste est paginée et triée par date récente.

## 24.2 Création guidée en quatre étapes

Le formulaire de création est un assistant en quatre parties.

### Étape 1 — Informations générales

* titre ;
* SKU ;
* catégorie ;
* description.

### Étape 2 — Tarification

* prix ;
* réduction ;
* état neuf ou occasion.

### Étape 3 — Caractéristiques physiques

* poids ;
* dimensions ;
* stock.

### Étape 4 — Images

* téléversement multiple ;
* aperçu ;
* image principale ;
* ordre ;
* maximum six images.

Le formulaire affiche :

* une barre de progression ;
* les étapes verrouillées ou déverrouillées ;
* les erreurs de validation ;
* les boutons précédent et suivant ;
* un écran de progression pendant la création.

## 24.3 Validation progressive

Chaque étape peut être vérifiée par le serveur avant d’ouvrir la suivante.

Le JavaScript :

* surveille les champs ;
* tente de déverrouiller les étapes ;
* envoie les valeurs au serveur ;
* affiche les erreurs ;
* autorise le retour à une étape précédente ;
* vérifie toutes les étapes avant l’envoi final.

## 24.4 Règles particulières pour les services

Quand la catégorie sélectionnée correspond à Service :

* l’état est automatiquement fixé à neuf ;
* le stock n’est pas requis ;
* les messages du formulaire changent ;
* la vente reste possible sans stock physique.

## 24.5 Création

Le serveur :

* valide les champs ;
* contrôle l’unicité du SKU ;
* génère un slug unique ;
* enregistre le produit ;
* traite les images ;
* définit l’image principale ;
* enregistre les positions ;
* annule proprement l’opération en cas d’échec.

## 24.6 Modification

L’administrateur peut modifier :

* le titre ;
* le SKU ;
* le slug ;
* la description ;
* la catégorie ;
* le prix ;
* la réduction ;
* le stock ;
* le poids ;
* les dimensions ;
* l’état ;
* les images.

Une remise en stock peut déclencher automatiquement les emails de retour en stock.

## 24.7 Suppression

La suppression peut retirer :

* le produit ;
* ses images en base ;
* les fichiers générés ;
* ses différentes tailles d’images.

---

# 25. Administration des galeries de produits

Les routes d’API permettent :

* de récupérer les images d’un produit ;
* d’en ajouter ;
* de désigner l’image principale ;
* de réorganiser les images ;
* d’en supprimer une.

L’administration prend en charge :

* six images maximum ;
* la conservation de l’ordre ;
* l’affichage des aperçus ;
* la réparation d’une galerie sans image principale ;
* la réattribution automatique d’une image principale après suppression ;
* la suppression physique des fichiers.

---

# 26. Administration des catégories

Une API administrative permet :

* de lister les catégories ;
* de créer une catégorie ;
* de modifier une catégorie ;
* de supprimer une catégorie.

Les informations sont :

* nom ;
* slug ;
* description.

Le slug peut être généré depuis le nom.

La suppression est bloquée lorsqu’une catégorie est encore utilisée par des produits.

Les routes sont regroupées sous `/admin/produits/...`.

---

# 27. Administration des commandes

## 27.1 Liste et recherche

L’administrateur peut filtrer les commandes selon :

* le statut de paiement ;
* le statut de commande ;
* la date ;
* la référence ;
* les informations client.

La liste est paginée.

## 27.2 Statistiques

Le système peut produire :

* le nombre de commandes ;
* les commandes en attente ;
* les commandes terminées ;
* le chiffre d’affaires ;
* des chiffres par jour ;
* par semaine ;
* par mois ;
* par année.

## 27.3 Détail

La page de détail rassemble :

* la commande ;
* le client ;
* l’adresse de livraison ;
* l’adresse de facturation ;
* les articles ;
* la facture ;
* les statuts ;
* les notes internes.

## 27.4 Actions disponibles

L’administrateur peut :

* changer le statut de commande ;
* changer le statut de paiement ;
* télécharger la facture ;
* régénérer la facture ;
* envoyer la facture par email ;
* ajouter une note interne.

Les notes ajoutées peuvent être horodatées et concaténées aux notes précédentes.

Les routes de toutes ces actions sont explicitement déclarées.

---

# 28. Pages légales

Le projet contient des pages dédiées pour :

* les mentions légales ;
* la politique de confidentialité ;
* les conditions générales de vente ;
* la FAQ.

Les URL sont :

```text
/mentions-legales
/politique-confidentialite
/cgv
/faq
```

---

# 29. SEO et référencement

Le projet possède déjà une partie SEO développée.

## 29.1 Métadonnées

Les pages peuvent définir :

* titre ;
* description ;
* URL canonique ;
* langue ;
* robots ;
* image de partage.

## 29.2 Réseaux sociaux

Le layout produit :

* les balises Open Graph ;
* les Twitter Cards ;
* l’image ;
* le titre ;
* la description ;
* l’URL canonique.

## 29.3 Hreflang

Des liens alternatifs peuvent être générés pour :

* français ;
* anglais ;
* langue par défaut.

## 29.4 Données structurées

Le projet génère ou prévoit des schémas Schema.org de type :

* `LocalBusiness` ;
* `Product` ;
* `Offer` ;
* `Service` ;
* `Article` ;
* `FAQPage`.

## 29.5 Sitemap XML dynamique

La route `/sitemap.xml` génère un sitemap comprenant :

* les pages principales ;
* les catégories ;
* les produits actifs ;
* les articles publiés ;
* les dates de dernière modification ;
* les fréquences de changement ;
* les priorités.

---

# 30. Performances et médias

## 30.1 Images responsive

Les produits peuvent utiliser :

* `srcset` ;
* `sizes` ;
* WebP ;
* chargement différé ;
* miniature 350 px ;
* format intermédiaire 800 px ;
* original 1920 px.

## 30.2 Cache HTTP

Un filtre ajoute :

* un cache public d’un an pour les images, CSS, JavaScript et polices ;
* le marqueur `immutable` ;
* une expiration ;
* une absence de cache pour les pages HTML ou PHP.

## 30.3 Médias de blog

Les images du blog sont servies par un contrôleur afin de :

* lire les fichiers depuis le stockage interne ;
* fournir le bon type MIME ;
* appliquer un cache ;
* revenir à un fichier public si nécessaire ;
* utiliser une image par défaut.

## 30.4 Chargement des icônes

Lucide est chargé de manière différée afin de ne pas bloquer le rendu initial.

---

# 31. Sessions

Les sessions sont conservées dans la base de données dans la table `ci_sessions`.

La configuration prévoit :

* un cookie `ci_session` ;
* une durée d’environ deux heures ;
* un renouvellement de l’identifiant toutes les cinq minutes ;
* un stockage via le gestionnaire Database de CodeIgniter.

Elles servent notamment pour :

* le panier ;
* l’authentification admin ;
* les messages temporaires ;
* la limitation des commentaires ;
* les données client temporairement conservées pendant le checkout.

---

# 32. Protections et validations techniques présentes

Sans transformer cela en audit, le projet contient déjà :

* protection CSRF globale ;
* exclusion CSRF spécifique pour certains appels AJAX et le webhook Stripe ;
* filtre d’authentification admin ;
* validation côté serveur ;
* échappement des données affichées ;
* hash de mot de passe ;
* vérification de signature du webhook Stripe ;
* honeypot pour le contact ;
* honeypot pour les commentaires ;
* limitation temporelle des commentaires ;
* contrôle du type et de la taille des images ;
* contrôle du stock côté serveur ;
* transactions de base de données sur plusieurs opérations importantes ;
* nettoyage du contenu des commentaires.

Les exceptions CSRF concernent notamment :

* le webhook Stripe ;
* les routes du panier ;
* la création de session Stripe ;
* la publication des commentaires.

---

# 33. Emails gérés par l’application

Le code contient les parcours d’email suivants :

1. nouvelle réservation envoyée à l’administrateur ;
2. confirmation d’abonnement à une alerte de stock ;
3. notification d’une nouvelle alerte à l’administrateur ;
4. notification de retour en stock au client ;
5. confirmation de commande ;
6. facture PDF jointe à la confirmation ;
7. renvoi manuel d’une facture par l’administrateur ;
8. nouvelle demande de contact envoyée à l’administrateur ;
9. réponse administrative à une demande de contact, logique présente mais route manquante ;
10. nouveau commentaire de blog envoyé à l’administrateur.

---

# 34. Modèle de données logique

Les principales entités sont les suivantes.

## 34.1 Catalogue

### `category`

* catégories de produits.

### `product`

* produits neufs ;
* produits d’occasion ;
* services commercialisés.

### `product_images`

* plusieurs images par produit ;
* ordre ;
* image principale.

### `service`

Une table séparée existe pour les services, avec :

* titre ;
* description ;
* prix ;
* image.

Elle n’est cependant pas utilisée par la page Services actuelle, qui affiche du contenu statique, ni par le système de vente actuel, qui représente plutôt les services comme des produits de la catégorie Service.

## 34.2 Vente

### `orders`

* commande ;
* client ;
* adresses ;
* montant ;
* statuts ;
* transaction ;
* origine ;
* notes.

### `order_items`

* snapshot des produits achetés ;
* quantités ;
* prix ;
* remises.

### `invoices`

* facture ;
* montants ;
* PDF ;
* dates.

### `reservation`

* demande sur produit d’occasion ;
* client ;
* statut ;
* message.

### `restock_alerts`

* abonnements de retour en stock ;
* token d’annulation ;
* état de notification.

## 34.3 Contact

### `contact_request`

* demande du formulaire ;
* client ;
* sujet ;
* message ;
* statut ;
* réponse.

### `contact_attachment`

* fichiers liés à une demande ;
* fonctionnalité non encore branchée au contrôleur public.

## 34.4 Blog

### `blog_posts`

* article ;
* titre ;
* slug ;
* extrait ;
* contenu historique ;
* couverture ;
* publication.

### `blog_post_blocks`

* paragraphes ;
* images ;
* sous-titres ;
* ordre.

### `blog_comments`

* auteur ;
* email ;
* contenu ;
* modération ;
* article lié.

## 34.5 Utilisateurs et système

### `user`

* username ;
* email ;
* hash ;
* rôle ;
* dernière connexion.

Actuellement inutilisée par l’authentification réelle.

### `ci_sessions`

* stockage des sessions en base.

---

# 35. Fonctionnalités de développement

## 35.1 Test des logs

La route `/test-log` :

* écrit un message d’erreur ;
* écrit un message d’information ;
* écrit un message de debug ;
* indique le fichier de log à consulter.

## 35.2 Test des sessions

La route `/test-session` :

* incrémente un compteur de visites ;
* affiche l’identifiant de session ;
* affiche le driver ;
* affiche le chemin ou la table de sauvegarde ;
* compte les sessions ;
* affiche les données de session ;
* affiche les lignes de `ci_sessions`.

## 35.3 Commande CLI de test contact

La commande :

```bash
php spark test:contact
```

insère une demande de contact de test dans la base.

---

# 36. Fonctionnalités présentes mais inachevées ou non reliées

Voici l’inventaire des éléments qui existent déjà en partie, sans être complètement utilisables.

## 36.1 Comptes clients

Présents ou anticipés :

* table utilisateur ;
* champ `user_id` dans les commandes ;
* lien vers une supposée commande client dans certains emails.

Manquants :

* inscription ;
* connexion client ;
* profil ;
* historique ;
* route de consultation d’une commande client.

## 36.2 Suivi de commande client

Certains emails peuvent construire une URL du type :

```text
/mon-compte/commandes/{reference}
```

Aucune route correspondante n’est déclarée.

## 36.3 Conversion d’une réservation en commande

La table `orders` prévoit :

* l’origine `converted_reservation` ;
* un `reservation_id`.

Mais aucune action de conversion n’est actuellement exposée dans les routes.

## 36.4 Moyens de paiement supplémentaires

La base anticipe :

* PayPal ;
* virement ;
* espèces ;
* autre.

Seul Stripe est implémenté dans le checkout.

## 36.5 Pièces jointes du contact

Présents :

* champ multiple ;
* table dédiée ;
* relation à la demande.

Manquant :

* traitement serveur ;
* stockage ;
* affichage administrateur ;
* envoi dans l’email.

## 36.6 Actions administratives sur les réservations

Présents :

* méthodes serveur ;
* boutons ;
* modèle ;
* statuts.

Manquants :

* routes de détail et de mise à jour ;
* modal ou formulaire JavaScript réellement connecté.

## 36.7 Réponse administrative aux demandes

La méthode d’envoi d’une réponse existe, mais pas sa route explicite.

## 36.8 Adresse de facturation différente

Le contrôleur et la commande peuvent stocker une adresse de facturation distincte.

L’interface ne montre actuellement que la case « utiliser comme adresse de facturation », sans formulaire visible permettant de saisir une autre adresse.

## 36.9 Bouton « Acheter maintenant »

Le bouton visible sur la fiche dirige vers `/checkout`.

Il ne place pas lui-même le produit courant dans le panier. Il fonctionne donc essentiellement lorsque le panier contient déjà un produit.

## 36.10 Table `service`

La table existe, mais :

* la page Services est statique ;
* les services payants passent par la table des produits ;
* aucun CRUD spécifique de la table `service` n’est visible.

## 36.11 Authentification par rôles

La table `user` distingue `admin` et `editor`, mais l’authentification actuelle utilise un unique administrateur défini par l’environnement.

## 36.12 Deux aperçus de panier

Le code contient :

* le panier intégré à la navbar ;
* un panier flottant indépendant.

Le second semble être une variante ancienne ou non utilisée partout.

## 36.13 Publication rapide du blog

La publication et le brouillon sont bien gérables dans les formulaires d’ajout et de modification. Une logique de bascule rapide semble également avoir été envisagée, mais aucune route dédiée n’apparaît dans la configuration actuelle.

## 36.14 Ancien et nouveau format de blog

Deux systèmes coexistent :

* ancien contenu monolithique ;
* nouveaux blocs ordonnés.

Le rendu conserve volontairement une compatibilité avec les anciens articles.

---

# 37. Inventaire complet des routes principales

## Partie publique

```text
GET  /
GET  /accueil
GET  /sitemap.xml

GET  /produits
GET  /produits/load-more
GET  /produits/{slug}
POST /produits/{slug}/reserver
POST /produits/alert-restock
GET  /produits/cancel-alert/{token}

GET  /services

GET  /contact
POST /contact

GET  /connexion
POST /connexion
GET  /deconnexion

GET  /actualites
GET  /actualites/{slug}
POST /actualites/{id}/commenter

GET  /media/blog/cover/{fichier}
GET  /media/blog/cover-thumb/{fichier}
GET  /media/blog/block/{fichier}

GET  /mentions-legales
GET  /politique-confidentialite
GET  /cgv
GET  /faq

GET  /test-log
GET  /test-session
```

## Panier

```text
GET  /panier
POST /panier/add
POST /panier/update
POST /panier/remove
GET  /panier/vider
GET  /panier/count
GET  /panier/data
```

## Paiement

```text
GET  /checkout
POST /checkout/create-session
GET  /checkout/success
GET  /checkout/cancel
POST /webhook/stripe
```

## Administration

```text
GET  /admin
GET  /admin/produits
GET  /admin/produits/nouveau
POST /admin/produits/validate-step
POST /admin/produits/create
GET  /admin/produits/edit/{id}
POST /admin/produits/update/{id}
POST /admin/produits/delete/{id}

GET    /admin/produits/{id}/images
POST   /admin/produits/{id}/images/upload
PUT    /admin/produits/images/{id}/set-primary
PUT    /admin/produits/{id}/images/reorder
DELETE /admin/produits/images/{id}

GET  /admin/produits/categories-api
POST /admin/produits/create-category
POST /admin/produits/update-category/{id}
POST /admin/produits/delete-category/{id}

GET  /admin/reservations

GET  /admin/commandes
GET  /admin/commandes/details/{id}
POST /admin/commandes/update-status/{id}
POST /admin/commandes/update-payment-status/{id}
GET  /admin/commandes/download-invoice/{id}
POST /admin/commandes/send-invoice/{id}
POST /admin/commandes/add-note/{id}

GET  /admin/demandes
GET  /admin/demandes/{id}
POST /admin/demandes/{id}/status

GET  /admin/blog
GET  /admin/blog/nouveau
POST /admin/blog/create
GET  /admin/blog/edit/{id}
POST /admin/blog/update/{id}
POST /admin/blog/delete/{id}

GET  /admin/blog/commentaires
POST /admin/blog/commentaires/approve/{id}
POST /admin/blog/commentaires/reject/{id}
POST /admin/blog/commentaires/delete/{id}
```

Cette cartographie correspond directement au fichier de routes actuel.

---

# 38. Conclusion générale

Le projet propose déjà, dans le code :

* un site responsive bilingue ;
* une vitrine artisanale ;
* une page Services ;
* un catalogue dynamique ;
* une recherche ;
* des catégories ;
* des produits neufs ;
* des produits d’occasion ;
* des services achetables ;
* des remises ;
* une galerie multiformat ;
* une lightbox avec zoom ;
* des produits apparentés ;
* un panier en session ;
* un aperçu dynamique du panier ;
* un checkout invité ;
* Stripe Checkout ;
* un webhook Stripe ;
* la création de commandes ;
* la gestion des stocks ;
* les factures PDF ;
* l’envoi d’emails ;
* les réservations ;
* les alertes de retour en stock ;
* le contact ;
* une carte interactive ;
* un blog ;
* un éditeur d’articles par blocs ;
* les commentaires ;
* la modération ;
* un dashboard ;
* l’administration des produits ;
* l’administration des catégories ;
* l’administration des images ;
* l’administration des commandes ;
* l’administration des factures ;
* l’administration des demandes ;
* une première administration des réservations ;
* le SEO ;
* un sitemap dynamique ;
* des données structurées ;
* du cache ;
* des sessions en base ;
* plusieurs protections anti-spam et validations ;
* des outils de développement.

L’architecture reste celle d’un projet en construction, mais elle est déjà organisée autour de domaines métier identifiables. Les trois parcours les plus aboutis sont :

```text
Produit neuf → panier → Stripe → commande → stock → facture → email

Produit d’occasion → réservation → notification administrateur

Article → commentaire en attente → modération → publication
```

Les principaux chantiers encore incomplets sont l’espace client, les pièces jointes du contact, la conversion des réservations en commandes et certaines actions administratives qui existent dans les contrôleurs sans être complètement routées.
