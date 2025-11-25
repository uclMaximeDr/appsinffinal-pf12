let action = "login";

$('#back').click(() => {
    window.location.href = '/';
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
        $('#confirm-password-container').hide();
    } else {
        selector.classList.remove('left')
        selector.classList.add('right')

        action = "register";

        $('#full-name-container').show();
        $('#confirm-password-container').show();
    }
    $('#submit').text(target.innerText);
})


let slashed = true;

$('#passwordEye').click(() => {
    
    if (!slashed)
    {
        $('#passwordEye').attr('src', '/icons/eye-slash-fill.svg');
        $('#password').attr('type', 'text');
        slashed = true;
    }
    else {
        $('#passwordEye').attr('src', '/icons/eye-fill.svg');
        $('#password').attr('type', 'password');
        slashed = false;
    }

})

$('#submit').click(() => {
    
    if (action == "login") {

        const email = $('#email').val();
        const password = $('#password').val();

        if(email === "" || password === "") {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        $.post('/api/login', { email: email, password: password }, function(data) {
            if(data.success) {
                const nextURL = "/user/profile";
                window.location.href = "/captcha?next=" + encodeURIComponent(nextURL);
            } else {
                alert(data.message);
            }
        })

    }
    else {
        
        const fullname = $('#full-name').val().trim();
        const email = $('#email').val().trim();
        const password = $('#password').val().trim();
        const confirmPassword = $('#confirmPassword').val().trim();

        if(fullname === "" || email === "" || password === "" || confirmPassword === "") {
            alert("Veuillez remplir tous les champs.");
            return;
        }
        else {
            if (password != confirmPassword) {
                alert("La confirmation de mot de passe a échoué !");
                return;
            }
        }

        $.post('/api/register', { fullname: fullname, email: email, password: password}, function(data) {
            if(data.success) {
                const nextURL = "/user/profile";
                window.location.href = "/captcha?next=" + encodeURIComponent(nextURL);
            }
            else
            {
                alert(data.message);
            }
        })

    }
})