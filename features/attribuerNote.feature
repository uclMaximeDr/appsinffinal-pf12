# language: fr

    Feature: Donner une note à une soirée

Les utilisateurs peuvent attribuer une note de un à cinq à la soirée d'un autre utilisateur

    Scenario: Un utilisateur donne une note

Given L'utilisateur a un compte

And attribue une note quelconque

When L'utilisateur clique sur une des étoiles 

Then la note est attribuée et son vote se rajoute au total d'utilisateur ayant voté pour cette même note

    Scenario: Un utilisateur est refusé de donner une note

Given Un utilisateur n'a pas de compte

And L'utilisateur essaye de donner une note quelconque

When L'utilisateur clique sur une des étoiles

Then Le site renvoie une alerte lui demandant de créer un compte.
