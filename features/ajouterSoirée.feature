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

When L'utilisateur essaye d'acceder à la page d'ajout de soirée

Then Le site le redirige vers la page de connexion.

    Scenario: Soirée hors Louvain La Neuve

Given L'utilisateur a un compte

And Le formulaire d'ajout est valide

When L'utilisateur soumet son formulaire

Then Le site renvoie une alerte disant que la soirée doit se situer à Louvain La Neuve.