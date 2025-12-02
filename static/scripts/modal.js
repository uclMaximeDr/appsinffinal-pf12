function showModal(message) {
    $('#modalMessage').text(message);
    $('.modalContainer').show();
}

$('#modalClose').click(() => {
    $('.modalContainer').hide();
    $('#modalMessage').text("");
})