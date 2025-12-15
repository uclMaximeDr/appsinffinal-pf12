# language: fr

    Feature: Afficher la soirée que aux amis

Les utilisateurs peuvent choisir de ne montrer leurs soirées qu'à leurs amis.

    Scenario: L'utilisateur coche "Amis seulement" lors de la création de sa soirée.

Given L'utilisateur a un compte

When L'utilisateur soumet sa soirée

Then la soirée s'affichera dans la liste et sur la carte,
que si l'utilisateur est ami avec l'utilisateur ayant créé la soirée avec le mode.

    Scenario:  L'utilisateur ne coche pas "Amis seulement" lors de la création de sa soirée.

Given L'utilisateur a un compte

When L'utilisateur soumet sa soirée

Then la soirée ne s'affichera pas dans la liste et sur la carte, 
de l'utilisateur n'étant pas ami avec la personne ayant posté avec ce mode.