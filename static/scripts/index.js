// Fonction utilitaire : géocoder via Nominatim (OpenStreetMap)
async function geocode(q) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(q) + "+1348+Ottignies-Louvain-la-Neuve";
  try {
    const resp = await fetch(url, { headers: { "Accept-Language": "fr" } });
    if (!resp.ok) throw new Error("Erreur réseau: " + resp.status);
    const data = await resp.json();
    if (!data || data.length === 0) return null;
    return data[0];
  } catch (err) {
    console.error("Échec géocodage:", err);
    return null;
  }
}


// create marker
async function createCustomMarker(lat, lng, imageId) {
  const imageBase64 = await fetch("/uploadedImages/" + imageId + "/64")
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
        <svg width="80" height="109" viewBox="0 0 80 109" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <path d="M80 40.1189C80 62.276 40 109 40 109C40 109 0 62.276 0 40.1189C0 17.9618 17.9086 0 40 0C62.0914 0 80 17.9618 80 40.1189Z" fill="#FF0000"/>
          <path d="M72 40C72 22.3269 57.6731 8 40 8C22.3269 8 8 22.3269 8 40C8 57.6731 22.3269 72 40 72C57.6731 72 72 57.6731 72 40Z" fill="url(#pattern0_16_2)"/>
          <defs>
            <pattern id="pattern0_16_2" patternContentUnits="objectBoundingBox" width="1" height="1">
              <use xlink:href="#image0_16_2" transform="scale(0.015625)"/>
            </pattern>
            <image id="image0_16_2" width="64" height="64" preserveAspectRatio="none" xlink:href="${imageBase64}"/>
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

// Create markers for all parties and friend-only parties
const allMarkers = [];
const friendOnlyMarkers = [];
async function createMarkers(parties) {
  for(const party of parties) {
    const marker = await createCustomMarker(party.lat, party.lng, party.img);
    marker.bindPopup(`<a href="/party/${party.id}">Voir la soirée</a>`);
    allMarkers.push(marker);
    if(party.friend) {
      friendOnlyMarkers.push(marker);
    }
  }
}

// initialize map without controls or attribution (background only)
const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
}).setView([50.6689126, 4.6150577], 15);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Add all markers to map
let currentGroup = null;
function showMarkers(markers) {
  if (currentGroup) {
    map.removeLayer(currentGroup);
  }
  
  currentGroup = L.layerGroup(markers);
  currentGroup.addTo(map);
}

// Show all markers by default
(async () => {
  await createMarkers(parties);
  showMarkers(allMarkers);
})();

$("#searchSelector p").click((event) => {
  var target = event.target;
  var container = target.parentElement;
  var selector = container.parentElement.querySelector(".selector");
  if (target == container.querySelector("p:first-child")) {
    selector.classList.remove("right");
    selector.classList.add("left");

    $('.cardParty').show();

    showMarkers(allMarkers);
  } else {
    selector.classList.remove("left");
    selector.classList.add("right");

    $('.cardParty').each((index, element) => {
      if(element.getAttribute('data-friend') === 'false') {
        $(element).hide();
      }
    });

    showMarkers(friendOnlyMarkers);
  }
});

// La variable socket est déjà définie dans raid.js
const partyContainer = $(".cardContainer");
socket.on("newParty", (data) => {
  console.log("New party received:", data);

  const partyCard = `
    <div class = "cardParty">
      <h3>${data.title}</h3>
      <h4>Posté par ${data.user.fullname}</h4>
      <h5>Lieu : ${data.address}</h5>
      <p>${data.description}</p>
      <a href="/party/${data._id}">Détails</a>
    </div>
  `;
  partyContainer.append(partyCard);
});