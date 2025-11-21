let video = document.querySelector("#camera");
let camera_stream = null;

async function startCamera() {
    camera_stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = camera_stream;
}

startCamera();

window.addEventListener("beforeunload", () => {
    if (camera_stream) {
        let tracks = camera_stream.getTracks();
        tracks.forEach(track => track.stop());
    }
});

document.querySelector("#takePicture").addEventListener("click", () => {
    if (!camera_stream) return;

    video.classList.add("take");

    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    let context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    let imageDataUrl = canvas.toDataURL("image/png");
    
    $.post("/api/uploadPhoto", { image: imageDataUrl });

    video.classList.remove("take");
});