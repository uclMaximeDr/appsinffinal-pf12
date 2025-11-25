$('#back').click(() => {
    window.history.back()
})

$('#editButton').click(() => {
    alert("Changing name functionality in progress ^^")
})

$('#addFriend').click(() => {
    alert("You don't have any stop pretending")
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