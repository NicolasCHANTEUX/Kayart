# KayArt — Fonctionnalités réalisées et plan de complétude

Audit du 7 septembre 2026, branche `main`, commit `9272785`. Les défauts prioritaires sont détaillés dans le [rapport des urgences](01-urgences.md). Ce document décrit le reste du travail et la base déjà disponible.

**KayArt est actuellement un catalogue administrable avec une vitrine et un socle d’authentification. Ce n’est pas encore une application de vente et de gestion des demandes complète.** La majorité des interfaces métier avancées visibles dans la maquette Figma n’a pas été intégrée à l’application Next.js.

## Périmètre, méthode et limites

**169 fichiers suivis par Git** ont été inventoriés : 68 fichiers applicatifs dans `src` (environ 11 500 lignes), 8 fichiers de base de données, 10 de configuration, 9 documents de cadrage, 3 assets publics suivis, 2 scripts opératoires, 66 fichiers de prototype Figma et 3 fichiers de cache/outillage. L’[inventaire CSV](inventaire-fichiers.csv) et l’[inventaire JSON](inventaire-fichiers.json) donnent les chemins et empreintes des fichiers.

L’audit fonctionnel détaillé porte sur l’application active, ses actions serveur, accès aux données, validations, composants, configuration et scripts. La maquette et sa bibliothèque UI ont été examinées comme références séparées, avec inventaire et analyse structurelle ; elles n’ont pas fait l’objet d’une recette complète indépendante. Les caches, dépendances et fichiers générés ne sont pas assimilés à des fonctionnalités développées. Les deux images locales non suivies ont été inventoriées par taille ; aucune expertise photographique n’a été réalisée.

Le périmètre attendu provient de `outputs/cahier-des-charges-kayart.md`, `outputs/feuille-de-route-v1-et-suite.md` et des décisions ultérieures disponibles. Les documents ont parfois vieilli : ils ne sont pas utilisés comme preuve qu’une fonctionnalité fonctionne. Les décisions ouvertes ne sont pas transformées en obligations arbitraires.

| Vérification | Résultat et portée |
|---|---|
| État initial Git | Arbre suivi sans modification, `main` au commit indiqué |
| TypeScript | `npm.cmd run typecheck` passe |
| Build de production | Terminé avec succès sur une copie isolée du code, mode `mock`, sans secrets ni base réelle |
| HTTP local | 28 routes GET et 2 requêtes POST examinées ; pages publiques, absence des parcours, redirections admin et protections de signature |
| Reproductions ciblées | Prix, attributs, types, redirection, comptes, commandes, mot de passe, cookie, limite de fréquence |
| Fuite admin | Reproduite sur un second build avec fixtures privées uniquement dans la copie de test |
| Supabase | Métadonnées lues après autorisation : droits, RLS, contraintes, index, rôle serveur, triggers, paramètres du bucket |
| Dépendances | Dernier résultat npm enregistré : 10 entrées vulnérables, dont 7 élevées et 3 modérées |
| Tests automatisés du projet | Aucune suite métier, E2E ou configuration de tests trouvée ; les scripts d’audit ajoutés ne constituent pas cette future suite |
| Navigateur / accessibilité / performance visuelle | Aucun navigateur connecté disponible ; pas de recette visuelle ni de score Lighthouse mesuré |
| Paiement, emails, CRUD distant | Non exercés ; aucun achat, email, compte ou produit réel créé/modifié/supprimé |

Le build local utilise la résolution de dépendances existante ; une installation propre en CI et le build en mode Prisma restent à vérifier. L’avertissement de plusieurs lockfiles du build d’audit vient de la copie isolée. Il ne prouve pas une erreur du déploiement normal.

Les réponses Next.js diffusées progressivement peuvent contenir une redirection ou un `notFound` après un statut HTTP 200. Cela a été observé sur les routes admin et un produit inexistant. Le statut seul ne permet donc ni de conclure à un accès admin réussi, ni à une bonne protection : le corps a également été analysé.

## Ce qui est effectivement réalisé

