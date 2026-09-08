# KayArt — Rapport des urgences

Audit du 7 septembre 2026. Référence : branche `main`, commit `9272785` (« Harden security controls »). Audit du code, reproductions locales et inspection autorisée des métadonnées Supabase en lecture seule. Aucun correctif applicatif ni changement distant effectué.

**L’application n’est pas prête à être ouverte comme boutique complète. La priorité absolue est une fuite de données dans les réponses des pages administrateur.** Le catalogue et son administration constituent un socle réel, mais la vente et les demandes clients ne sont pas encore opérationnelles.

Ce document recense les urgences. Le [rapport de complétude](02-fonctionnalites-et-completion.md) détaille les fonctionnalités réalisées, les manques et les consolidations.

## Lecture des priorités et des preuves

- **P0** : traiter immédiatement si le code est exposé sur Internet.
- **P1** : corriger avant exploitation commerciale ou avant utilisation régulière des fonctions concernées.
- **Reproduit** : comportement observé avec le code existant et des données fictives locales.
- **Confirmé en configuration** : état constaté en lecture seule sur la base configurée localement, sans présumer qu’il s’agit de la production.
- **Confirmé dans le code** : chemin d’exécution identifié ; pas de mutation réelle effectuée.
- **Conditionnel** : impact dépendant des données, réglages ou parcours non exercés.

| Ordre | ID | Priorité | Point à traiter | Preuve |
|---|---|---|---|---|
| 1 | U02 | P0 | Données admin accessibles dans les réponses sans connexion | Reproduit en HTTP, données fictives privées |
| 2 | U01 | P1 sécurité | Association d’un compte à un rôle par email avant preuve de possession | Reproduit sur doubles ; impact distant conditionnel |
| 3 | U08 | P1 intégrité | Suppressions définitives et actions de paiement non limitées aux tests | Code et appels sur doubles |
| 4 | U04 | P1 intégrité | Prix modifié par un simple réenregistrement | Reproduit : 19,90 € → 20 € |
| 5 | U05 | P1 intégrité | Caractéristiques supprimées lors d’une modification | Reproduit : perte de « Matière » |
| 6 | U10 | P1 intégrité | Contraintes SQL attendues absentes de la base | Inspection distante en lecture seule |
| 7 | U03 | P1 sécurité | Redirection de connexion insuffisamment validée | Fonction et résolution URL reproduites |
| 8 | U09 | P1 sécurité | Validation d’images contournable avec un droit d’upload | Code + bucket sans limites configurées |
| 9 | U07 | P1 métier | Réservé, disponible, masqué et stock mal coordonnés | Code + produit réservé testé |
| 10 | U06 | P1 métier | Produit d’occasion présenté comme neuf imparfait | Mapper reproduit |
| 11 | U11 | P1 affichage | La CSP bloque les images et polices prévues par le CSS | CSS + en-tête HTTP effectif |
| 12 | U12 | P1 lancement | Achat, demandes et contenus obligatoires au cadrage inachevés | Code + HTTP |
| 13 | U13 | P1 maintenance | Dépendances signalées vulnérables | Dernier audit npm conservé |

Les numéros sont des identifiants stables ; l’ordre du tableau indique l’ordre de traitement recommandé.

## U02 — Fuite de données administratives sans connexion

**Priorité P0. Reproduction confirmée sur un build de production local.**

La protection est dans [src/app/admin/layout.tsx:9](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/admin/layout.tsx:9>). Les pages enfants chargent leurs données sans contrôle préalable, notamment [src/app/admin/produits/page.tsx:29](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/admin/produits/page.tsx:29>), [src/app/admin/commandes/page.tsx:48](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/admin/commandes/page.tsx:48>) et [src/app/admin/produits/[id]/modifier/page.tsx:31](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/admin/produits/[id]/modifier/page.tsx:31>). Les méthodes de lecture administrative de [src/server/catalog/catalog.service.ts:35](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/catalog.service.ts:35>) n’imposent pas non plus le rôle.

Le rendu Next.js peut exécuter ces pages et sérialiser leurs propriétés dans le flux RSC, alors que le layout prépare une redirection. La redirection visible ne retire pas les données déjà présentes dans la réponse.

**Vérification réalisée :** ajout d’un brouillon, d’une commande, d’un email et d’une note entièrement fictifs dans la seule copie de test ; requêtes HTTP sans cookie.

