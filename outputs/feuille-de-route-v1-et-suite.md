# Feuille de route - KayArt

Date : 13 juillet 2026  
Principe : on définit uniquement la V1 maintenant. Tout le reste va dans une réserve de travail à arbitrer plus tard, sans nommer artificiellement une V2.

## 1. Règle de priorisation

La V1 doit livrer une application réellement utilisable, propre et maintenable.

Elle doit permettre :

- de présenter la marque ;
- de vendre des produits ;
- de recevoir des demandes ;
- d'administrer le contenu essentiel ;
- de fonctionner correctement sur mobile ;
- d'être sécurisée ;
- d'être prête pour évoluer.

Elle ne doit pas essayer de tout faire.

Les fonctionnalités utiles mais non indispensables sont conservées dans la section "reste à arbitrer plus tard".

## 2. V1 - Socle projet

- Créer le nouveau projet from scratch.
- Mettre en place TypeScript.
- Mettre en place le framework retenu.
- Mettre en place la base de données.
- Mettre en place l'ORM ou l'accès aux données.
- Mettre en place les variables d'environnement.
- Définir la structure des dossiers.
- Définir les conventions de code.
- Mettre en place le linting et le formatage.
- Mettre en place les environnements dev / prod.
- Mettre en place une documentation minimale de démarrage.

## 3. V1 - Design system initial

- Définir la palette.
- Valider la couleur d'accent.
- Définir les typographies.
- Définir les styles de boutons.
- Définir les champs de formulaire.
- Définir les alertes.
- Définir les états de chargement.
- Définir les états d'erreur.
- Définir les composants de navigation.
- Définir les cartes produit.
- Définir les surfaces admin.
- Prévoir les règles responsive.
- Prévoir les règles d'accessibilité.

## 4. V1 - Site public

- Page d'accueil immersive.
- Navigation desktop.
- Navigation mobile.
- Footer.
- Page boutique.
- Page catégorie ou filtrage par catégorie.
- Page fiche produit.
- Page réparation.
- Page sur-mesure.
- Page savoir-faire / atelier.
- Page services.
- Page contact.
- Page journal.
- Page article.
- FAQ.
- Mentions légales.
- Politique de confidentialité.
- CGV.
- Page 404.

## 5. V1 - Catalogue

- Modèle produit.
- Modèle catégorie.
- Modèle image produit.
- Produits neufs.
- Produits d'occasion.
- Services simples.
- Prix.
- Stock.
- Référence / SKU.
- Description courte.
- Description longue.
- Caractéristiques techniques.
- Statut publié / brouillon.
- Statut disponible / indisponible.
- Produit mis en avant.
- Image principale.
- Galerie.
- Recherche simple.
- Filtres principaux.
- Tri simple.

## 6. V1 - Panier et commande

- Ajouter au panier.
- Modifier quantité.
- Supprimer du panier.
- Vider panier.
- Contrôle de stock côté serveur.
- Calcul total.
- Checkout invité.
- Adresse de livraison.
- Adresse de facturation différente si nécessaire.
- Confirmation avant paiement.
- Paiement Stripe Checkout.
- Webhook Stripe sécurisé.
- Création commande fiable.
- Page succès.
- Page annulation.
- Email de confirmation.
- Preuve de commande ou facture selon choix retenu.

## 7. V1 - Comptes et admin

- Achat invité sans compte obligatoire.
- Authentification admin.
- Accès admin non visible dans la navigation publique.
- Vérification rôle admin côté serveur.
- Protection des routes admin.
- Déconnexion admin.
- Tableau de bord simple.
- Gestion produits.
- Gestion catégories.
- Gestion images.
- Gestion commandes.
- Gestion statuts commande.
- Gestion demandes contact.
- Gestion demandes réparation.
- Gestion demandes sur-mesure.
- Gestion réservations si retenues en V1.
- Gestion articles.

## 8. V1 - Réparation

- Page explicative.
- Formulaire de demande.
- Upload photos.
- Validation fichiers.
- Limitation taille.
- Stockage sécurisé.
- Notification admin.
- Confirmation utilisateur.
- Statuts admin : nouveau, en cours, répondu, fermé.

## 9. V1 - Sur-mesure

