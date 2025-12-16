// ### PARTY ### 

$('#back').click(() => {
    window.location.href = '/';
})

// Get GPS position - W3school tuto
const addressInput = $('#party_address');
let party_coord = null;
function getLocation(){
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setPosition);
  } else { 
    addressInput.val("Géolocalisation ne fonctionne pas.");
  }
}

// Set lat and lon coordinates
function setPosition(position) {
  party_coord = {lat : position.coords.latitude,lon: position.coords.longitude }
  addressInput.val(position.coords.latitude + ", " + position.coords.longitude);
}


// Get location button
$('#location').click(async () => {
  party_coord = await getLocation();
});



// Submit party
$('#party_submit').click(async () => {
  const address = $('#party_address').val();
  const title = $('#party_title').val();
  const description = $('#party_description').val();
  let raid = $('#party_raid').prop('checked');
  let friendOnly = $('#party_friendOnly').prop('checked');
  let lat;
  let lon;
  
  if ((address === "" && !party_coord) || title === "" || description === "") {
    showModal("Veuillez remplir tous les champs pour soumettre");
    return;
  }

  // Check if the address is valid
  if (!party_coord){
    party_coord = await geocode(address);
    if (!party_coord) {
      showModal("Adresse introuvable, veuillez insérer une adresse existante.");
      return;
    }

    // Convert string to float
    lat = parseFloat(party_coord.lat);
    lon = parseFloat(party_coord.lon);
  }
  else{

    lat = party_coord.lat;
    lon = party_coord.lon;
  }

  party_coord = null;
  // Geographical Restriction Ottignies Louvain-la-Neuve
  if(lat > 50.67914 || lat < 50.65410 || lon > 4.63333 || lon < 4.59165){
    showModal("Adresse en dehors de Louvain-La-Neuve, veuillez insérer une adresse valide.");
    return;
  }

// Send request create party
  $.post("/api/create", {address: address, latitude : lat, longitude:lon, title: title, description: description, raid, friendOnly}, function (data) {
    if (data.success) {
      window.location.href = "/";
    } else {
      showModal(data.message);
    }
  })
})

// Send request edit party
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

// Send request delete party
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

// ### SHARE ###

// Send request share party
$('#share').click(function() {
  const shareData = {
    title: "Partage de soirée - FindMyParty",
    url: window.location.href,
  };

  if (navigator.share) {
    navigator
      .share(shareData)
      .then(() => console.log("Soirée partagée avec succès"))
      .catch((error) =>
        console.log("Erreur lors du partage de la soirée:", error)
      );
  } else {
    navigator.clipboard.writeText(window.location.href)
    showModal("Lien copié avec succès !")
  }
});

// ### COMMENT ### 

// Send request post comment
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

// Send request delete comment
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


// Send request rating
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

// Download pictures
$('#downloadPicture').click(function () {
  const party_id = $(this).data("party_id");
  window.location.href = "/api/downloadPartyPictures?party_id=" + party_id;
});