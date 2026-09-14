# Panier et commande — 14 septembre 2026

Le parcours distingue `/panier` (articles, quantités, estimation de réception) et `/commande` (coordonnées, réception, récapitulatif et redirection Stripe test). Quand le test n’est pas configuré, les commandes sont indiquées comme non ouvertes ; aucun formulaire de coordonnées n’est présenté.

## Panier

Chaque article affiche son propre visuel, son état, sa référence, le lien vers sa fiche, le prix unitaire et le total de ligne. Les quantités se règlent avec les boutons ou le champ numérique. Une quantité supérieure au stock peut être ramenée directement au maximum disponible.

`quoteCart` renvoie une ligne avec un problème identifié lorsqu’une pièce est indisponible, nécessite un devis ou manque de stock. Les autres lignes restent affichées. Un produit absent du catalogue public reste anonyme : aucun accès aux produits privés n’est ajouté pour retrouver son ancien nom. Le sous-total partiel est explicitement présenté comme celui des articles disponibles ; le total complet et le passage en commande sont bloqués tant qu’un problème subsiste.

Le navigateur conserve seulement les identifiants et quantités des articles dans `localStorage`. Le choix de réception, le pays et le code postal sont conservés dans `sessionStorage` pour le passage à la commande. Le nom, l’email et l’adresse ne sont pas enregistrés dans le stockage navigateur. Les prix et tarifs sont recalculés côté serveur ; une réponse périmée ne permet pas de poursuivre. Une panne conserve les informations de présentation connues et propose une actualisation.

## Commande de test

Le formulaire est disponible uniquement lorsque la configuration de test le permet. La saisie des coordonnées reste en mémoire pendant un recalcul de livraison. La soumission vérifie aussi que le panier local n’a pas changé dans un autre onglet.

Une erreur ambiguë conserve la tentative et bloque les modifications. Sur la page courante, une reprise renvoie le même contenu et la même clé. Après rechargement, les coordonnées ne sont pas conservées : la tentative doit être annulée ou vérifiée avant de recommencer. L’annulation d’une tentative déjà payée ouvre la confirmation correspondante au lieu d’autoriser un nouvel achat du même panier. La confirmation existante reste seule responsable du nettoyage des articles payés, après validation serveur.

## Vérification

- `npm test` : erreurs par ligne, prix serveur, données privées, livraison, reprise et protections de stock existantes.
- `npm run test:production` : compilation isolée et contrôles HTTP, dont `/commande` et le panier contenant un produit privé.
- `node tests/run-cart-browser.mjs` après la recette de production : navigateur Chromium isolé, contrôles publics existants et parcours panier/commande. Sur Windows, Edge est utilisé par défaut ; `KAYART_BROWSER_PATH` permet de choisir un autre exécutable Chromium.
- Captures et résultats locaux dans `outputs/latest-verification/` (ignorés par Git).

La recette navigateur utilise le catalogue de démonstration et des doubles réseau pour rendre le checkout de test accessible, simuler une livraison et provoquer une reprise. Elle ne valide pas le service Stripe réel. Le mode live, les CGV commerciales et les notifications métier restent des chantiers distincts.

Résultats locaux du 14 septembre : ESLint et TypeScript valides, 82 tests automatisés réussis, build de production réussi, 38 contrôles HTTP et 6 contrôles de session réussis. La recette Edge comprend 69 contrôles publics et 16 contrôles panier/commande ; ces derniers couvrent notamment les largeurs 320, 390, 768 et 1440 px. Les captures utilisent exclusivement les données de test.