- Page explicative.
- Formulaire structuré.
- Champs besoin / usage / dimensions / contraintes.
- Upload optionnel.
- Notification admin.
- Confirmation utilisateur.
- Statuts admin.

## 10. V1 - Occasion et réservation

À décider avant développement détaillé :

- occasion achetable directement ;
- occasion réservable uniquement ;
- réservation sans paiement ;
- réservation avec acompte ;
- durée de réservation.

Option V1 recommandée :

- fiche occasion claire ;
- bouton réserver ;
- formulaire de réservation ;
- notification admin ;
- statut réservation ;
- pas d'acompte au départ sauf besoin métier fort.

## 11. V1 - Journal

- Liste d'articles.
- Détail article.
- Image de couverture.
- SEO article.
- Statut brouillon / publié.
- Administration articles.
- Pas de commentaires publics en V1.

## 12. V1 - PWA

- Manifest.
- Icônes.
- Couleur de thème.
- Installation mobile / desktop.
- Cache des assets essentiels.
- Comportement propre en cas de réseau faible.
- Pas de panier offline complexe.
- Pas de notifications push en V1.

## 13. V1 - SEO

- Métadonnées globales.
- Métadonnées par page.
- Métadonnées produit.
- Open Graph.
- Sitemap.
- Robots.txt.
- URLs lisibles.
- Données structurées principales.
- Redirections des anciennes URLs importantes.
- Pages légales indexables si pertinent.

## 14. V1 - Sécurité

- Validation serveur.
- Sanitization des entrées.
- Protection uploads.
- Secrets en variables d'environnement.
- Webhook Stripe signé.
- Protection admin.
- Rate limit formulaires sensibles.
- Protection anti-spam formulaire contact.
- Pas de route de test en production.
- Logs d'erreurs.

## 15. V1 - Données et conformité

- Politique de confidentialité.
- CGV.
- Mentions légales.
- Gestion cookies si outil de tracking.
- Consentement formulaires.
- Minimisation des données.
- Pas de stockage de données bancaires complètes.
- Durée de conservation à définir.

## 16. V1 - Tests et validation

- Test navigation mobile.
- Test navigation desktop.
- Test catalogue.
- Test fiche produit.
- Test panier.
- Test paiement Stripe test.
- Test webhook.
- Test création commande.
- Test email confirmation.
- Test formulaire contact.
- Test formulaire réparation avec image.
- Test formulaire sur-mesure.
- Test admin produits.
- Test admin commandes.
- Test permissions admin.
- Test SEO de base.
- Test performance pages clés.

## 17. Reste à arbitrer plus tard

Ces éléments sont importants mais ne sont pas placés en V1 tant qu'ils ne sont pas nécessaires au lancement.

- Compte client optionnel.
- Connexion Google.
- Connexion Apple.
- Magic link client.
- Historique commandes client.
- Téléchargement factures depuis espace client.
- Suivi détaillé de commande.
- Suivi de fabrication.
- Compte club.
- Tarifs professionnels.
- Paiement d'acompte.
- Devis en ligne.
- Signature de devis.
- Configurateur produit.
- Variantes complexes.
- Favoris.
- Newsletter avancée.
- Automatisation marketing.
- Avis clients.
- Commentaires blog.
- Programmation des articles.
- Gestion rendez-vous.
- Intégration transporteur.
- Suivi livraison avancé.
- Gestion remboursement avancée.
- Multi-admin avec rôles complexes.
- Exports comptables.
- Statistiques avancées.
- Notifications push.
- Offline avancé PWA.
- Traduction anglaise complète si non faite en V1.
- Gestion fine des contenus de page d'accueil par l'admin.
- CMS complet.

## 18. Premières tâches concrètes quand le codage commencera

Ordre recommandé :

1. Initialiser le projet.
2. Valider la stack exacte.
3. Créer le schéma de données initial.
4. Mettre en place l'auth admin.
5. Créer le design system minimal.
6. Créer le layout public.
7. Créer le catalogue.
8. Créer l'admin produits.
9. Créer le panier.
10. Brancher Stripe.
11. Ajouter les demandes réparation / sur-mesure.
12. Ajouter le journal.
13. Ajouter SEO / PWA / conformité.
14. Tester les parcours complets.