| Route | Redirection vers connexion dans la réponse | Données privées fictives dans la réponse |
|---|---|---|
| `/boutique` | Non | Aucune des données privées injectées |
| `/admin/produits` | Oui | Nom et données du brouillon |
| `/admin/commandes` | Oui | Brouillon, email client, note interne |
| `/admin/produits/audit-private-draft/modifier` | Oui | Données du brouillon |

**Impact :** un visiteur peut examiner le corps HTTP au lieu de suivre la redirection. Le code peut alors exposer catalogue non publié, coordonnées et notes des commandes chargées. Aucune donnée personnelle distante n’a été consultée pour le démontrer. L’exposition du déploiement réel reste à confirmer ; le mécanisme applicatif est reproduit.

**Correction :** vérifier le rôle avant chaque lecture administrative, idéalement dans une couche d’accès aux données commune ; appeler cette vérification avant tout chargement de page sensible ; limiter les propriétés envoyées aux composants client. Conserver les contrôles déjà présents dans les actions d’écriture. Si ce code est en ligne, protéger temporairement l’accès au site ou aux routes admin au niveau de l’hébergement jusqu’au correctif.

**Acceptation :** sans connexion et avec un compte client, aucune donnée privée dans le HTML, les réponses RSC, les préchargements ou les accès directs ; mêmes tests avec session expirée. Les actions d’écriture doivent toujours refuser les accès non administrateurs.

