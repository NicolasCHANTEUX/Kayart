# Renouvellement des sessions

Le middleware renouvelle les sessions avant le traitement des pages, actions et routes applicatives quand le cookie d’accès manque ou que son expiration approche à moins d’une minute. Cela couvre notamment l’enregistrement d’un formulaire resté ouvert longtemps. Aucun minuteur ne maintient artificiellement une session inactive ; le renouvellement intervient à la prochaine requête.

Le renouvellement utilise le cookie HttpOnly `kayart_refresh_token` et le point d’accès Supabase `token?grant_type=refresh_token`. Il utilise les variables Supabase déjà configurées, sans nouvelle clé. Les deux cookies tournent ensemble ; ils sont transmis aux composants serveur de la même requête et au navigateur. Ils restent HttpOnly, SameSite=Lax, Secure en production et limités au chemin `/`. Les réponses portant une session sont marquées privées et non stockables en cache.

La lecture locale de l’expiration du JWT sert uniquement à décider quand renouveler. Elle n’authentifie personne et ne confère aucun rôle. Les services protégés continuent de vérifier l’identité auprès de Supabase `/user`, puis le rôle lié à cet identifiant dans la base. Aucun rôle présent dans le JWT reçu n’est utilisé pour octroyer les droits administrateur.

L’appel de renouvellement refuse les redirections et expire après cinq secondes ; la vérification `/user` est également bornée à cinq secondes. Les refus explicites reconnus de jeton révoqué ou de session supprimée effacent les cookies. Une panne, un dépassement de quota ou une réponse incohérente conserve les cookies pour permettre une nouvelle tentative ; l’accès protégé reste refusé en l’absence d’une identité vérifiée. Les avertissements ne contiennent ni jeton ni donnée client.

Les pages légales non approuvées restent rejetées en 404 avant rendu et avant renouvellement. Les fichiers statiques, images et métadonnées de référencement sont exclus du middleware. Aucune migration ou modification de paramètre Supabase n’est requise par ce lot.

## Vérification

- Six tests de régression couvrent les expirations, cookies, transmission à la requête courante, refus définitifs, pannes et maintien du blocage légal.
- Cinq tests HTTP sur le build de production utilisent un double Auth lié à `127.0.0.1:3108`. Ils vérifient la connexion visible dès la réponse renouvelée, l’absence de jetons dans le HTML, le refus de l’administration pour un client malgré une revendication JWT `admin`, l’effacement après révocation, la conservation après panne et la déconnexion après rotation.
- Aucun compte réel, email ou paiement n’a été utilisé. La recette avec un vrai compte Supabase et plusieurs onglets reste à effectuer dans un navigateur connecté avant validation de production.

Pour reproduire la recette HTTP : préparer la copie avec `node tests/prepare-production-check.mjs`, compiler puis démarrer cette copie sur le port 3107 avec `KAYART_DATA_SOURCE=mock`, `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3108` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=fixture-only`. Depuis la racine, lancer `node tests/session-refresh-http.mjs`. Ce script démarre et ferme lui-même le double Auth local. Ces paramètres de test ne doivent pas être utilisés sur un déploiement réel.

Références : [sessions Supabase](https://supabase.com/docs/guides/auth/sessions), [transmission des cookies en SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [codes d’erreur Auth](https://supabase.com/docs/guides/auth/debugging/error-codes).
