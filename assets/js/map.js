// Smooth Scroll Effect (GSAP)
gsap.from("#hero .hero-content", {
  duration: 2,
  opacity: 0,
  y: -100,
  ease: "power3.out"
});

// Initialize Leaflet.js Map
function initMap() {
  const map = L.map('map').setView([40.9754, 35.0797], 7); // Tokat

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Mark important locations
  const locations = [
    { name: "Tokat - Birthplace", lat: 40.9754, lng: 35.0797 },
    { name: "Istanbul - University", lat: 41.0437, lng: 29.0035 },
    { name: "Ankara - Internship", lat: 39.9334, lng: 32.8597 }
  ];

  locations.forEach(loc => {
    L.marker([loc.lat, loc.lng]).addTo(map)
      .bindPopup(`<b>${loc.name}</b>`)
      .openPopup();
  });
}

document.addEventListener('DOMContentLoaded', initMap);
