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


$('#party-delete').click(function(){
    const party_id = $(this).data("delete");
    

 $.post("/api/delete", {party_id : party_id}, function(data) {
    if(data.success) {
      alert(data.message);
      window.location.href = "/party/myposts";
    } else {
        alert(data.message);
    }
    
 })

})

