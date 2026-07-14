# Cahier des charges - Refonte KayArt

Date : 13 juillet 2026  
Statut : document de cadrage initial consolidé  
Projet : reconstruction complète de l'application KayArt

## 1. Objet du document

Ce document définit le périmètre fonctionnel, éditorial, graphique, technique et organisationnel du futur site KayArt.

Il sert de base de travail avant tout développement. Son objectif est de clarifier ce qui doit être construit, dans quel esprit, avec quelles priorités, et selon quelles exigences de qualité.

Le projet ne consiste pas à moderniser superficiellement l'ancien site. Il consiste à reconstruire une plateforme propre, maintenable, sécurisée, performante et adaptée à l'image souhaitée pour KayArt.

L'ancien dépôt `NicolasCHANTEUX/APP-WEB-Vincent-2` est utilisé comme source d'inventaire fonctionnel. Il ne doit pas être considéré comme une base technique à prolonger directement.

## 2. Décision de principe

La nouvelle version sera reconstruite à partir de zéro.

Cette décision est motivée par plusieurs constats :

- l'ancien projet repose sur CodeIgniter/PHP, technologie que l'on ne souhaite pas conserver pour cette refonte ;
- la structure existante mélange de nombreuses responsabilités dans les contrôleurs ;
- plusieurs fonctionnalités sont partiellement anticipées mais pas finalisées ;
- certaines routes de test ou de debug existent dans le projet ;
- le compte client est évoqué mais pas réellement disponible ;
- certains parcours sont ambigus, notamment réservation, achat, services et demandes ;
- la direction graphique doit être profondément repensée ;
- l'objectif est d'obtenir une base plus propre, plus sécurisée et plus durable.

L'ancien projet reste utile pour ne pas perdre les idées métier : catalogue, produits d'occasion, panier, Stripe, factures, blog, admin, réservations, alertes de stock, demandes, SEO et pages légales.

## 3. Vision du projet

KayArt doit devenir une plateforme de marque, pas seulement une boutique en ligne.

Le site doit permettre de comprendre immédiatement que KayArt conçoit, fabrique, adapte, restaure et vend des pièces techniques liées au kayak et aux sports nautiques, avec une forte orientation carbone, artisanat, performance et durabilité.

La promesse centrale peut être résumée ainsi :

> Des pièces techniques en carbone, façonnées à la main pour la performance, la précision et la durée.

La signature possible est :

> KayArt - Carbon in Motion

Cette signature reste à valider.

## 4. Objectifs

### 4.1 Objectifs commerciaux

Le site doit permettre de :

- vendre directement des produits neufs ;
- valoriser les produits d'occasion contrôlés ou restaurés ;
- faciliter les réservations de produits uniques ou d'occasion ;
- recevoir des demandes de réparation ;
- recevoir des demandes de fabrication sur mesure ;
- présenter les services de l'atelier ;
- réduire les échanges manuels inutiles ;
- centraliser les commandes, demandes et réservations ;
- augmenter la crédibilité de l'activité ;
- valoriser les produits et prestations les plus stratégiques.

### 4.2 Objectifs de marque

Le site doit transmettre :

- la maîtrise technique ;
- la précision ;
- l'artisanat ;
- la performance sportive ;
- la durabilité ;
- la proximité humaine ;
- la confiance ;
- le caractère unique des pièces ;
- la capacité d'adaptation aux besoins réels des pratiquants.

### 4.3 Objectifs utilisateurs

Les visiteurs doivent pouvoir :

- comprendre rapidement ce que fait KayArt ;
- découvrir les produits disponibles ;
- distinguer clairement neuf, occasion, service, réparation et sur-mesure ;
- consulter des fiches produits détaillées ;
- filtrer et rechercher les produits ;
- acheter sans créer obligatoirement un compte ;
- réserver un produit d'occasion si ce modèle est retenu ;
- demander une réparation avec ajout de photos ;
- demander un projet sur mesure ;
- contacter facilement l'artisan ;
- lire des articles ou réalisations ;
- utiliser le site sur mobile, tablette et ordinateur ;
- installer le site comme une application si la PWA est activée.

