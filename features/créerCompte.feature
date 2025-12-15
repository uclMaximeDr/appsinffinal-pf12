# language: fr

    Feature: Création de compte

Les utilisateurs doivent créer un compte avant d'ajouter une soirée, afin d'éviter
les formulaires abusifs et les spams. Un utilisateur non connecté a toujours
la possibilité de consulter les soirées.

    Scenario: Création de compte valide

Given L'utilisateur entre ses données

And L'adresse email est valide

And Le nom est valide

And Le mot de passe est valide

When L'utilisateur valide son formulaire de création de compte

Then Le site crée un compte à l'utilisateur et l'ajoute à sa base de donnée

    Scenario: Création de compte a échoué

Given L'utilisateur entre ses données

And Une des données comme l'adresse, le nom ou le mot de passe ne sont pas valides ou pas spécifiées

When L'utilisateur valide son formulaire de création de compte

Then Le site renvoie une erreur disant que les identifiants ne sont pas valides