function initMap() {
  const mapOptions = {
    center: { lat: 40.9754, lng: 35.0797 }, // Tokat, Turkey
    zoom: 7,
  };

  const map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // Add markers for important locations
  const locations = [
    { name: "Tokat - Birthplace", lat: 40.9754, lng: 35.0797 },
    { name: "Istanbul Büyükçekmece - Primary School", lat: 41.0056, lng: 28.6372 },
    { name: "Tokat GOP - Middle School", lat: 40.3111, lng: 35.0762 },
    { name: "Beylikdüzü - High School", lat: 41.0040, lng: 28.6145 },
    { name: "Istanbul Technical University", lat: 41.0437, lng: 29.0035 },
    { name: "Enerjisa", lat: 40.9884, lng: 28.8064 },
    { name: "İstanbul Metropolitan Municipality (İBB)", lat: 41.0054, lng: 28.9772 }
  ];

  locations.forEach(loc => {
    new google.maps.Marker({
      position: { lat: loc.lat, lng: loc.lng },
      map: map,
      title: loc.name,
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
});
