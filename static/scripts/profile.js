$('#back').click(() => {
    window.history.back()
})

$('#editButton').click(() => {
    window.location.href = "/";
})

$('#disconnect').click(() => {

    $.post('/api/disconnect', function(data) {
        if (data.success) {
            window.location.href = "/"
        }
        else {
            alert(data.message);
        }
    })

})