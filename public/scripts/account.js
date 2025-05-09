

function loginUser (email, password){

}



function logoutUser(){

}


function updateProfile({}){

}

function getUserData({}){

}

function getUserLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
  
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              const city =
                data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.county ||
                "Unknown";
  
              // Display the city in the HTML element
              document.getElementById("city-display").textContent = `${city}`;
            })
            .catch(error => {
              console.error("Error during reverse geocoding:", error);
              document.getElementById("city-display").textContent = "Could not determine city.";
            });
        },
        (error) => {
          console.error("Error getting location:", error.message);
          document.getElementById("city-display").textContent = "Location access denied.";
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      document.getElementById("city-display").textContent = "Geolocation not supported.";
    }
  }

  getUserLocation();