« Implémenté » décrit un chemin présent dans le code ; cela ne signifie pas « certifié en production ». Les preuves et réserves distinguent les deux.

| Fonctionnalité | État réel | Réalisation et limites |
|---|---|---|
| Socle Next.js / React / TypeScript | Implémenté | App Router, typage strict, scripts de build et vérification |
| PostgreSQL et Prisma | Implémenté, à consolider | Client avec adapter PostgreSQL et instance partagée ; base accessible ; migrations et contraintes à reprendre |
| Source de données mock / Prisma | Implémenté | Abstraction repository/service ; la valeur non reconnue bascule silencieusement en mock |
| Mise en page générale | Implémentée | Header, footer, navigation, styles responsive, page 404, états de chargement |
| Accueil | Partiel | Hero, produits mis en avant, étapes atelier, liens métier ; textes de cadrage et photos provisoires |
| Navigation mobile | Présente, recette nécessaire | Liens qui passent à la ligne avec le CSS ; pas de menu mobile repliable dans l’application active |
| Catalogue public | Partiel utilisable en lecture | Liste des produits publiés ; cartes, images, descriptions et prix ; recherche/filtres/tri absents côté public |
| Fiche produit | Largement implémentée en lecture | SKU, état, stock, prix/remise, description, caractéristiques, galerie et métadonnées |
| Galerie | Implémentée, à consolider | Image précédente/suivante, miniatures, compteur ; couverture initiale et erreurs d’images à corriger |
| Produits neufs | Implémentés | Création, édition, publication, stock et options ; pas d’achat effectif |
| Services | Implémentés au catalogue | Type explicite, stock null, prix ou demande ; destination contact incomplète |
| Produits sur commande/personnalisables | Partiels | Statuts et CTA devis ; aucun recueil structuré ni traitement de devis |
| Produits imparfaits | Implémentés, incomplets à l’édition | Création depuis un modèle neuf, remise, pièce unique, description et photos de défaut ; édition dédiée manquante |
| Occasion | Non conforme au cadrage actuel | Valeur SQL existante et seed, mais convertie en imparfait dans l’application, U06 |
| Catégories | CRUD implémenté | Nom, slug, position, actif, description ; pas de vraie navigation publique par catégorie ni règle d’activation appliquée au catalogue |
| Administration produits | Implémentée, corrections urgentes | Liste, recherche nom/SKU, filtres catégorie/type/stock, affichage par tranches de 10 |
| Formulaire produit progressif | Implémenté | Six étapes, validations client et serveur, SKU/slug générés, aperçu de remise |
| Modification rapide du stock | Implémentée | Entier non négatif, service exclu, pièce unique limitée à 1 ; aucun mouvement de stock ni contrôle de concurrence |
| Masquer / afficher / archiver | Partiel | Masquer/afficher dans la liste, statuts dans le formulaire ; état de vente écrasé lors du changement de visibilité |
| Suppression produits/catégories | Implémentée avec confirmation | Suppression définitive ; conséquences sur historique et catégories à corriger |
| Images produits | Implémentées, à sécuriser | Sélection multiple, drag-and-drop, prévisualisation, couverture à l’ajout, stockage local ou Supabase, ajout/suppression à l’édition |
| Connexion et rôle admin | Implémentés, sécurité incomplète | Vérification Supabase, cookies HttpOnly, Secure en production, contrôle rôle sur mutations ; fuite sur lectures U02 |
| Inscription | Implémentée, à corriger | Validation et création Supabase ; rattachement de compte dangereux U01 ; pas d’espace client |
| Mot de passe oublié/réinitialisation | Implémentés, non testés avec emails réels | Appel de récupération et formulaire de changement ; incohérence des espaces de mot de passe, C11 |
| Déconnexion | Implémentée localement | Cookies effacés ; révocation distante non appelée |
| Renouvellement de session | Manquant | Refresh token écrit mais jamais utilisé |
| Tableau de bord admin | Partiel | Compteurs de catalogue et des 50 dernières commandes ; carte demandes en attente ; texte de vente directe obsolète |
| Commandes administrateur | Outil de simulation implémenté | Création de commandes factices, lignes, quantités, calcul serveur, marquage payé et suppression ; ne change pas le stock |
| Commandes commerciales | Schéma préparé seulement | Tables, statuts, adresses, identifiants Stripe ; aucun parcours de commande client |
| Panier / checkout invité / paiement | Non implémentés | Page panier d’attente ; pas de gestion panier, Stripe ou webhook |
| Livraison / retrait / facture / remboursement | Non implémentés | Quelques champs et enums ; aucun fonctionnement métier |
| Contact / réparation / sur-mesure | Pages d’attente + modèles | Aucune soumission, photo client, notification ou file de traitement admin |
| Réservations | Modèle et indicateurs seulement | Pas de formulaire, blocage de stock, durée, expiration ou conversion |
| Alerte de retour en stock | Modèle seulement | Bouton « Être prévenu » renvoie vers contact ; pas d’abonnement ou d’email |
| Journal / articles | Page d’attente + modèle | Pas de liste alimentée, page article, édition ou publication admin |
| Savoir-faire / FAQ / services éditoriaux | Partiels ou absents | Savoir-faire est un texte d’attente ; `/faq` et `/services` sont absents |
| Pages légales | Routes présentes, contenu absent | Une phrase à compléter sur chacune des trois pages |
| SEO | Socle partiel | Métadonnées générales et produit, slugs, Open Graph global ; sitemap, robots et données structurées absents |
| PWA | Ébauche | Manifest et SVG ; service worker inactif côté application, sans cache ni mode réseau dégradé |
| Journalisation et supervision | Non implémentées | Modèle AuditLog inutilisé ; pas de collecte structurée des erreurs ni d’alertes |

