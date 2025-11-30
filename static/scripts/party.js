// ### PARTY ### 

// Soumettre une soirée
$('#party_submit').click(function () {
  const address = $('#party_address').val();
  const title = $('#party_title').val();
  const description = $('#party_description').val();

  if (address === "" || title === "" || description === "") {
    showModal("Veuillez remplir tous les champs pour soumettre");
    return;
  }


  $.post("/api/create", { address: address, title: title, description: description }, function (data) {
    if (data.success) {
      showModal(data.message);
      window.location.href = "/";
    } else {
      showModal(data.message);
    }
  })
})

// Modifier une soirée
$('.party_edit').click(function () {
  const edit_id = $(this).data("edit");

  console.log("click")

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
  const delete_id = $(this).data("delete");


  $.post("/api/delete", { delete_id: delete_id }, function (data) {
    if (data.success) {
      showModal(data.message);
      window.location.href = "/party/myposts";
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
    alert("Veuillez remplir le champs pour soumettre");
    return;
  }

  $.post("/api/comment_create", {party_id: party_id, comment: comment }, function (data) {
    if (data.success) {
      window.location.reload();
      alert(data.message);
    } else {
      alert(data.message);
    }
  })
})

// Supprimer son commentaire
$('.comment_delete').click(function () {
  const comment_delete_id = $(this).data("comment_delete");


  $.post("/api/comment_delete", { delcom_id: comment_delete_id }, function (data) {
    if (data.success) {
      alert(data.message);
    } else {
      alert(data.message);
    }

  })

})
