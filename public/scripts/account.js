


// Improved function to add Edit Availability button
function addAvailabilityButton() {
  // Find all section titles
  const sectionTitles = document.querySelectorAll('.section-title');

  sectionTitles.forEach(title => {
    if (title.textContent.includes('Weekly Availability')) {
      const button = document.createElement('a');
      button.href = '/set-availability';
      button.className = 'btn btn-availability ms-3';
      button.innerHTML = '<i class="bi bi-pencil"></i> Edit';

      // Create wrapper for proper alignment
      const wrapper = document.createElement('div');
      wrapper.className = 'd-flex align-items-center justify-content-between mb-3';

      // Reorganize DOM elements
      const parent = title.parentNode;
      parent.insertBefore(wrapper, title);
      wrapper.appendChild(title);
      wrapper.appendChild(button);
    }
  });
}

function getUserLocation() {
  console.log("Getting user location...");

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        )
          .then((response) => response.json())
          .then((data) => {
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county ||
              "Unknown";

            document.getElementById("city-display").textContent = city;
          })
          .catch((error) => {
            console.error("Error during reverse geocoding:", error);
            document.getElementById("city-display").textContent = "Location unavailable";
          });
      },
      (error) => {
        console.error("Error getting location:", error.message);
        document.getElementById("city-display").textContent = "Enable location access";
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    document.getElementById("city-display").textContent = "Location unsupported";
  }
}

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function () {
  addAvailabilityButton();
  getUserLocation();
});