## Ce qui existe uniquement dans la maquette

`work/figma-implement-features-20260714` est une application Vite distincte, exclue par le `tsconfig.json` racine. Son `src/app/App.tsx` contient un catalogue filtrable, panier, simulation de checkout, pages articles, FAQ, gestion de réservations/demandes/commentaires et tableaux de bord plus riches.

Ces écrans reposent sur des données initiales et des états React. Le checkout simule une attente puis navigue vers le succès ; la connexion admin est simulée dans le navigateur. **Ils ne constituent pas des fonctionnalités terminées du site Next.js et ne doivent pas être déployés comme système sécurisé.** La bibliothèque UI et les thèmes de cet export peuvent servir de référence, sous réserve de leurs attributions et de leur adaptation. L’ancien rapport CodeIgniter importé dans ce dossier décrit encore un autre projet.

## Consolidations après les urgences

P2 signifie à réaliser avant de déclarer la V1 complète, sans supplanter les P0/P1. P3 désigne une amélioration ou un arbitrage ultérieur. Les tests proposés ci-dessous sont des critères de réception futurs, pas des validations déjà effectuées.

| ID | Priorité | Problème ou manque concret | Travail attendu et critère de réception |
|---|---|---|---|
| C01 | P2 | Recherche, filtres et tri publics absents | Requêtes serveur sur nom/SKU/description et filtres retenus ; URL partageable ; combinaison de filtres, zéro résultat et réinitialisation vérifiés |
| C02 | P2 | Pagination seulement visuelle dans l’admin | Filtrer/paginer en base ; ne pas envoyer tous les produits et relations au navigateur ; chargement suivant réellement incrémental |
| C03 | P2 | Commandes limitées aux 50 dernières | Pagination/recherche/filtres et compteur total séparé ; la 51e commande reste retrouvable |
| C04 | P2 | `isActive` des catégories n’influence pas les produits publiés | Définir l’effet métier ; appliquer la même règle aux listes, fiches et choix de catégories ; prévoir réaffectation avant suppression |
| C05 | P2 | Limite de 6 images vérifiée seulement sur les nouvelles images | Compter existantes conservées + ajouts dans une opération cohérente ; refuser une septième image lors d’une édition et en cas d’éditions concurrentes |
| C06 | P2 | Couverture et galerie incomplètes | Changer la couverture existante et réordonner ; la galerie doit démarrer sur la couverture choisie (`ProductGallery` démarre à l’index 0) ; une seule couverture garantie |
| C07 | P2 | Fichiers orphelins et suppression incomplète | Nettoyer uploads abandonnés et fichiers remplacés ; la suppression SQL ne supprime pas l’objet local/Supabase ; protéger les médias encore référencés |
| C08 | P2 | Mauvais choix de stockage côté navigateur | `shouldUseDirectImageUpload` regarde uniquement l’URL publique Supabase et ignore `KAYART_IMAGE_STORAGE=local` ; transmettre une capacité explicite ; tester chaque mode |
| C09 | P2 | Images non optimisées | Actuels `<img>` sans stratégie responsive/lazy systématique, originaux jusqu’à 12 Mo, aucune transformation ; générer dimensions/variantes, alt éditables et image de secours ; mesurer poids et temps d’affichage |
| C10 | P2 sécurité | Limite de fréquence en mémoire et par paire IP/email | Stockage partagé, plafonds IP ET identifiant ET global ; confiance explicite dans le proxy ; test local : 20 emails différents passent sur une IP malgré une limite de 5 par paire |
| C11 | P2 | Mots de passe avec espaces incohérents | Login/inscription font `.trim()`, reset conserve les espaces ; utiliser exactement le mot de passe saisi dans les trois parcours ; valider ancien/nouveau et espaces initiaux/finals |
| C12 | P2 | Brouillon en cookie trop volumineux et récupération partielle | Un texte de 2 000 « é » produit 12 032 octets, au-delà de la taille habituelle d’un cookie navigateur ; stocker autrement/borné ; préserver saisie et références d’upload lors des erreurs, y compris édition et imparfaits |
| C13 | P2 sécurité | Modèle d’origine non publié inclus avec un imparfait public | `productInclude.baseProduct` n’a aucun filtre de publication et le mapper expose descriptions/images ; définir les données publiques du modèle et tester un parent masqué/brouillon |
| C14 | P2 | Session expirée non renouvelée | Utiliser la rotation du refresh token et gérer la fin de session ; éviter la perte de formulaire après expiration ; prévoir la révocation distante selon le parcours de déconnexion retenu |
| C15 | P2 | Lectures de session qui écrivent en base | Chaque `getUserRole` existant réécrit l’email ; plusieurs appels layout/header/page ; séparer synchronisation et lecture, mutualiser par requête sans cache partagé entre utilisateurs |
| C16 | P2 | Erreurs avalées ou détails internes montrés | `getCurrentAuthSession` transforme toute erreur en absence de session ; actions commandes renvoient `error.message` en URL ; codes publics stables, logs internes sans secrets/PII, distinction panne/auth |
| C17 | P2 | Aucune page `error.tsx` ni reprise métier | Ajouter frontières d’erreur et reprise adaptée, états catalogue vide et service indisponible ; simuler panne DB/API, timeout et échec upload |
| C18 | P2 | Validation sans bornes complètes | Borner textes, prix, quantités, lignes, UUID et tailles cumulées ; invalide `files` non tableau peut faire échouer `normalizeFiles` ; erreurs 400 contrôlées, pas 500 |
| C19 | P2 | Double soumission de produits/catégories | Pas d’état pending systématique ni d’idempotence métier ; boutons en cours d’envoi, protection serveur des opérations non répétables, soumission répétée testée |
| C20 | P2 | Modales sans gestion complète du focus | Nom accessible, focus initial, piège de focus, Échap, restitution du focus ; le menu de ligne gère Échap mais pas les modales elles-mêmes ; recette clavier et lecteur d’écran |
| C21 | P2 | Navigation et responsive non recettés | Menu mobile, zoom 200 %, largeur 320 px, clavier, zones tactiles, états actifs et lien d’évitement ; les media queries présentes ne prouvent pas la qualité finale |
| C22 | P2 | États de chargement artificiels ou bloquants | Chargement global plein écran et délai fictif 180 ms pour des lignes déjà en mémoire ; préférer retour local et progression utile ; pas de blocage résiduel si navigation échoue |
| C23 | P2 | Mise en avant trop large | `listFeaturedProducts` ajoute tous les non-neufs et n’impose aucune limite ; respecter le choix admin et borner la sélection d’accueil |
| C24 | P2 | Données publiques non mises en cache de façon choisie | Session consultée dans le header commun ; réponse accueil observée `private, no-store` ; choisir stratégie de cache pour catalogue et revalidation sans jamais partager une session |
| C25 | P2 | Date `updatedAt` pas systématiquement modifiée | Éditions produit, stock et visibilité omettent la mise à jour ; Prisma utilise `@default(now())`, pas `@updatedAt` ; aucune garantie trigger constatée |
| C26 | P2 | Seeds et environnements fragiles | Seed JS réécrit les produits existants et remplace leurs attributs, sans garde d’environnement ni transaction globale ; il recharge `.env.local` avec priorité sur certaines variables du shell ; rendre la cible explicite et réserver au développement |
| C27 | P2 | Absence de migrations et de CI fiables | Migration baseline, procédure deploy, contrôle de dérive, installation propre, typecheck, vrai lint et tests ; `lint` est actuellement un alias de typecheck |
| C28 | P2 | Configuration de base non reproductible | Versionner grants/RLS et permissions Storage ; droits publics actuels refusés mais aucun script de révocation correspondant ; un nouvel environnement doit reproduire les interdictions |
| C29 | P2 sécurité | Rôle de connexion serveur surpuissant | Inspection : `BYPASSRLS` et `CREATEDB` ; distinguer rôle runtime et migrations, permissions minimales ; vérifier les requêtes métier avec ce rôle réduit |
| C30 | P2 | AuditLog, erreurs et alertes inexploités | Journaliser auteur/action/entité des opérations sensibles, erreurs sans secrets, alertes paiement/email/stock ; vérifier qu’un incident devient détectable et retraçable |
| C31 | P2 | Documentation obsolète | README annonce un socle initial, documents disent images locales et édition absente alors que Storage/édition existent ; aligner procédure réelle, variables et limites ; préciser module simulation |
| C32 | P2 | Données de démonstration incompatibles avec l’éditeur | Seeds avec poids textuel, dimensions/prix manquants ; formulaire exige valeurs numériques et complétude même pour des brouillons ; permettre brouillon progressif et vérifier publication complète |
| C33 | P2 | Modification d’imparfait peu fidèle | Description publique issue du modèle et défaut lu depuis `defectDescription`, mais formulaire général édite seulement `description` ; éditeur propre au type, prévisualisation de la fiche réelle |
| C34 | P2 | Liens de contact peu pratiques | Email et téléphone rendus comme texte ; créer `mailto:`/`tel:`, coordonnées validées et contexte produit conservé dans les demandes |
| C35 | P3 | CSS et règles métier dupliqués | Feuille de 3 242 lignes, validations client/serveur et seuils stock divergents (2 contre 5) ; extraire composants/styles/règles communs après stabilisation |
| C36 | P2 | Secrets et configuration d’environnement à valider au démarrage | Refuser configuration production ambiguë et fallback mock silencieux, limiter les clés publiques, timeouts réseau ; `.env.local` est bien ignoré et aucune fuite de secret réelle n’a été établie |
| C37 | P2 | Sauvegardes, restauration et reprise non documentées | Procédure DB + médias + historiques, restauration exercée, objectifs de perte/délai définis, retour arrière de déploiement ; état réel des sauvegardes du fournisseur non inspecté |
| C38 | P2 | CSP à renforcer après correction du rendu | `script-src 'unsafe-inline'` réduit la protection contre l’injection ; adopter une stratégie compatible avec Next, tester en-têtes et ressources sur le vrai hébergement ; pas de XSS applicative démontrée |

