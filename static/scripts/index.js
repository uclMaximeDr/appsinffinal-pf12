// create marker
async function createCustomMarker(lat, lng, imageUrl) {
  const imageBase64 = await fetch(imageUrl)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        })
    );

  const svgTemplate = `
        <svg width="650" height="883" viewBox="0 0 650 883" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <path d="M650 325C650 504.493 325 883 325 883C325 883 0 504.493 0 325C0 145.507 145.507 0 325 0C504.493 0 650 145.507 650 325Z" fill="red"/>
          <rect x="75" y="75" width="500" height="500" rx="250" fill="url(#pattern0_16_2)"/>
          <defs>
            <pattern id="pattern0_16_2" patternContentUnits="objectBoundingBox" width="1" height="1">
              <use xlink:href="#image" transform="translate(-0.0289474) scale(0.00526316)"/>
            </pattern>
            <image id="image" preserveAspectRatio="none" xlink:href="${imageBase64}"/>
          </defs>
        </svg>`;

  const svgUrl =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(svgTemplate)));

  const icon = L.divIcon({
    className: "custom-marker",
    html: `<img src="${svgUrl}" style="width:64px;height:64px;">`,
    iconSize: [64, 64],
    iconAnchor: [32, 64],
    popupAnchor: [0, -64],
  });

  return L.marker([lat, lng], { icon });
}

// initialize map without controls or attribution (background only)
const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
}).setView([50.6689126, 4.6150577], 15);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

markers.forEach(async (m) => {
  (await createCustomMarker(m.lat, m.lng, m.img)).addTo(map);
});

$("#searchSelector p").click((event) => {
  var target = event.target;
  var container = target.parentElement;
  var selector = container.parentElement.querySelector(".selector");
  if (target == container.querySelector("p:first-child")) {
    selector.classList.remove("right");
    selector.classList.add("left");
  } else {
    selector.classList.remove("left");
    selector.classList.add("right");
  }
});
