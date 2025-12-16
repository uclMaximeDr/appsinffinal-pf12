# language: fr

    Feature: Ajouter un commentaire

Les utilisateurs peuvent ajouter des commentaires aux soirées à tout moment.

    Scenario: Commentaire crée avec succès

Given L'utilisateur a un compte

And Le commentaire est valide

When L'utilisateur soumet son commentaire

Then Le site publie le commentaire en dessous de la soirée et le rend disponible aux autres utilisateurs

    Scenario: Commentaire refusé

Given L'utilisateur n'a pas de compte

And L'utilisateur essaye d'ajouter un commentaire

When L'utilisateur soumet son commentaire

Then Le site renvoie une alerte lui demandant de créer un compte.

    Scenario: Commentaire vide

Given L'utilisateur a un compte

And Le commentaire est vide

When L'utilisateur soumet son commentaire

Then Le site renvoie une alerte lui demandant d'écrire un commentaire avant de le soumettre.