### 4.4 Objectifs administratifs

L'administrateur doit pouvoir :

- gérer les produits ;
- gérer les catégories ;
- gérer les images ;
- modifier les stocks ;
- consulter les commandes ;
- modifier les statuts de commande ;
- consulter les paiements ;
- générer ou récupérer des factures ;
- consulter les réservations ;
- consulter les demandes de réparation ;
- consulter les demandes de sur-mesure ;
- gérer les messages de contact ;
- publier des articles ;
- gérer les pages principales si cela est retenu ;
- suivre les erreurs importantes ;
- administrer le site sans modifier le code.

## 5. Publics cibles

### 5.1 Pratiquants réguliers

Ils recherchent du matériel fiable, technique et durable. Ils sont sensibles au poids, à la rigidité, aux dimensions, au comportement du produit et à la qualité de fabrication.

### 5.2 Compétiteurs

Ils recherchent de la performance, du gain de poids, de l'ergonomie, des réglages, des matériaux adaptés et éventuellement du sur-mesure.

### 5.3 Clubs et associations

Ils peuvent avoir besoin de plusieurs produits, de réparations, de pièces personnalisées ou d'échanges plus structurés.

### 5.4 Pratiquants occasionnels

Ils ont besoin d'informations pédagogiques, de conseils clairs et d'un parcours simple.

### 5.5 Acheteurs de produits d'occasion

Ils recherchent du matériel de qualité à un prix inférieur au neuf, avec une description fiable de l'état réel.

### 5.6 Clients avec produit endommagé

Ils veulent savoir si une réparation, rénovation ou amélioration est possible, avec un moyen simple d'envoyer des photos.

### 5.7 Clients sur mesure

Ils ont un besoin spécifique qui ne peut pas être satisfait par un produit standard.

## 6. Positionnement éditorial

Le ton doit être :

- professionnel ;
- direct ;
- précis ;
- humain ;
- passionné ;
- accessible ;
- technique lorsque nécessaire ;
- jamais artificiellement luxueux.

Le contenu doit éviter :

- les promesses vagues ;
- les phrases marketing génériques ;
- les textes longs sans information utile ;
- le jargon inutile ;
- les formulations impersonnelles.

Le contenu doit privilégier :

- les explications concrètes ;
- les caractéristiques mesurables ;
- les photos réelles ;
- les exemples de réalisation ;
- les détails de fabrication ;
- les conseils d'usage ;
- les délais et disponibilités ;
- les limites éventuelles des réparations ou personnalisations.

## 7. Direction artistique

### 7.1 Intention

La direction artistique doit être sportive, technique, immersive, artisanale, haut de gamme et moderne.

Elle peut s'inspirer de l'impact visuel de Kick The Waves, sans le reproduire. KayArt doit conserver une identité propre : plus artisanale, plus humaine, plus centrée sur l'atelier, le carbone, la réparation et les pièces uniques.

### 7.2 Palette proposée

- Noir carbone : `#101312`
- Ivoire technique : `#F1F0E9`
- Gris fibre : `#292D2B`
- Gris métallique : `#A7AAA5`
- Accent à décider : jaune acide `#D9FF3F` ou or KayArt modernisé `#C8A45B`

Le jaune acide donne une direction plus sportive et contemporaine. L'or conserve une continuité plus directe avec une identité existante. Le choix devra être validé avant le design system final.

### 7.3 Typographies

Pour les titres :

- Archivo Black ;
- Barlow Condensed ;
- Oswald ;
- ou une alternative forte et condensée.

Pour les textes :

- Inter ;
- Manrope ;
- Space Grotesk ;
- ou une alternative très lisible.

Une police monospace peut être utilisée ponctuellement pour les références, dimensions, poids, stocks et données techniques.

### 7.4 Formes et composition

La direction doit privilégier :