Repères des sources : catalogue et données dans `src/server/catalog/*`, formulaires dans `src/components/admin/*`, authentification dans `src/server/auth/*`, guards dans `src/server/security/request-guards.ts`, styles dans `src/app/globals.css`, scripts dans `scripts/`. Les lignes exactes des urgences sont indiquées dans le premier rapport.

## Modules nécessaires pour terminer la V1 définie

Les lots suivants complètent les manques fonctionnels. Ils viennent après la fermeture des failles critiques, et réutilisent les modèles déjà présents seulement après validation de leurs règles métier.

### F01 — Catalogue public exploitable

Recherche, filtres retenus, tri, pagination serveur, pages ou navigation de catégories, état sans résultat. Sur chaque fiche : quantité, disponibilité cohérente, livraison/délai/retrait et informations techniques fiables ; images réelles et alternatives pertinentes. Décider du maintien de l’occasion séparément des imparfaits.

**Recette :** trouver un produit par nom/référence, partager les filtres dans l’URL, voir un produit épuisé selon la politique retenue, ne jamais exposer brouillon/parent privé. La suppression ou modification d’un slug doit déclencher une stratégie de redirection cohérente.

### F02 — Panier persistant et checkout invité

Ajouter un produit avec sa quantité, modifier/retirer/vider, conserver le panier selon la stratégie retenue. Côté serveur : recharger le produit, recalculer les centimes, vérifier l’état vendable et le stock. Recueillir email et adresses utiles, facturation différente si nécessaire, choix de livraison/retrait et frais. Le compte reste optionnel.