Preuves : [résultats HTTP avec fixtures](preuves-fuite-admin.json), fichiers `fixture-admin-*.html`, script `inspect-private-stream.mjs`. La recommandation correspond aussi à la documentation officielle [Next.js : contrôles d’accès dans les layouts et au niveau des données](https://nextjs.org/docs/app/guides/authentication#layouts-and-auth-checks).

## U01 — Réassociation de comptes par email insuffisamment sûre

**Priorité P1 sécurité. Défaut local confirmé ; exploitation distante non testée.**

[src/app/inscription/actions.ts:41](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/inscription/actions.ts:41>) appelle `resolveAuthenticatedSession` immédiatement après l’inscription. `signUpWithPassword` restitue uniquement un identifiant et un email, sans transporter ni vérifier l’état de confirmation. Dans [src/server/auth/session.ts:124](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/auth/session.ts:124>), une recherche par email peut ensuite remplacer `authUserId` sur un client existant tout en conservant son rôle, y compris `admin`. Il n’existe pas de condition imposant que l’ancienne liaison soit vide.

Sur un double local contenant un client administrateur déjà lié, fournir un autre identifiant avec le même email remplace cette liaison et renvoie le rôle administrateur.

**Impact :** corruption du rattachement et confusion d’identité ; possibilité d’élévation de privilèges selon les règles d’inscription/confirmation et l’état des comptes. Ce test ne démontre pas une prise de contrôle effective d’un compte Supabase existant. La création d’un utilisateur et l’existence d’une session authentifiée doivent être distinguées ; voir [Supabase : inscription](https://supabase.com/docs/reference/javascript/auth-signup).

**Correction :** ne pas résoudre de rôle sensible depuis le simple résultat d’inscription ; vérifier une session auprès de Supabase avant toute liaison ; ne jamais écraser automatiquement une liaison existante ; attribuer les administrateurs par identifiant Auth vérifié et procédure explicite. Ajouter l’unicité normalisée des emails, absente de la base inspectée.

**Acceptation :** inscription répétée, email déjà présent, email non confirmé et identifiant différent ne changent jamais un administrateur existant. Tests sur base isolée ; aucune création de compte réel nécessaire.

Preuve : `preuves-reproductions.json`, entrée U01.

## U08 — Suppressions et paiements de test dangereux pour de vraies données

**Priorité P1 intégrité. Chemins confirmés dans le code et sur doubles.**

- [src/server/catalog/catalog.repository.ts:519](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/catalog.repository.ts:519>) détache les lignes de commande, **supprime les réservations** du produit puis supprime le produit. Cela contredit la décision documentée de privilégier l’archivage.
- [src/server/catalog/catalog.repository.ts:633](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/catalog.repository.ts:633>) supprime une commande par son seul identifiant. Le schéma supprime ses lignes en cascade.
- [src/server/catalog/catalog.repository.ts:616](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/catalog.repository.ts:616>) permet de marquer payée une commande quelconque. Il ne vérifie ni son caractère factice, ni l’état précédent, ni une preuve de paiement. `status` reste inchangé et `paidAt` peut être réécrit.
- Les écrans parlent de commandes factices, mais `listAdminOrders` charge toutes les commandes et les actions ne filtrent pas les commandes réelles.

Ces actions exigent bien un administrateur : il s’agit d’un risque d’intégrité métier, pas d’une écriture publique démontrée. Le marquage actuel ne doit pas être considéré comme une intégration Stripe.

**Correction :** archiver les produits commercialisés ; conserver réservations et historique ; isoler les commandes factices avec un attribut dédié et un environnement ou un garde-fou explicite ; définir les transitions de paiement, les opérations manuelles autorisées et leur journalisation.

**Acceptation :** une commande réelle ne peut pas être supprimée par l’outil de test ; répéter une notification ou une action ne modifie pas deux fois l’historique ; archiver un produit conserve ses réservations et lignes historiques.

Preuves : `preuves-reproductions.json`, U08 ; `prisma/schema.prisma`, modèles OrderItem et Reservation.

## U04 — Réenregistrer un produit change son prix

**Priorité P1. Reproduit.**

[src/server/catalog/product-form-draft.ts:88](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/product-form-draft.ts:88>) convertit les centimes en euros avec `Math.round`. Un produit à **1 990 centimes** alimente le formulaire avec **20** ; `parseProductUpdateFormData` restitue alors **2 000 centimes** sans modification voulue du prix. L’interface de prix interdit également les décimales ([src/components/admin/product-form.tsx:267](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/components/admin/product-form.tsx:267>)). Le formulaire imparfait applique le même arrondi au prix du modèle.

**Correction :** préserver les centimes de bout en bout, saisir des euros avec deux décimales, convertir une seule fois et éviter la reconstruction approximative d’une remise historique. Un simple changement de description ne doit pas recalculer le tarif.

**Acceptation :** réenregistrement inchangé de 19,90 €, 19,99 €, 0,01 € et d’un prix remisé : mêmes centimes et même prix barré.

Preuve : `preuves-reproductions.json`, U04.

## U05 — Modification d’une fiche : perte de caractéristiques

**Priorité P1. Reproduit.**

[src/server/catalog/catalog.input.ts:722](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/catalog.input.ts:722>) reconstruit uniquement les attributs « Poids » et « Dimensions ». [src/server/catalog/catalog.repository.ts:377](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/catalog.repository.ts:377>) supprime ensuite tous les attributs pour recréer ceux soumis. Un produit possédant « Matière », « Usage », « Rigidité », etc. perd donc ces informations après une modification ordinaire.

**Correction :** conserver les attributs non édités, ou fournir un éditeur de caractéristiques complet avec identifiants et opérations explicites. L’édition des défauts d’un imparfait doit aussi être dédiée : le formulaire général ne soumet pas `defectDescription`, alors que la fiche publique le lit prioritairement.

**Acceptation :** modifier uniquement le nom ou une image conserve toutes les caractéristiques et le défaut documenté ; les suppressions d’attributs sont explicites.

Preuve : `preuves-reproductions.json`, U05.

## U10 — La base ne possède pas les contraintes prévues

**Priorité P1. Confirmé sur la base configurée.**

L’inspection de `pg_constraint` et `pg_indexes` révèle :

- aucun `CHECK` sur les tables du schéma `public` ;
- absence de l’index unique sur `lower(customers.email)` ;
- absence de l’index imposant une seule image principale par produit ;
- aucun trigger `updated_at` visible dans le schéma inspecté.

Ces protections sont partiellement écrites dans `database/schema-v1.sql`, mais ne sont pas toutes exprimées dans `prisma/schema.prisma`. Aucun historique `prisma/migrations` n’est présent. Le projet utilise surtout `db:push`, qui ne constitue pas ici une chaîne reproduisant le contrat SQL complet.

**Impact :** doublons d’email, plusieurs couvertures, valeurs incohérentes lors d’imports ou de futurs chemins d’écriture. Ce n’est pas la preuve que de telles données existent déjà : le contenu des tables n’a pas été inspecté.

**Correction :** établir des migrations versionnées, vérifier les données existantes avant d’ajouter les contraintes, couvrir les règles prix/stock/quantités et l’unicité des couvertures, puis garantir le même résultat sur une base neuve. Définir `updatedAt` dans les écritures ou un mécanisme systématique.

**Acceptation :** une installation depuis zéro et la mise à niveau d’une base existante produisent les mêmes contraintes ; les écritures incohérentes sont refusées au niveau approprié.

Preuve : [métadonnées de la base](preuves-base.json). Les clés, mots de passe et contenus clients n’y figurent pas.

## U03 — Redirection de connexion vers une autre origine

**Priorité P1 sécurité. Validateur et normalisation URL reproduits.**

[src/app/connexion/actions.ts:70](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/connexion/actions.ts:70>) et [src/app/connexion/page.tsx:97](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/connexion/page.tsx:97>) rejettent `//`, mais acceptent un chemin commençant par une barre oblique puis une barre oblique inverse. L’analyseur URL normalise ce chemin vers une autre origine. Le paramètre peut être réutilisé après connexion ou pour une session déjà connectée.

**Impact :** redirection trompeuse depuis une page de connexion légitime. Aucun vol de session n’est démontré par ce seul défaut, et le parcours de connexion distant n’a pas été exercé.

**Correction :** utiliser une validation unique basée sur `new URL(path, origineDeConfiance)`, comparer les origines, refuser les caractères de contrôle et séparateurs ambigus, retourner un chemin interne normalisé ou une destination par défaut.

**Acceptation :** tests des formes normales, relatives, protocol-relative, encodées et avec antislash ; aucune sortie de l’origine autorisée.

Preuve : `preuves-reproductions.json`, U03, domaine fictif `.invalid`.

## U09 — Les fichiers envoyés ne sont pas vérifiés de bout en bout

**Priorité P1 sécurité. Défaut de validation et configuration confirmés ; aucun fichier malveillant envoyé.**

L’API de signature est protégée par rôle, origine et limite de fréquence. Elle valide cependant les **déclarations JSON** du navigateur : nom, MIME et taille ([src/app/api/admin/product-images/upload-url/route.ts:47](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/api/admin/product-images/upload-url/route.ts:47>)). L’envoi direct transporte ensuite les octets vers Supabase. La sauvegarde des métadonnées fait confiance aux références de fichiers soumises, sans vérifier les octets, l’existence ni les propriétés de l’objet distant.

Le bucket `product-images` inspecté est public, avec `file_size_limit = null` et `allowed_mime_types = null`. Les protections de 12 Mo et des formats affichées par l’application ne sont donc pas reproduites par une restriction explicite au niveau du bucket ; les limites générales de la plateforme restent distinctes.

**Impact :** un titulaire d’un droit d’upload peut déclarer une petite image puis envoyer un autre contenu ou un fichier plus gros que la limite métier. Les uploads via le serveur local vérifient aussi principalement nom/type déclarés, sans décodage. Risque de fichiers indésirables, consommation de stockage et métadonnées mensongères. Cela ne démontre pas qu’un visiteur anonyme obtient une signature.

**Correction :** borner le bucket, vérifier/décoder les images, imposer une taille et un nombre de pixels, réencoder les fichiers, contrôler les objets finalisés avant de les associer à un produit. Ajouter un identifiant d’upload émis par le serveur et un nettoyage des uploads abandonnés.

**Acceptation :** contenu non image, MIME falsifié, fichier trop gros, dimensions excessives, objet inexistant et référence non autorisée refusés. Les images de futures demandes privées doivent utiliser une politique distincte des photos publiques du catalogue.

Preuves : `preuves-base.json` ; [src/server/catalog/product-image-storage.ts:177](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/product-image-storage.ts:177>) ; [src/server/catalog/catalog.input.ts:542](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/catalog.input.ts:542>).

## U07 — Stock et disponibilité ne suivent pas une règle commune

**Priorité P1 métier. Reproduit et confirmé dans le code.**

- Un produit `reserved` avec stock positif reçoit « Ajouter au panier » : `getPrimaryAction` n’examine pas ce statut.
- L’option `isReservable` est enregistrée mais ne déclenche pas de parcours de réservation.
- La création/édition refuse `available` avec stock zéro, tandis que la mise à jour rapide du stock accepte zéro sans changer la disponibilité.
- Masquer remplace le statut par `unavailable` ; réafficher le remplace par `available`. Un ancien `reserved` ou `made-to-order` perd ainsi sa signification métier.
- Réafficher un brouillon ne vérifie pas sa complétude commerciale.

**Correction :** séparer visibilité éditoriale, mode de vente, état de réservation et stock ; centraliser les transitions et les actions proposées au client. Appliquer la même décision côté serveur lors du futur checkout.

**Acceptation :** matrice neuf/imparfait/occasion/service × brouillon/disponible/réservé/sur-commande/archivé × stock 0/1/n/null ; un produit réservé ne peut être acheté ; masquer puis réafficher préserve le mode de vente.

Preuves : U07 dans `preuves-reproductions.json` ; [src/server/catalog/catalog.repository.ts:458](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/catalog.repository.ts:458>), `:502` ; [src/app/boutique/[slug]/page.tsx:178](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/boutique/[slug]/page.tsx:178>).

## U06 — Occasion et neuf imparfait sont confondus

**Priorité P1 métier. Reproduit.**

[src/server/catalog/catalog.mapper.ts:156](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/server/catalog/catalog.mapper.ts:156>) transforme chaque valeur SQL `used` en `imperfect`. Le type de l’application ne distingue plus l’occasion. Or `scripts/seed-catalog.mjs` crée encore un kayak `used`, et la fiche imparfaite annonce « Produit neuf imparfait » et un défaut visuel sans impact fonctionnel.

**Impact :** description commerciale potentiellement fausse pour un article d’occasion ; son édition peut aussi réécrire le type comme `imperfect`. Une suppression volontaire de l’occasion n’est pas documentée comme décision validée dans le cadrage examiné.

**Correction :** décider explicitement de conserver l’occasion ou de la retirer ; préserver des types distincts si elle reste au catalogue ; aligner affichage, formulaires, seeds et données migrées.

**Acceptation :** un article d’occasion reste désigné comme tel, avant et après modification ; les mentions « neuf » et « défaut seulement visuel » ne sont pas appliquées automatiquement à l’occasion.

Preuve : U06 dans `preuves-reproductions.json`.

## U11 — La politique de sécurité bloque les ressources graphiques prévues

**Priorité P1 affichage. Conflit déterministe confirmé par l’en-tête HTTP.**

Le CSS importe Google Fonts dès [src/app/globals.css:1](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/globals.css:1>) et charge plusieurs photographies Unsplash, notamment le hero à `:273`. `next.config.ts:16` limite les styles/polices à l’origine locale et les images à l’origine locale ou Supabase. Les domaines Google Fonts, Google Fonts Static et Unsplash ne sont pas autorisés.

**Impact :** polices remplacées par des polices de secours et photographies distantes bloquées dans un navigateur qui applique cette CSP. Aucune capture visuelle n’a été possible pendant l’audit.

**Correction :** héberger localement les polices et visuels approuvés, ou autoriser précisément les origines réellement nécessaires. Ne pas ouvrir globalement la CSP. Vérifier aussi la configuration de développement, car elle utilise les mêmes en-têtes.

**Acceptation :** aucun blocage CSP sur les ressources nécessaires, rendu attendu et aucun assouplissement inutile des scripts.

Preuve : `preuves-http.json`, route `/` ; références externes du CSS.

## U12 — Les parcours essentiels de lancement restent absents

**Priorité P1 lancement. Confirmé.**

Le bouton d’achat est un lien vers `/panier`, sans transfert d’identifiant ni état panier. `/panier` est un texte d’attente. Aucun checkout, webhook Stripe, paiement réel, confirmation de commande, facture ou email métier n’est implémenté. Les champs Stripe dans Prisma et les variables `.env.example` sont des préparatifs.

`/contact`, `/reparation` et `/sur-mesure` n’ont pas de formulaire ni de traitement. Les boutons de devis, diagnostic, question et alerte de stock conduisent donc à des pages sans réception de demande intégrée. `/journal` n’a pas d’articles. Les CGV, mentions légales et confidentialité contiennent uniquement une phrase à compléter.

**Correction immédiate avant ouverture :** présenter fidèlement les fonctions utilisables et une méthode de contact réellement opérationnelle ; compléter les contenus nécessaires au lancement. **Travail de développement :** réaliser les parcours complets détaillés dans le second rapport, avec leurs validations serveur et tests. La vérification des contenus juridiques finaux dépend des informations réelles de l’activité ; cet audit n’établit pas leur conformité.

**Acceptation :** achat invité de bout en bout en environnement de paiement de test ; demande reçue, persistée et notifiée ; contenus finaux relus et coordonnées validées. Une page accessible en HTTP 200 ne suffit pas.

Sources : [src/app/panier/page.tsx:7](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/panier/page.tsx:7>), [src/app/contact/page.tsx:6](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/contact/page.tsx:6>), [src/app/reparation/page.tsx:6](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/reparation/page.tsx:6>), [src/app/sur-mesure/page.tsx:6](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/sur-mesure/page.tsx:6>), [src/app/journal/page.tsx:6](<C:/Users/Nicolas/Documents/Codex/2026-07-13/github-plugin-github-openai-curated-remote-2/src/app/journal/page.tsx:6>), pages légales ; cahier des charges §31.

## U13 — Dépendances vulnérables : réévaluer les anciens overrides

**Priorité P1 maintenance. Présence confirmée ; exploitation par les routes du site non démontrée.**

Le dernier résultat enregistré de `npm audit --json` remonte **10 entrées : 7 élevées, 3 modérées, 0 critique**. Un premier appel en remontait 9 ; le résultat conservé ajoute `ajv` comme dépendance affectée par propagation de `fast-uri`. Il faut compter les entrées de paquets, pas les interpréter comme dix failles indépendantes du site.

| Paquet ou chaîne | Observation |
|---|---|
| `deepmerge-ts` → `@prisma/config` → `prisma` | Épuisement de pile sur graphes récursifs ; dépendance d’outillage Prisma |
| `fast-uri` → `ajv` | Plusieurs problèmes de normalisation d’URL ; `fast-uri` est forcé à 4.1.2 |
| `mysql2` → `prisma` | Avis relatifs au protocole MySQL ; KayArt utilise PostgreSQL, pas ce protocole directement |
| `hono` | Avis concernant certains middlewares et helpers ; pas d’usage Hono direct dans `src` |
| `nanoid` | Générateurs personnalisés : boucle infinie dans un cas particulier ; présent via PostCSS |
| `postcss` → `next` | Avis de lecture de fichiers via source map ; PostCSS est forcé à 8.5.18 |

**Correction :** traiter les versions verrouillées et les chaînes transitoires après analyse de compatibilité ; vérifier quels paquets sont embarqués à l’exécution. Ne pas appliquer mécaniquement `npm audit fix --force` : le résultat propose entre autres un changement majeur de Next et un retour de Prisma à une autre version majeure. Les versions corrigées et la compatibilité doivent être revalidées au moment du changement.

**Acceptation :** audit de la nouvelle résolution, typecheck, build, génération Prisma et tests métier ; aucun avis exploitable ignoré, exceptions justifiées et datées.

Preuves : [audit npm complet](preuves-npm-audit.json), [arbre installé](preuves-dependances.json). Références : [DeepmergeTS](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [PostCSS](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [nanoid](https://github.com/advisories/GHSA-2v37-7h3g-55p8). Les autres avis figurent avec leur URL dans le JSON.

## Ordre d’exécution conseillé

1. Fermer la fuite de lecture admin U02, puis vérifier anonymes, clients, sessions expirées et réponses RSC.
2. Sécuriser l’association des comptes U01 et les redirections U03.
3. Protéger l’historique U08 ; supprimer les pertes silencieuses U04/U05 ; définir les types et transitions U06/U07.
4. Installer les garanties de base U10 et les restrictions d’upload U09.
5. Corriger les ressources bloquées U11, trier les avis de dépendances U13.
6. Livrer et tester les parcours métier U12 avant d’annoncer une boutique complète.

Le rapport ne conclut pas à une base publiquement ouverte : les droits `SELECT`, `INSERT`, `UPDATE`, `DELETE` de `anon` et `authenticated` sont tous refusés sur les 16 tables inspectées. Il reste nécessaire de rendre cette configuration reproductible et de réduire les privilèges de l’utilisateur serveur ; voir le second rapport.
