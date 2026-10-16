const tripForm = document.getElementById("tripForm");
const destination = document.getElementById("destination");
const country = document.getElementById("country");
const tripDate = document.getElementById("tripDate");
const ageGroup = document.getElementById("ageGroup");
const tripType = document.getElementById("tripType");
const formMessage = document.getElementById("formMessage");

const destinationResult = document.getElementById("destinationResult");
const locationName = document.getElementById("locationName");
const countryName = document.getElementById("countryName");
const weatherResult = document.getElementById("weatherResult");
const weatherMessage = document.getElementById("weatherMessage");
const adviceResult = document.getElementById("adviceResult");
const adviceMessage = document.getElementById("adviceMessage");
const checklistResult = document.getElementById("checklistResult");
const checklistList = document.getElementById("checklistList");

// Do not allow a past date to be selected
const today = new Date().toISOString().split("T")[0];
tripDate.min = today;

tripForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const destinationValue = destination.value.trim();
    const countryValue = country.value.trim();

    formMessage.textContent = "Searching for your destination...";
    destinationResult.hidden = true;
    weatherResult.hidden = true;
adviceResult.hidden = true;
checklistResult.hidden = true;

    try {

const response = await fetch(
    "https://geocoding-api.open-meteo.com/v1/search?name=" +
    encodeURIComponent(destinationValue + ", " + countryValue) +
    "&count=1&language=en&format=json"
);

        if (!response.ok) {
            throw new Error("The destination search was unsuccessful.");
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            formMessage.textContent =
                "Sorry, I could not find that destination. Please try another place.";
            return;
        }

        const place = data.results[0];

        const latitude = place.latitude;
        const longitude = place.longitude;

        const selectedDate = new Date(tripDate.value + "T00:00:00");

const currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);

const daysAway = Math.ceil(
    (selectedDate - currentDate) / (1000 * 60 * 60 * 24)
);

        locationName.textContent = place.name;
        countryName.textContent = place.country;

        destinationResult.hidden = false;

        if (daysAway > 16) {
    weatherMessage.textContent =
        "The trip is too far away for an accurate weather forecast. Please check again closer to the trip date.";

    weatherResult.hidden = false;
} else {

    const weatherResponse = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=" +
        latitude +
        "&longitude=" +
        longitude +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
        "&start_date=" +
        tripDate.value +
        "&end_date=" +
        tripDate.value +
        "&timezone=auto"
    );

    const weatherData = await weatherResponse.json();

    const maxTemp = weatherData.daily.temperature_2m_max[0];
    const minTemp = weatherData.daily.temperature_2m_min[0];
    const rainChance = weatherData.daily.precipitation_probability_max[0];

weatherMessage.innerHTML =
    "<strong>Maximum temperature:</strong> " + maxTemp + "°C<br>" +
    "<strong>Minimum temperature:</strong> " + minTemp + "°C<br>" +
    "<strong>Chance of rain:</strong> " + rainChance + "%";

    let advice = "";

if (rainChance >= 50) {
    advice = "Rain is likely. Bring waterproof clothing and consider an indoor backup activity.";
} else if (maxTemp >= 30) {
    advice = "Hot weather is expected. Bring plenty of water, sun hats and plan regular breaks.";
} else if (maxTemp <= 12) {
    advice = "Cool weather is expected. Bring warm clothing and jackets.";
} else {
    advice = "The weather looks suitable for a school trip. Remember water and comfortable clothing.";
}

adviceMessage.textContent = advice;
adviceResult.hidden = false;
let checklist = [
    "Water bottle",
    "Comfortable shoes",
    "Emergency contact information"
];

if (rainChance >= 50) {
    checklist.push("Waterproof jacket");
    checklist.push("Umbrella");
}

if (maxTemp >= 30) {
    checklist.push("Sun hat");
    checklist.push("Sunscreen");
    checklist.push("Extra water");
}

if (maxTemp <= 12) {
    checklist.push("Warm jacket");
}

if (tripType.value === "Museum") {
    checklist.push("Notebook and pencil");
}

if (tripType.value === "Outdoor") {
    checklist.push("Suitable outdoor clothing");
}

if (ageGroup.value === "Early Years") {
    checklist.push("Name labels for children");
}

checklistList.innerHTML = "";

checklist.forEach(function(item) {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    checklistList.appendChild(listItem);
});

checklistResult.hidden = false;

    weatherResult.hidden = false;
}

        formMessage.textContent =
            "Planning your " +
            tripType.value +
            " trip to " +
            place.name +
            " for " +
            ageGroup.value +
            "...";

    } catch (error) {

        formMessage.textContent =
            "Sorry, something went wrong while searching for the destination.";

        console.error(error);
    }

});
tripForm.addEventListener("reset", function() {

    formMessage.textContent = "";

    destinationResult.hidden = true;
    weatherResult.hidden = true;
    adviceResult.hidden = true;
    checklistResult.hidden = true;

    locationName.textContent = "";
    countryName.textContent = "";
    weatherMessage.textContent = "";
    adviceMessage.textContent = "";
    checklistList.innerHTML = "";
});