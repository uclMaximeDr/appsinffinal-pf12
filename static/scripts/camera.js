const video = document.querySelector("#camera");
const takeOverlay = document.querySelector(".takeOverlay");
let camera_stream = null;
let has_gps = false;

function showError(c) {
    video.style.display = "none";
    $('.controls').hide();
    $("." + c).show();
}

async function requestAccess() {
    // Request camera access
    camera_stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch((err) => {
        console.warn("Caméra non disponible :", err);
        showError("nocamera");
    });

    has_gps = navigator.geolocation ? true : false;
    if(has_gps) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("GPS disponible :", position.coords.latitude, position.coords.longitude);
            },
            (err) => {
                console.warn("GPS non disponible ou refusé :", err);
                has_gps = false;
                showError("nogps");
            },
            { enableHighAccuracy: true }
        );
    } else {
        console.log("GPS non disponible");
    }

    return new Promise((resolve) => {
        resolve(camera_stream !== null && has_gps);
    });
}

async function startCamera() {
    if (!camera_stream) return;
    
    video.srcObject = camera_stream;
}

async function getGPS() {
    if (!has_gps) return null;

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (err) => {
                console.warn("GPS non disponible ou refusé :", err);
                resolve(null);
            },
            { enableHighAccuracy: true }
        );
    });
}

requestAccess().then((granted) => {
    console.log("Accès caméra et GPS :", granted);
    if (!granted) {
        if(camera_stream === null) showError("nocamera");
        if(!has_gps) showError("nogps");
        return;
    }
    startCamera();
});

window.addEventListener("beforeunload", () => {
    if (camera_stream) {
        let tracks = camera_stream.getTracks();
        tracks.forEach(track => track.stop());
    }
});

document.querySelector("#takePicture").addEventListener("click", async () => {
    if (!camera_stream) return;

    takeOverlay.classList.add("show");

    gpsCoords = await getGPS();

    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    let context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
        let formData = new FormData();
        formData.append("photo", blob, "photo.png");

        if (gpsCoords) {
            formData.append("lat", gpsCoords.lat);
            formData.append("lng", gpsCoords.lng);
        }

        await fetch("/api/uploadPhoto", {
            method: "POST",
            body: formData
        }).then(async (response) => {
            if (!response.ok) {
                const error = await response.json();
                showModal("Erreur : " + error.error);
            }
        }).finally(() => {
            takeOverlay.classList.remove("show");
        });
    }, "image/png");
});