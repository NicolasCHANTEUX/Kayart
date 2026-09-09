# Compte PostgreSQL de l’application

Le script `scripts/provision-runtime.mjs` prépare `kayart_app`, un compte serveur sans `BYPASSRLS`, création de base/rôle, réplication, lecture de `auth.users`, modification des rôles clients ou suppression de commandes. Les droits et politiques par table sont centralisés dans `database/runtime-role.sql`.

**Non activé :** le `DIRECT_URL` disponible ne possède pas `CREATEROLE`. Il ne peut donc pas créer ce compte. Les RLS publiques sont actives, mais la connexion applicative existante conserve ses droits larges ; ces deux sujets ne doivent pas être confondus.

Un administrateur Supabase doit renseigner dans l’environnement local, hors conversation, une connexion `DIRECT_URL` autorisée à créer les rôles et attribuer les droits aux tables. Il peut aussi réaliser l’opération via son outil de gestion, mais le script refuse de réutiliser un rôle préexistant sans son fichier local de credentials : ne pas créer un rôle sans organiser cette reprise.

Après configuration de l’accès de gestion :

```powershell
node scripts/provision-runtime.mjs --check
node scripts/provision-runtime.mjs --apply
```

Le script génère un mot de passe, le conserve dans `.env.runtime.local` ignoré par Git, applique les droits, vérifie une vraie connexion sous ce rôle et ne remplace `DATABASE_URL` dans `.env.local` qu’après ces vérifications. Il ne publie jamais le mot de passe. `DIRECT_URL` reste séparé pour les migrations.

Copier ensuite la valeur de connexion directement dans le champ `DATABASE_URL` de l’hébergement, puis redéployer et vérifier connexion admin, lectures catalogue, demandes et checkout test. Ne pas transmettre le secret dans une issue, un rapport, un commit ou un chat. Les nouvelles migrations ajoutant des tables nécessitent aussi une revue des droits de ce rôle.