- grands visuels ;
- images bord à bord ;
- angles droits ou très faibles arrondis ;
- grilles asymétriques ;
- titres massifs ;
- lignes fines ;
- contrastes forts ;
- superposition maîtrisée du texte et des images.

Elle doit limiter :

- cartes blanches répétitives ;
- gros arrondis ;
- ombres fortes ;
- effets de verre ;
- décorations gratuites ;
- interfaces trop génériques.

## 8. Périmètre public

### 8.1 Arborescence principale

Le site public doit comprendre au minimum :

- accueil ;
- boutique ;
- catégories ;
- fiches produits ;
- page occasion ou filtre occasion ;
- page réparation ;
- page sur-mesure ;
- page atelier / savoir-faire ;
- page services ;
- panier ;
- checkout ;
- confirmation de commande ;
- journal / blog ;
- articles ;
- contact ;
- FAQ ;
- mentions légales ;
- politique de confidentialité ;
- conditions générales de vente ;
- gestion des cookies si nécessaire.

### 8.2 Navigation

Navigation principale recommandée :

- Boutique ;
- Sur mesure ;
- Réparation ;
- Savoir-faire ;
- Journal ;
- Contact.

Accès secondaires :

- recherche ;
- panier ;
- langue si multilingue ;
- espace client optionnel plus tard ;
- accès admin non visible dans la navigation publique.

Sur mobile, le menu doit être clair, tactile, lisible et utilisable sans dépendre du survol.

## 9. Accueil

La page d'accueil doit présenter la marque avant d'empiler des produits.

Elle doit inclure :

- une section hero immersive ;
- une phrase de positionnement forte ;
- un accès vers la boutique ;
- un accès vers l'atelier, la réparation ou le sur-mesure ;
- une sélection de catégories ;
- un produit ou une collection mise en avant ;
- une présentation du savoir-faire ;
- une section réparation ;
- une section sur-mesure ;
- une section occasion ;
- une sélection courte de produits ;
- quelques articles ou réalisations ;
- un pied de page complet.

La page d'accueil ne doit pas reproduire tout le catalogue.

## 10. Catalogue

Le catalogue doit pouvoir présenter :

- produits neufs ;
- produits d'occasion ;
- services ;
- produits sur commande ;
- produits temporairement indisponibles ;
- produits personnalisables.

Chaque élément doit afficher :

- image principale ;
- nom ;
- catégorie ;
- prix ou mention de devis ;
- état neuf ou occasion ;
- disponibilité ;
- éventuelle réduction ;
- type d'offre.

Filtres V1 recommandés :

- catégorie ;
- neuf / occasion ;
- disponibilité ;
- prix ;
- type produit / service.

Filtres plus avancés à reporter si les données sont assez structurées :

- discipline ;
- niveau ;
- longueur ;
- poids ;
- matériau ;
- rigidité ;
- usage.

La recherche doit couvrir :

- nom ;
- SKU ou référence ;
- catégorie ;
- description ;
- caractéristiques principales.

## 11. Fiche produit

La fiche produit doit afficher :

- nom ;
- catégorie ;
- référence ;
- description courte ;
- description complète ;
- prix ;
- réduction éventuelle ;
- état ;
- disponibilité ;
- quantité disponible ;
- caractéristiques techniques ;
- galerie d'images ;
- conditions de livraison ;
- retrait possible si retenu ;
- garanties ou informations importantes ;
- CTA adapté au type d'offre.

Pour un produit neuf :

- quantité ;
- ajout au panier ;
- stock ;
- délai ;
- personnalisation éventuelle.

Pour un produit d'occasion :

- état réel ;
- défauts éventuels ;
- photos détaillées ;
- disponibilité unique ;
- bouton de réservation ou d'achat selon décision métier.

Pour un produit indisponible :

- statut clair ;
- alerte de retour en stock ;
- alternative ou demande de contact.

## 12. Panier et commande

Le panier doit permettre :

- voir les produits ;
- modifier les quantités ;
- retirer un produit ;
- voir les prix ;
- voir le total ;
- voir les messages d'indisponibilité ;
- accéder au checkout.