**Recette :** rechargement de page, stock devenu insuffisant, produit masqué, prix changé, quantité trafiquée et commandes simultanées. Le serveur ne fait jamais confiance au prix ou au total envoyés par le navigateur.

### F03 — Paiement Stripe et commande fiable

Création de session Checkout côté serveur, webhook signé, traitement idempotent des événements, statuts cohérents, pages succès/annulation et rapprochement des paiements. Définir réservation puis consommation/libération du stock pour éviter la vente multiple d’une pièce unique. La page de succès seule ne doit pas confirmer le paiement.

**Recette :** succès, refus, abandon, événement retardé, webhook répété et événements reçus dans un ordre inattendu ; une seule commande et une seule consommation de stock pour un paiement. Aucun test de ce module n’est possible aujourd’hui puisqu’il n’existe pas.

### F04 — Gestion des commandes commerciales

Séparer simulation et exploitation. Liste complète recherchable, détails client et adresses, historique des statuts, préparation/expédition/retrait/achèvement, annulation et politique de remboursement. Définir règles de TVA, frais et numérotation avec les informations de l’activité. Générer une facture ou preuve de commande selon le choix validé, puis conserver une version fidèle aux montants et descriptions au moment de la vente.

**Recette :** historique conservé malgré changement/archivage d’un produit, document accessible au bon destinataire, paiement manuel clairement identifié, annulation et stock remis selon les règles retenues.

