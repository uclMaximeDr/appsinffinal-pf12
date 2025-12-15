# language: fr
 
    Feature: Consulter une soirée

Chaque utilisateur a la possibilité de consulter les soirées présentes sur le site,
avec ou sans compte.

    Scenario: Consulter une soirée

Given L'utilisateur est sur la page

When L'utilisateur clique sur une des cartes de soirée

Then Le site charge les détails de la soirée