Le checkout V1 doit permettre l'achat invité.

Le client ne doit pas être obligé de créer un compte pour acheter.

Informations client nécessaires :

- email ;
- prénom ;
- nom ;
- téléphone si utile ;
- adresse de livraison ;
- adresse de facturation si différente ;
- choix de livraison ou retrait si retenu.

Le paiement recommandé est Stripe Checkout.

Le webhook Stripe doit être la source fiable pour confirmer le paiement et créer ou finaliser la commande.

## 13. Comptes clients et authentification

### 13.1 Décision V1

L'achat invité est obligatoire en V1.

Le compte client ne doit jamais bloquer l'achat.

### 13.2 Compte client optionnel

Un compte client pourra être proposé après commande ou dans une phase ultérieure.

Il pourra servir à :

- retrouver ses commandes ;
- retrouver ses factures ;
- consulter ses réservations ;
- suivre ses demandes de réparation ;
- suivre ses demandes de sur-mesure ;
- gérer ses alertes de stock ;
- accélérer les commandes futures.

Méthodes d'authentification envisagées :

- lien magique par email ;
- Google ;
- Apple ;
- email et mot de passe si nécessaire.

La priorité doit être la simplicité. Beaucoup d'utilisateurs n'ont pas envie de gérer un mot de passe pour acheter un produit ponctuellement.

### 13.3 Admin

L'administration doit être protégée par une authentification dédiée.

Il ne doit pas y avoir de bouton visible dans la navigation publique vers la connexion admin.

L'URL `/admin` peut exister, mais la sécurité ne doit jamais reposer sur le fait qu'elle soit peu visible.

Exigences admin :

- authentification obligatoire ;
- rôle admin vérifié côté serveur ;
- session sécurisée ;
- accès refusé aux utilisateurs non autorisés ;
- journalisation des actions importantes ;
- aucun outil de test accessible en production.

## 14. Réservations

Les réservations concernent principalement les produits d'occasion, les pièces uniques ou les disponibilités limitées.

Points à décider avant développement :

- réservation simple sans paiement ;
- réservation avec acompte ;
- durée de réservation ;
- annulation automatique ;
- notification admin ;
- conversion en commande ;
- produit bloqué pendant la réservation ou non.

Pour la V1, il est recommandé de commencer simple : réservation avec formulaire, statut admin, notification email, et blocage clair du produit si la réservation est acceptée.

## 15. Réparation

Le parcours réparation doit permettre :

- comprendre les types de dommages étudiés ;
- expliquer les étapes du diagnostic ;
- envoyer une demande ;
- joindre des photos ;
- préciser le type de produit ;
- décrire le problème ;
- recevoir une réponse manuelle.

Le formulaire doit prévoir :

- nom ;
- email ;
- téléphone optionnel ;
- type de produit ;
- description du dommage ;
- photos ;
- consentement lié au traitement des données ;
- message de confirmation.

Les fichiers uploadés doivent être validés côté serveur.

## 16. Sur-mesure

Le parcours sur-mesure doit permettre :

- présenter les possibilités ;
- expliquer les limites ;
- orienter le client selon son besoin ;
- recevoir une demande structurée.

Champs possibles :

- discipline ;
- niveau ;
- dimensions souhaitées ;
- usage ;
- contraintes ;
- délai ;
- budget indicatif optionnel ;
- photos ou références optionnelles.

## 17. Services

Les services doivent être clarifiés.

Deux modèles sont possibles :

- service comme fiche éditoriale menant vers une demande ;
- service comme produit achetable ou réservable.

Pour la V1, il est recommandé de traiter les services comme des offres décrites clairement, avec CTA vers demande de contact, réparation ou sur-mesure, sauf service très simple à prix fixe.

## 18. Blog / Journal

Le journal doit valoriser :

- réalisations récentes ;
- coulisses de l'atelier ;
- conseils techniques ;
- explications matériaux ;
- événements ;
- restaurations avant / après.

