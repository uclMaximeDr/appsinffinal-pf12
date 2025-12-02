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

    fetch('/api/user/edit', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            showModal('Profil mis à jour avec succès !');
            window.location.href = '/user/profile';
        } else {
            showModal('Erreur lors de la mise à jour du profil.');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showModal('Erreur lors de la mise à jour du profil.');
    });
});