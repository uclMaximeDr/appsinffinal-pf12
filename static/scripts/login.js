//const router = require("../../routes/api");

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
    
    if (action == "login") {

        console.log("Trying to login")

        const email = $('#email').val();
        const password = $('#password').val();

        if(email === "" || password === "") {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        console.log(email + " " + password)

        $.post('/api/login', { email: email, password: password }, function(data) {
            if(data.success) {
                window.location.href = "/";
            } else {
                alert(data.message);
            }
        })

    }
    else {
        
        console.log("Trying to register")

        const fullname = $('#full-name').val();
        const email = $('#email').val();
        const password = $('#password').val();

        if(fullname === "" || email === "" || password === "") {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        console.log(fullname + " " + email + " " + password)

        $.post('/api/register', { fullname: fullname, email: email, password: password}, function(data) {
            if(data.success) {
                $('input').val('');
                alert("user succesfully created!");
            }
            else
            {
                alert(data.message);
            }
        })

    }
})