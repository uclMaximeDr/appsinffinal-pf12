const video = document.querySelector("#camera");
const takeOverlay = document.querySelector(".takeOverlay");
let camera_stream = null;

async function startCamera() {
    camera_stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = camera_stream;
}

async function requestGPS() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return resolve(null); // GPS non disponible

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (err) => {
                console.warn("GPS non disponible ou refusé :", err);
                resolve(null); // On continue même si GPS refusé
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    });
}

startCamera();

window.addEventListener("beforeunload", () => {
    if (camera_stream) {
        let tracks = camera_stream.getTracks();
        tracks.forEach(track => track.stop());
    }
});

document.querySelector("#takePicture").addEventListener("click", async () => {
    if (!camera_stream) return;

    takeOverlay.classList.add("show");

    gpsCoords = await requestGPS();

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
        }).then(response => {
            if (!response.ok) {
                throw new Error("Erreur lors de l'envoi de la photo");
            }
            return response.json();
        }).then(data => {
            console.log("Photo envoyée avec succès :", data);
        }).catch(err => {
            console.error(err);
        }).finally(() => {
            takeOverlay.classList.remove("show");
        });
    }, "image/png");
});