# language: fr

    Feature: Ajouter soirée

Les utilisateurs peuvent ajouter des soirées à tout moment,
et le site se réactualisera en temps réel.

    Scenario: Soirée crée avec succès

Given L'utilisateur a un compte

And Le formulaire d'ajout est valide

When L'utilisateur soumet son formulaire

Then Le site publie la soirée et la rend disponible aux autres utilisateurs

    Scenario: Soirée refusé

Given L'utilisateur n'a pas de compte

And L'utilisateur essaye d'ajouter une soirée

When L'utilisateur soumet son formulaire

Then Le site renvoie une alerte lui demandant de créer un compte en le redirigeant vers la page de création
