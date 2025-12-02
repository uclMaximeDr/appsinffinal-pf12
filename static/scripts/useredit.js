$('#back').click(() => {
    window.location.href = '/user/profile/me';
})

$('.profilePictureContainer .hover').click(function() {
    $('#profilePictureInput').click();
});

$('#profilePictureInput').change(function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            $('.profilePictureContainer img').attr('src', e.target.result);
        }
        reader.readAsDataURL(file);
    }
});

$('#submit').click(function() {
    const username = $('#username').val();
    const email = $('#email').val();
    const password = $('#password').val();

    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);

    const fileInput = document.getElementById('profilePictureInput');
    if (fileInput.files[0]) {
        formData.append('photo', fileInput.files[0]);
    }

    $.ajax(
    {
        url : '/api/user/edit',
        type: 'POST',
        data: formData,
        processData: false, //empêche JQuery de transformer les données
        contentType: false, // Permet l'envoi de fichiers
        
        success: function() {
            window.location.href = '/user/profile/me'
        },

        error: function() {
            alert("Erreur lors de la modification du compte.")
        }
    })
});