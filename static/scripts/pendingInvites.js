$('#back').click(() => {
    window.location.href = '/user/profile/me';
})

$('#accept').click(() => {

    const id = document.getElementById('accept').dataset.id;

    $.post('/api/user/addFriend', {id: id}, function(data) {

        if(data.success) {

            showModal("Successfully added friend !")

            $('#accept').closest('.inviteElement').remove();
        }
        else {
            
            showModal(data.message)
        }

    })
})

$('#decline').click(() => {

    const id = document.getElementById('accept').dataset.id;

    $.post('/api/user/removeFriend', {id: id}, function(data) {

        if(data.success) {

            showModal("Declined friend request !")

            $('#decline').closest('.inviteElement').remove();
        }
        else {
            
            showModal(data.message)
        }

    })
})