### F05 — Emails transactionnels

Choisir/configurer un service, domaine d’envoi, modèles et mécanisme de reprise. Confirmation utilisateur et notification atelier pour commandes, contact, réparation, sur-mesure et réservations retenues. Distinguer ces emails métier des emails d’authentification gérés par Supabase.

**Recette :** envoi contrôlé en préproduction, échec enregistré, nouvelle tentative sans doublon, contenu cohérent avec les données enregistrées. Aucune notification réelle n’a été envoyée pendant l’audit.

### F06 — Contact

Formulaire nom/email/sujet/message, validation serveur, mécanisme anti-spam, enregistrement, accusé de réception et file de traitement admin. Conserver le contexte du produit lorsque l’utilisateur vient d’une fiche.

**Recette :** erreur de validation sans perte de saisie ; demande retrouvée dans l’admin même si l’email échoue ; passage nouveau/en cours/répondu/fermé.

### F07 — Réparation

Contenu expliquant ce qui peut être diagnostiqué et étapes de prise en charge. Formulaire produit/dommage/photos, photos protégées, règles de consentement/information retenues, notification, dossier et statuts atelier.

**Recette :** demande avec et sans photos selon règle choisie, fichier invalide refusé, photo inaccessible publiquement, dossier attribuable et réponse traçable. `RepairRequest` et `RequestMedia` sont des bases, pas un parcours opérationnel.

