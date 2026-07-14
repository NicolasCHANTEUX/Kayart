# Installation npm - KayArt

Date : 14 juillet 2026

## Diagnostic

Dans l'environnement Codex actuel, l'installation des dependances echoue avec :

```text
EACCES request to https://registry.npmjs.org/@types%2fnode failed
```

Cela indique que l'acces reseau au registre npm est bloque ou refuse depuis l'environnement d'execution Codex. Le projet lui-meme est pret, mais les paquets Next.js/React/TypeScript ne peuvent pas etre telecharges ici pour le moment.

## Commandes a lancer sur la machine

Ouvrir un terminal dans le dossier du projet :

```bat
cd "C:\Users\Nicolas\Documents\Codex\2026-07-13\github-plugin-github-openai-curated-remote-2"
```

Installer les dependances :

```bat
npm.cmd install
```

Lancer le serveur local :

```bat
npm.cmd run dev
```

Le site devrait ensuite etre disponible sur :

```text
http://localhost:3000
```

## Workflow propre

Quand le serveur de developpement tourne, eviter de lancer `npm.cmd run build` dans un autre terminal.

Pour verifier le projet proprement :

1. arreter `npm.cmd run dev` avec `Ctrl+C` ;
2. nettoyer le dossier `.next` ;
3. lancer les controles.

```bat
npm.cmd run clean
npm.cmd run verify
```

Ensuite, relancer le serveur :

```bat
npm.cmd run dev
```

## Si PowerShell bloque npm

Utiliser `npm.cmd` au lieu de `npm`.

PowerShell peut bloquer `npm.ps1` avec une erreur de politique d'execution. `npm.cmd` contourne ce probleme sans modifier la configuration Windows.

## Si l'installation echoue encore

Verifier l'acces au registre :

```bat
npm.cmd ping
```

Puis verifier la configuration :

```bat
npm.cmd config get registry
```

La valeur attendue est :

```text
https://registry.npmjs.org/
```

## Pour que Codex puisse valider ensuite

Une fois `npm.cmd install` termine, relancer Codex ou demander de continuer. Avec `node_modules` et `package-lock.json` presents dans le dossier projet, Codex pourra lancer :

```bat
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

## Audit de securite

Ne pas lancer `npm audit fix --force` sans lecture du detail. Cette commande peut appliquer des changements cassants.

Commande conseillee :

```bat
npm.cmd audit
```

Si des vulnerabilites restent affichees, copier le resultat dans Codex pour qu'on decide la correction proprement.
