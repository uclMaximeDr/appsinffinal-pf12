$('#back').click(() => {
    window.location.href = '/';
})

$('#editButton').click(() => {
    window.location.href = "/user/edit"
})

$('#addFriend').click(() => {
    showModal("You don't have any stop pretending")
})

$('#startCollapse').click(() => {

    $('#collapseMenu').toggleClass("collapsed");
    
    $('#startCollapseArrow').toggleClass("rotate")
})

function displayStarRating() {
    // Function to display the average party rating of someone.
    // The amount of stars correspond to the inner html of the <p>
    
    const maxStars = 5;
    let amount = $('#starRating').html();
    let decimal = amount % 1;

    $('#starRating').html('');

    if(isNaN(parseFloat(amount))) {

        amount = 0;
    }
    else {

        amount = Math.floor(parseFloat(amount));

        // Evaluating the decimal
        if (decimal < 0.25) {
            
            decimal = 0;
        }
        else if (0.25 <= decimal && decimal <= 0.75) {
        
            decimal = 1;
        }
        else {
            
            amount += 1;
            decimal = 0;
        }

        amount = Math.max(0, Math.min(amount, maxStars));
    }

    // For loop that displays the full stars
    for (var i = 0; i < amount; i++) {

        const img = document.createElement('img');
        img.src = '/icons/full_star.svg';
        img.classList.add('star');

        $('#starRating').append(img);
    }

    // Adds a half star if 'decimal == 1' and if it won't exceed the max amount
    if (decimal == 1 && amount < maxStars)
    {
        const img = document.createElement('img');
        img.src = '/icons/half_star.svg';
        img.classList.add('star');

        $('#starRating').append(img);
        amount++;
    }

    // For loop that displays the empty stars
    for (var i = 0; i < maxStars - amount; i++) {

        const img = document.createElement('img');
        img.src = '/icons/empty_star.svg';
        img.classList.add('star');

        $('#starRating').append(img);
    }
}

displayStarRating();

$('#disconnect').click(() => {

    $.post('/api/disconnect', function(data) {
        if (data.success) {
            window.location.href = "/"
        }
        else {
            showModal(data.message);
        }
    })

})