V1 :

- liste d'articles ;
- page article ;
- image de couverture ;
- contenu riche simple ;
- statut brouillon / publié ;
- SEO article.

À reporter :

- commentaires publics ;
- programmation avancée ;
- catégories complexes ;
- newsletter automatisée.

## 19. Administration

L'admin V1 doit couvrir :

- tableau de bord simple ;
- produits ;
- catégories ;
- images produits ;
- commandes ;
- statuts de commande ;
- demandes de contact ;
- demandes réparation ;
- demandes sur-mesure ;
- réservations ;
- articles ;
- médias ;
- pages légales si utile.

L'admin doit être sobre, claire, rapide et orientée gestion quotidienne.

Elle ne doit pas chercher à devenir un CMS complet dès la V1.

## 20. Images et médias

Le projet dépend fortement de la qualité visuelle.

Exigences :

- upload sécurisé ;
- contrôle type MIME ;
- limitation taille ;
- génération de formats optimisés ;
- images responsives ;
- texte alternatif ;
- galerie produit ;
- images atelier ;
- photos avant / après ;
- stockage durable ;
- suppression ou archivage maîtrisé.

Les images sont stratégiques pour le design. Il faudra préparer un vrai corpus visuel avant la maquette finale.

## 21. PWA

Le projet peut être conçu comme une PWA.

Objectifs PWA V1 :

- application installable mobile et desktop ;
- manifest ;
- icônes ;
- thème ;
- stratégie de cache sobre ;
- amélioration de l'expérience mobile.

À ne pas faire en V1 :

- offline complet pour le panier ;
- paiement offline ;
- synchronisation complexe ;
- notifications push tant que l'usage n'est pas validé.

La PWA doit être un plus, pas une source de complexité inutile.

## 22. Multilingue

Le français est prioritaire.

L'anglais est souhaitable si KayArt veut toucher des clients hors France ou garder la continuité avec l'ancien projet.

Décision à prendre :

- français uniquement en V1 ;
- français et anglais dès V1 ;
- infrastructure prête pour l'anglais, mais contenus traduits plus tard.

Option recommandée : concevoir l'architecture compatible multilingue dès le départ, mais ne pas bloquer la V1 si les contenus anglais ne sont pas prêts.

## 23. SEO

Le site doit inclure :

- URLs lisibles ;
- titres uniques ;
- descriptions uniques ;
- sitemap ;
- robots.txt ;
- balises canoniques ;
- Open Graph ;
- données structurées ;
- pages produits indexables ;
- articles indexables ;
- redirections depuis anciennes URLs importantes ;
- fil d'Ariane si pertinent ;
- pages d'erreur propres.

Données structurées envisageables :

- LocalBusiness ;
- Product ;
- Offer ;
- Service ;
- Article ;
- BreadcrumbList ;
- FAQPage.

Les données structurées doivent correspondre au contenu réellement visible.

## 24. Accessibilité

Le site doit viser une bonne accessibilité pratique.

Exigences :

- contraste suffisant ;
- navigation clavier ;
- focus visible ;
- textes alternatifs ;
- formulaires correctement libellés ;
- erreurs compréhensibles ;
- titres structurés ;
- boutons explicites ;
- zones tactiles suffisantes ;
- compatibilité avec réduction de mouvement ;
- absence de dépendance au survol ;
- contenus lisibles sur mobile.

## 25. Performance

Le site doit rester rapide malgré son ambition visuelle.

Exigences :

- rendu serveur ou hybride pour les pages importantes ;
- images optimisées ;
- chargement différé ;
- formats modernes ;
- scripts limités ;
- polices optimisées ;
- animations sobres ;
- cache ;
- pages produits rapides ;
- accueil visuel mais maîtrisé.

Les contenus critiques du premier écran ne doivent pas dépendre de scripts lourds.

## 26. Sécurité

Exigences générales :