### F08 — Sur-mesure

Formulaire discipline/usage/dimensions/contraintes, délai et budget si utiles, pièces jointes facultatives et dossier atelier. Préciser les limites et délais réels de la prestation. La V1 n’exige pas un configurateur complexe.

**Recette :** demande structurée persistée, fichiers sécurisés et bon circuit de réponse ; lien entre demande et éventuelle commande/devis selon décision métier.

### F09 — Réservation des pièces uniques, si retenue

Décider achat direct ou réservation, délai d’expiration, blocage immédiat ou après accord, acompte éventuel. Formulaire, statuts, notifications, tâche d’expiration et conversion en commande. Il faut une réservation réelle en base, pas uniquement un libellé « Réservé » sur le produit.

**Recette :** deux demandes simultanées ne bloquent/vendent pas la même pièce de façon incohérente ; expiration et annulation libèrent le stock une seule fois. Le mécanisme sans acompte proposé au cadrage reste à arbitrer.

### F10 — Journal et administration des articles

Liste et détail d’article, couverture, contenu riche maîtrisé, slug, brouillon/publication, métadonnées et administration. Les commentaires publics et la programmation avancée sont explicitement hors V1 dans la feuille de route.

**Recette :** un brouillon n’est pas accessible, publication visible, slug unique, contenu rendu sans injection, couverture et liens corrects.

### F11 — Contenus de marque et informations finales

Finaliser accueil, atelier/savoir-faire, services, FAQ, textes produits, vraies photographies, coordonnées et explication des offres. Retirer les formulations internes comme « sera développé », « V1 » et les promesses de parcours inexistants. Fournir des mentions légales, CGV et confidentialité adaptées aux informations réelles de l’activité et les faire valider.

**Recette :** aucun contenu provisoire dans les pages publiées ; toutes les promesses renvoient à une action disponible. Une décision sur outils de mesure/cookies est nécessaire avant leur ajout ; aucune nécessité d’un bandeau universel n’est déduite de cet audit.

### F12 — SEO et migration des anciennes URL

Sitemap alimenté uniquement par contenu public, robots, canonical, Open Graph par produit/article, images de partage et données structurées adaptées aux vraies offres. Traiter indexation des parcours de compte/admin, ruptures, suppressions et changements de slug. Inventorier les URL de l’ancien site et définir redirections et archives des anciennes commandes/factures.

**Recette :** `/sitemap.xml` et `/robots.txt` disponibles (404 aujourd’hui), URLs canoniques du bon domaine, aucun brouillon indexable et aucune redirection importante cassée. Le comportement des 404 diffusées après HTTP 200 doit être contrôlé avec les balises d’indexation associées, sans déduire automatiquement un défaut SEO du seul statut.

### F13 — PWA minimale réelle

Enregistrement/versionnement du service worker, icônes adaptées aux plateformes visées, comportement installation et page réseau indisponible. Cache limité aux ressources appropriées ; exclure données admin, sessions et paiements. Actuellement `public/sw.js` ne contient que installation/activation et aucun appel d’enregistrement n’est présent dans `src`.

**Recette :** installation sur appareils ciblés, mise à jour d’une version déjà installée, perte/reprise réseau sans données commerciales fausses. Push et panier hors ligne complexe restent hors V1.

### F14 — Qualité et exploitation

Suite de tests métier réellement utile, tests d’accès avec analyse des corps HTTP/RSC, parcours de vente et formulaires en préproduction, CI, migrations, environnement de test séparé, sauvegardes restaurables, supervision et procédure d’incident. Recette sur appareils réels et mesure de performance après correction de la CSP et optimisation des médias.

**Recette :** déployer depuis un checkout propre, migrer et revenir en arrière selon procédure ; diagnostiquer une panne DB/email/paiement ; retrouver qui a modifié prix/stock/statut. Définir les budgets de performance puis les mesurer au lieu d’annoncer des scores non obtenus.

## Réserve de travail : à arbitrer, sans bloquer artificiellement la V1

