function showModal(message) {
    // Function to display a modal with a custom message
    $('#modalMessage').text(message);
    $('.modalContainer').show();
}

$('#modalClose').click(() => {
    $('.modalContainer').hide();
    $('#modalMessage').text("");
})