//work in progress

$('#party_submit').click(function(){
    const address = $('#party_address').val();
    const title = $('#party_title').val();
    const description = $('#party_description').val();

    if(address === "" || title === "" || description === ""){
        alert("Veuillez remplir tous les champs pour soumettre");
        return;
    }

 $.post("/api/create", {address: address, title: title, description: description}, function(data) {
    if(data.success) {
        alert(data.message);
        window.location.href = "/";
    } else {
        alert(data.message);
    }
 })
})


$('#party_edit').click(function(){
    const edit_id = $(this).data("edit");

 $.post("/api/edit", {edit_id: edit_id}, function(data) {
    if(data.success) {
      window.location.href = "/party/myposts";
    } else {
      alert(data.message);
    }

 })

})


$('#party_delete').click(function(){
    const delete_id = $(this).data("delete");
    

 $.post("/api/delete", {delete_id : delete_id}, function(data) {
    if(data.success) {
      alert(data.message);
      window.location.href = "/party/myposts";
    } else {
        alert(data.message);
    }
    
 })

})