Ces fonctions sont évoquées dans la feuille de route mais ne sont pas nécessaires à sa complétude tant qu’elles ne sont pas ajoutées au périmètre validé :

| Domaine | Évolutions possibles |
|---|---|
| Compte client | Historique de commandes/factures, réservations et demandes, adresses, magic link, Google/Apple |
| Vente avancée | Acomptes, devis et signature, configurateur, variantes complexes, compte club/pro, tarifs spécifiques |
| Fidélisation | Alertes de stock, favoris, avis clients, newsletter et automatisations marketing |
| Contenu | Commentaires modérés, programmation, CMS étendu et pilotage complet de l’accueil |
| Logistique/comptabilité | Intégration transporteur, suivi avancé, exports comptables, remboursements avancés |
| Administration | Multi-admin avec rôles fins, statistiques avancées, rendez-vous |
| International/app | Anglais complet selon décision, push et offline avancé |

L’authentification client existe déjà, mais l’espace client est absent : il faut soit expliquer son utilité actuelle, soit reporter son exposition jusqu’à un bénéfice réel. L’achat invité demeure un critère V1.

## Comment définir une application « complète à 100 % »

Un pourcentage global serait trompeur : les modèles SQL et les maquettes peuvent donner l’impression que le travail est presque terminé alors que les parcours transactionnels sont absents. La mesure utile est le nombre de parcours acceptés de bout en bout dans un périmètre fixé.

La V1 pourra être déclarée complète lorsque les critères suivants seront tous démontrés :

| Porte de sortie | Résultat attendu |
|---|---|
| Sécurité | U02 fermé ; rattachements de comptes sûrs ; aucune donnée admin dans les réponses publiques ; permissions et uploads testés |
| Intégrité | Prix, caractéristiques, type et historique conservés ; règles de stock concurrentes et contraintes cohérentes |
| Catalogue | Un admin gère les offres et images ; le visiteur recherche, filtre et comprend l’offre réelle |
| Vente | Achat invité, paiement de test, commande unique, confirmation, document et gestion après-vente de base |
| Demandes | Contact, réparation avec photos et sur-mesure reçus, persistés, notifiés et traitables |
| Réservation | Parcours opérationnel si retenu, sinon aucune promesse de réservation non disponible |
| Contenu | Articles publiables, pages de marque et informations finales complètes |
| SEO/PWA/mobile | Socle défini et recetté, installation/réseau dégradé si PWA maintenue en V1 |
| Exploitation | Installation et déploiement reproductibles, tests automatiques, restauration testée, erreurs surveillées |

L’ordre de livraison conseillé est : sécurité et intégrité → catalogue stable → panier/paiement/commandes/emails → demandes et réservations retenues → journal/contenus → SEO/PWA et recette finale. Le choix de livraison, de facturation, de fournisseur email, du périmètre occasion/réservation et des données à migrer doit être arrêté avant les lots qui en dépendent.

## Constat précis sur Supabase

Les 16 tables `public` inspectées refusent les quatre droits de lecture/écriture usuels à `anon` et `authenticated`. **Aucune ouverture publique de ces tables n’a été mise en évidence.** RLS est activée sur une seule table (`product_attributes`), aucune politique n’est définie et le rôle serveur contourne RLS. Les grants refusés sont donc une protection réelle, à maintenir et à versionner ; l’absence de RLS seule ne suffit pas à prouver une fuite.

L’objectif est de rendre les droits explicitement reproductibles et de limiter le rôle runtime, pas d’ajouter des politiques ouvertes par défaut. La documentation officielle explique l’articulation entre [grants et Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Le bucket produit public convient à des photos publiques de catalogue ; ses limites de format/taille restent à configurer, et il ne convient pas automatiquement aux futures photos privées des clients.

La base inspectée est celle référencée par `.env.local`. L’audit n’a pas établi son identité avec la production, ni la configuration du domaine, les journaux réels, les sauvegardes du fournisseur ou la délivrabilité des emails. Ces éléments restent des vérifications de mise en service, pas des incidents déjà démontrés.
