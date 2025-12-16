# LINFO1212 Groupe PF_12 - "FindMyParty"

Ce projet consiste à développer nos compétences dans la construction d’une application informatique de type web.

Notre site web permet aux étudiants de Louvain-la-Neuve de créer, modifier, supprimer et partager leurs meilleures soirées à la population ou à leurs amis chers.

## Prérequis

L'installation des dépendances :

```sh
npm install
```

Le lancement de la base de données :
```sh
(linux)
sudo systemctl start mongod

(mac)
brew services start mongodb-community
```

L'importation ou la création des données initiales.
```sh
mongorestore --db findaparty ./db
```

Variable d'environnement à définir selon les besoins.

Pour les utiliser, créer un fichier .env à la racine du projet et copier-coller les lignes voulues.

```sh
// Obligatoire
DB_NAME=findaparty

// Optionnels
PORT=3000
SESSION_SECRET=a-production-secret
MONGO_URL=mongodb://localhost:27017
NO_HTTPS=0
```

## Lancer le site web

Le lancement du serveur web :

```sh
npm start
```

L'URL d'accès locale : https://localhost:3000

## Lancer les tests unitaires

```sh
npm test
```

Avec le coverage :
```sh
npm test -- --coverage
```