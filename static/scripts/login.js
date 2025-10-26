let action = "login";

$('#back').click(() => {
    window.history.back()
})

$('#actionSelector p').click((event) => {
    var target = event.target;
    var container = target.parentElement;
    var selector = container.parentElement.querySelector('.selector');
    if(target == container.querySelector("p:first-child")) {
        selector.classList.remove('right')
        selector.classList.add('left')

        action = "login";

        $('#full-name-container').hide();
    } else {
        selector.classList.remove('left')
        selector.classList.add('right')

        action = "register";

        $('#full-name-container').show();
    }
    $('#submit').text(target.innerText);
})

$('#submit').click(() => {
    // Temporary redirect to profile without check
    window.location.href = "/user/profile";
})