- validation serveur systématique ;
- protection contre injections ;
- protection XSS ;
- protection CSRF lorsque nécessaire ;
- sessions sécurisées ;
- secrets en variables d'environnement ;
- webhook Stripe vérifié ;
- aucun stockage de carte bancaire ;
- uploads contrôlés ;
- limitation de taille des fichiers ;
- contrôle d'accès admin ;
- rate limiting sur formulaires sensibles ;
- protection anti-spam ;
- logs d'erreurs ;
- sauvegardes ;
- aucune route de debug en production.

Les contrôles navigateur ne remplacent jamais les contrôles serveur.

## 27. Données personnelles

Données potentiellement traitées :

- noms ;
- emails ;
- téléphones ;
- adresses ;
- messages ;
- commandes ;
- factures ;
- photographies ;
- données de paiement indirectes ;
- IP ;
- cookies ;
- comptes clients éventuels.

Le projet doit prévoir :

- politique de confidentialité ;
- durées de conservation ;
- droit d'accès ;
- rectification ;
- suppression lorsque possible ;
- consentement lorsque nécessaire ;
- limitation des données ;
- protection des fichiers ;
- contrats avec prestataires ;
- gestion des cookies.

## 28. Observabilité et maintenance

Le système doit permettre de comprendre les erreurs.

À prévoir :

- logs applicatifs ;
- logs paiement ;
- logs email ;
- suivi des erreurs ;
- sauvegardes ;
- procédure de restauration ;
- environnement de test ;
- environnement de production ;
- documentation de déploiement ;
- documentation admin.

## 29. Statistiques

Les statistiques doivent rester utiles et proportionnées.

Indicateurs pertinents :

- visites ;
- pages produits consultées ;
- recherches ;
- ajouts panier ;
- abandons panier ;
- commandes ;
- chiffre d'affaires ;
- demandes réparation ;
- demandes sur-mesure ;
- réservations ;
- articles lus ;
- produits indisponibles les plus demandés.

La collecte doit respecter la réglementation applicable.

## 30. Migration

Avant mise en production, il faudra inventorier :

- produits ;
- catégories ;
- images ;
- commandes ;
- factures ;
- réservations ;
- alertes de stock ;
- demandes ;
- articles ;
- commentaires ;
- utilisateurs admin ;
- traductions ;
- URLs indexées ;
- pages légales.

Les anciennes commandes et factures ne doivent pas être perdues.

Le nouveau projet peut repartir sans migrer toutes les données historiques dans l'interface, mais il faut au minimum conserver des archives fiables.

## 31. Critères d'acceptation généraux

Le projet V1 sera considéré comme prêt lorsque :

- les pages essentielles sont accessibles ;
- le site fonctionne sur mobile et ordinateur ;
- le catalogue est administrable ;
- les produits ont des images optimisées ;
- un produit peut être ajouté au panier ;
- le stock est contrôlé côté serveur ;
- un paiement test Stripe fonctionne ;
- une commande est créée de façon fiable ;
- une confirmation email est envoyée ;
- une facture ou preuve de commande est disponible ;
- une demande de réparation avec images peut être reçue ;
- une demande de sur-mesure peut être reçue ;
- un article peut être publié ;
- l'administration est protégée ;
- les données sont validées côté serveur ;
- aucune route sensible de test n'existe en production ;
- le sitemap existe ;
- les pages légales existent ;
- les performances sont acceptables ;
- les erreurs importantes sont journalisées.

## 32. Décisions ouvertes

Décisions à valider avant ou pendant la phase de conception :

- couleur d'accent : jaune acide ou or modernisé ;
- français seul ou français + anglais dès V1 ;
- achat direct des occasions ou réservation ;
- durée de réservation ;
- acompte ou non ;
- modes de livraison ;
- retrait atelier ;
- zones géographiques ;
- frais de livraison ;
- niveau de personnalisation produit en V1 ;
- services comme produits ou comme demandes ;
- compte client optionnel en V1 ou après V1 ;
- factures générées en interne ou via service externe ;
- outil d'email transactionnel ;
- hébergement final ;
- stratégie exacte de migration.

