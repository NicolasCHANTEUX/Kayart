# Corrections autonomes — 9 septembre 2026

Ce lot traite des points de l’audit qui ne nécessitent ni informations commerciales/juridiques ni secrets supplémentaires. Les changements sont locaux, non déployés à ce stade.

## Réalisé

- **C01 — Boutique** : recherche nom/référence/description, filtres catégorie/type/stock, tri nouveautés/nom/prix, 12 produits par page. Filtres et pagination dans l’URL ; réinitialisation et message sans résultat. Les prix sur devis restent en fin des tris par prix.
- **C03 — Commandes** : recherche numéro/nom/email, filtre de statut et 25 commandes par page, pagination réelle en base et total des résultats. La 51e commande devient accessible. Le chargement complet du catalogue est évité sur cette page lorsque le simulateur est désactivé. Le tableau de bord utilise maintenant des compteurs en base, sans limite de 50 commandes, et distingue les commandes de test.
- **C06/C09 — Galerie et images, partiellement** : couverture affichée en premier, sélection conservée par identifiant, affichage de remplacement après erreur réseau, chargement différé des cartes et miniatures et décodage asynchrone. La grande image est chargée immédiatement. Le complément ci-dessous ajoute la réorganisation et le choix de couverture dans l’administration ; les variantes responsive restent à faire.
- **Déconnexion** : appel Supabase avec `scope=local` pour révoquer la session courante. Les deux cookies sont effacés même en cas de panne Supabase ; l’échec distant produit un avertissement sans secret. Un jeton d’accès déjà émis peut rester valide jusqu’à son expiration, conformément au [fonctionnement Supabase](https://supabase.com/docs/reference/javascript/auth-signout). Le renouvellement automatique a été ajouté dans le complément ci-dessous.
- **Réinitialisation du mot de passe** : les credentials du lien sont retirés immédiatement de l’historique et de la barre d’adresse ; mot de passe composé seulement d’espaces refusé ; jeton retiré de l’état après succès. Les mots de passe contenant des espaces significatifs restent préservés. Le double passage d’effet React en développement est pris en compte.
- **Clavier et mobile** : lien d’évitement vers le contenu, focus visible et filtres disposés sur plusieurs lignes selon la largeur. Pas de certification d’accessibilité ou de recette mobile visuelle.
- **CI** : workflow GitHub préparé pour installation propre, génération Prisma, tests, TypeScript et build en mode mock, sans secret ni accès à la base. Son exécution distante n’est pas encore validée : il faut publier ce lot.

Les requêtes de recherche paginent dans PostgreSQL en mode Prisma, avec ordre stable et lecture cohérente du total et des résultats. Les brouillons, archives et produits masqués restent exclus. Les contrôles administrateur précèdent les recherches de commandes. Une catégorie inactive disparaît des options de navigation mais ne dépublie pas ses produits : aucun changement de cette règle métier n’est imposé ici.

## Complément : administration et référencement

- **Administration produits** : pagination réelle en base par dix produits, total des résultats et liens conservant recherche/catégorie/type/stock. Les images de la page sont chargées de façon différée avec affichage de remplacement. Le tableau est rendu sur le serveur et ne transmet plus tout le catalogue au navigateur. Les services et produits sur commande sont exclus des filtres de stock physique, comme dans les badges.
- **Tableau de bord** : total exact des produits et commandes, compteur distinct des commandes test et nombre de demandes nouvelles/en cours sur les trois formulaires. Lectures agrégées sans chargement des contenus clients ; vérification administrateur avant accès à la base.
- **SEO technique** : routes robots.txt et sitemap.xml dynamiques, métadonnées de partage propres aux produits, URL canonique de produit après activation, noindex pour l'administration, les pages de connexion et le panier. Le sitemap exclut les produits non publiés et les pages légales non approuvées. Aucun domaine commercial n'est inventé.
- **Activation de l'indexation** : désactivée par défaut. Voir [le guide](../../docs/referencement.md) pour renseigner l'origine HTTPS de production et activer KAYART_INDEXING_ENABLED. Les données mock et les previews Vercel restent exclues. Cela ne remplace pas le contrôle d'accès.

## Complément : édition des imparfaits et images

- Choix de couverture parmi les images enregistrées ou les nouveaux envois, boutons Avancer/Reculer pour les deux groupes, annulation des retraits avant enregistrement. Les nouvelles images sont ajoutées après les images conservées.
- Limite de six images appliquée dans l'interface et sur le serveur, en incluant celles déjà enregistrées. L'ordre est normalisé et les identifiants d'un autre produit ou les listes devenues incomplètes sont refusés. La transaction retire l'ancienne couverture avant d'en définir une autre, pour respecter l'index unique existant.
- L'édition d'un imparfait conserve son type et son modèle d'origine ; exige un défaut décrit, au moins une photo, et un prix positif inférieur au prix de référence. Les prix au centime restent inchangés quand le prix n'est pas retouché. Les champs d'état s'affichent aussi quand on sélectionne Occasion dans un formulaire de création.
- La fiche publique affiche désormais la description et les images de la pièce elle-même. Le modèle reste lié et ses images servent de repli si la pièce n'en a aucune.
- Aucune suppression physique des médias : ils peuvent encore être référencés ailleurs. Pas de migration ni d'écriture distante effectuée. La remise en ordre entre une image nouvelle et une image enregistrée est possible après enregistrement.

## Complément : renouvellement des sessions

Le middleware renouvelle les jetons expirants ou absents à la prochaine requête et transmet les nouveaux cookies à la requête courante et au navigateur. Les cookies restent HttpOnly ; les contrôles de rôle restent effectués par les services. Les pannes ne détruisent pas les credentials récupérables ; les refus explicites de session invalide les effacent. L'expiration et les erreurs sont testées sans accès Supabase réel. Voir [le détail et la procédure de recette](../../docs/sessions.md).

## Vérification

67 tests passent, dont vingt-cinq nouveaux contrôles sur filtres combinés, pagination de commandes anciennes, protection des lectures, encodage des paramètres, révocation locale et nettoyage des cookies en cas de panne. La panne Supabase est simulée ; aucun compte réel n’a été déconnecté pendant les tests.

TypeScript et build de production sur copie isolée passent. Les vérifications HTTP sont conservées dans [http-verification.json](http-verification.json). 36 contrôles HTTP généraux et cinq contrôles HTTP de renouvellement passent, plus la route retirée qui retourne 410. Les cinq nouveaux résultats sont conservés dans [session-refresh-http.json](session-refresh-http.json). La déconnexion après renouvellement laisse bien les deux cookies expirés. La recette couvre également les réponses HTML/RSC sans connexion et les recherches sans résultat. Six tests supplémentaires couvrent l’édition des images et imparfaits, notamment le respect de la couverture unique à chaque écriture et le refus avant mutation des changements invalides. Pas de recette visuelle navigateur dans cette session. Les nouveaux tests couvrent aussi les compteurs au-delà de 50 commandes, les filtres de stock, les accès interdits et le sitemap sans données privées. Les requêtes Prisma sont vérifiées sur des doublures : aucune lecture de contenu client ni écriture distante dans ce lot. La compilation utilise les dépendances déjà installées ; le workflow CI permettra de vérifier une installation propre sur Linux une fois publié.

## Encore faisable sans données commerciales

Recette des sessions réelles avec plusieurs onglets, conservation de tous les champs et des envois lors des erreurs de formulaire, nettoyage contrôlé des médias orphelins, journal d’actions, enrichissement SEO et autres contenus/interface à partir de données réellement disponibles. Ces points ne sont pas déclarés terminés par ce lot.

Les blocages Stripe, accès de gestion, tarifs et identité juridique restent décrits dans [le suivi d’activation](../../docs/activation-priorites.md).
