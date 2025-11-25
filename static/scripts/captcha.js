const nextURL = decodeURIComponent(window.location.href.split('?next=')[1]) || '/';

const imagePartContainer = document.getElementById('imagePartContainer');

let selectedParts = [];

function loadCaptcha() {
    const url = document.getElementById('templateImage').src;
    for(let i = 0; i < 4; i++) {
        for(let j = 0; j < 4; j++) {
            const frame = document.createElement('div');
            frame.classList.add('frame');
            frame.style.gridArea = `${i + 1} / ${j + 1} / ${i + 2} / ${j + 2}`;
            imagePartContainer.appendChild(frame);

            const img = document.createElement('img');
            img.src = url;
            img.style.objectPosition = `-${j * 100}px -${i * 100}px`;
            img.dataset.row = i;
            img.dataset.col = j;
            frame.appendChild(img);

            frame.addEventListener('click', () => {
                frame.classList.toggle('selected');
                const partKey = `${i}-${j}`;
                if(selectedParts.includes(partKey)) {
                    selectedParts = selectedParts.filter(part => part !== partKey);
                } else {
                    selectedParts.push(partKey);
                }
            });
        }
    }
}

document.getElementById('validate').addEventListener('click', async () => {
    $.post('/api/validate-captcha', { parts: JSON.stringify(selectedParts) }, function(data) {
        if(data.success) {
            document.querySelector('.captchaContainer').classList.add('hide');
            document.querySelector('.success').classList.remove('hide');
        } else {
            document.querySelector('.captchaContainer').classList.add('hide');
            document.querySelector('.fail').classList.remove('hide');
        }
    });
});

document.getElementById('retry').addEventListener('click', () => {
    selectedParts = [];
    document.querySelector('.fail').classList.add('hide');
    document.querySelector('.captchaContainer').classList.remove('hide');
    const frames = document.querySelectorAll('.frame');
    frames.forEach(frame => frame.classList.remove('selected'));
});

document.getElementById('next').addEventListener('click', () => {
    window.location.href = nextURL;
});

loadCaptcha();