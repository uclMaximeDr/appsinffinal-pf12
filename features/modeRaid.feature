# language: fr

    Feature: Participer au raid

Les utilisateurs peuvent choisir de participer à l'activité raid,
dont le tirage au sort est fait chaque jours à 19h.

    Scenario: L'utilisateur coche "Mode raid" lors de la création de sa soirée

Given L'utilisateur a un compte

When L'utilisateur soumet sa soirée

Then "Mode raid activé" s'affiche dans la fiche de la soirée présente a côté de la carte ,
et il sera pris lors du tirage au sort.

    Scenario: L'utilisateur ne coche "Mode raid" lors de la création de sa soirée

Given L'utilisateur a un compte

When L'utilisateur soumet sa soirée

Then "Mode raid activé" ne s'affiche pas dans la fiche de la soirée présente a côté de la carte,
et il ne sera pas pris lors du tirage au sort.
