// ### PARTY ### 


$('#back').click(() => {
    window.location.href = '/';
})

// Soumettre une soirée
$('#party_submit').click(async () => {
  const address = $('#party_address').val();
  const title = $('#party_title').val();
  const description = $('#party_description').val();
  let raid = $('#party_raid').prop('checked');

  if (address === "" || title === "" || description === "") {
    showModal("Veuillez remplir tous les champs pour soumettre");
    return;
  }

  //Vérifie si l'adresse est valable
  const party_coord = await geocode(address);

  const lat = parseFloat(party_coord.lat);
  const lon = parseFloat(party_coord.lon);

  //Coordonnées limite Ottignies Louvain-la-Neuve
  if(lat > 50.67914 || lat < 50.65410 || lon > 4.63333 || lon < 4.59165){
    showModal("Adresse introuvable, veuillez insérer une adresse existante.");
    return;
  }


  $.post("/api/create", { address: address, latitude : lat, longitude:lon, title: title, description: description, raid: raid }, function (data) {
    if (data.success) {
      window.location.href = "/";
    } else {
      showModal(data.message);
    }
  })
})

// Modifier une soirée
$('.party_edit').click(function () {
  const edit_id = $(this).data("edit");

  $.post("/api/edit", { edit_id: edit_id }, function (data) {
    if (data.success) {
      window.location.href = "/party/create";
    } else {
      showModal(data.message);
    }

  })

})

// Supprimer une soirée
$('.party_delete').click(function () {

  if(!confirm("Tu es certain de vouloir supprimer cette soirée ?")){
    return;
  }
  const delete_id = $(this).data("delete");

  


  $.post("/api/delete", { delete_id: delete_id }, function (data) {
    if (data.success) {
      showModal(data.message);
      window.location.href = "/user/profile/me";
    } else {
      showModal(data.message);
    }

  })

})


// ### COMMENT ### 

// Poster un commentaire
$('#comment_post').click(function () {
  const comment = $('#comment_data').val();
  const party_id = $(this).data("party_id");
  

  if (comment === "") {
    showModal("Veuillez remplir le champs pour soumettre");
    return;
  }

  $.post("/api/comment_create", {party_id: party_id, comment: comment }, function (data) {
    if (data.success) {
      window.location.reload();
    } else {
      showModal(data.message);
    }
  })
})

// Supprimer son commentaire
$('.delete-comment').click(function () {

  if(!confirm("Tu es certain de supprimer ce commentaire ?")){
    return;
  }
  
  const comment_delete_id = $(this).data("comment_id");


  $.post("/api/comment_delete", { delcom_id: comment_delete_id }, function (data) {
    if (data.success) {
      window.location.reload();
    } else {
      showModal(data.message);
    }

  })

})


// Rating
$('.rating span').click(function () {

  const rate_s = $(this).data("rate");
  const party_id = $(this).data("party_id");

  const rate = Number(rate_s); 



  $.post("/api/rating", { rate : rate, party_id: party_id }, function (data) {
    if (data.success) {
      window.location.reload();
    } else {
      showModal(data.message);
    }

  })

})

