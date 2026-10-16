// PlanSmart API sources:
// Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api
// Open-Meteo Forecast API: https://open-meteo.com/en/docs
// World Bank Country API: https://datahelpdesk.worldbank.org/knowledgebase/articles/898590-country-api-queries

const tripForm = document.getElementById("tripForm");
const destination = document.getElementById("destination");
const country = document.getElementById("country");
const tripDate = document.getElementById("tripDate");
const ageGroup = document.getElementById("ageGroup");
const tripType = document.getElementById("tripType");
const submitButton = document.getElementById("submitButton");

const resultsSection = document.getElementById("resultsSection");
const formMessage = document.getElementById("formMessage");

const destinationResult = document.getElementById("destinationResult");
const locationName = document.getElementById("locationName");
const countryName = document.getElementById("countryName");

const countryInfoResult = document.getElementById("countryInfoResult");
const capitalCity = document.getElementById("capitalCity");
const countryRegion = document.getElementById("countryRegion");
const incomeLevel = document.getElementById("incomeLevel");

const weatherResult = document.getElementById("weatherResult");
const weatherSummary = document.getElementById("weatherSummary");
const weatherDataList = document.getElementById("weatherDataList");
const weatherMax = document.getElementById("weatherMax");
const weatherMin = document.getElementById("weatherMin");
const weatherRain = document.getElementById("weatherRain");
const weatherWind = document.getElementById("weatherWind");

const adviceResult = document.getElementById("adviceResult");
const adviceMessage = document.getElementById("adviceMessage");

const checklistResult = document.getElementById("checklistResult");
const checklistList = document.getElementById("checklistList");

const countryAliases = {
    "uk": "United Kingdom",
    "u.k.": "United Kingdom",
    "gb": "United Kingdom",
    "gbr": "United Kingdom",
    "us": "United States",
    "usa": "United States",
    "u.s.": "United States",
    "u.s.a.": "United States",
    "uae": "United Arab Emirates",
    "u.a.e.": "United Arab Emirates",
    "ksa": "Saudi Arabia"
};

function normaliseCountryName(countryInput) {
    const cleanedCountry = countryInput.trim().toLowerCase();
    return countryAliases[cleanedCountry] || countryInput.trim();
}

function hideResults() {
    destinationResult.hidden = true;
    countryInfoResult.hidden = true;
    weatherResult.hidden = true;
    adviceResult.hidden = true;
    checklistResult.hidden = true;
}

function clearResultContent() {
    formMessage.textContent = "";
    formMessage.className = "status-message";

    locationName.textContent = "";
    countryName.textContent = "";
    capitalCity.textContent = "";
    countryRegion.textContent = "";
    incomeLevel.textContent = "";

    weatherSummary.textContent = "";
    weatherMax.textContent = "";
    weatherMin.textContent = "";
    weatherRain.textContent = "";
    weatherWind.textContent = "";
    weatherDataList.hidden = false;

    adviceMessage.textContent = "";
    checklistList.replaceChildren();
}

function setStatus(message, type = "loading") {
    resultsSection.hidden = false;
    formMessage.textContent = message;
    formMessage.className = `status-message is-${type}`;
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Planning..." : "Plan My Trip";
}

function getDaysAway(dateValue) {
    const selectedDate = new Date(`${dateValue}T00:00:00`);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return Math.round((selectedDate - currentDate) / 86400000);
}

function describeWeatherCode(code) {
    const weatherDescriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    };

    return weatherDescriptions[code] || "Weather conditions available";
}

function createWeatherAdvice(maxTemp, rainChance, windSpeed) {
    if (rainChance >= 50) {
        return "Rain is likely. Bring waterproof clothing and prepare an indoor backup activity.";
    }

    if (windSpeed >= 45) {
        return "Strong winds are expected. Review outdoor activities and check local safety guidance before travelling.";
    }

    if (maxTemp >= 30) {
        return "Hot weather is expected. Bring extra water, sun hats and sunscreen, and plan regular shaded breaks.";
    }

    if (maxTemp <= 12) {
        return "Cool weather is expected. Bring warm layers and check that children have suitable outerwear.";
    }

    return "The forecast looks suitable for a school trip. Recheck conditions before travelling and keep water available.";
}

function createChecklist(ageGroupValue, tripTypeValue, maxTemp, rainChance, windSpeed) {
    const checklist = [
        "Water bottle",
        "Comfortable shoes",
        "Emergency contact information"
    ];

    if (Number.isFinite(rainChance) && rainChance >= 50) {
        checklist.push("Waterproof jacket", "Umbrella");
    }

    if (Number.isFinite(maxTemp) && maxTemp >= 30) {
        checklist.push("Sun hat", "Sunscreen", "Extra water");
    }

    if (Number.isFinite(maxTemp) && maxTemp <= 12) {
        checklist.push("Warm jacket");
    }

    if (Number.isFinite(windSpeed) && windSpeed >= 45) {
        checklist.push("Secure loose items and review outdoor plans");
    }

    if (tripTypeValue === "Museum") {
        checklist.push("Notebook and pencil");
    }

    if (tripTypeValue === "Outdoor") {
        checklist.push("Suitable outdoor clothing");
    }

    if (tripTypeValue === "Educational") {
        checklist.push("Learning activity sheet");
    }

    if (tripTypeValue === "Cultural") {
        checklist.push("Pre-visit cultural guidance for students");
    }

    if (ageGroupValue === "Early Years") {
        checklist.push("Name labels for children");
    }

    return checklist;
}

async function fetchJson(url, errorMessage) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(errorMessage);
    }

    return response.json();
}

async function searchDestination(destinationValue, countryValue) {
    const query = encodeURIComponent(`${destinationValue}, ${countryValue}`);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`;
    const data = await fetchJson(url, "The destination search was unsuccessful.");

    if (!data.results || data.results.length === 0) {
        return null;
    }

    const normalisedCountry = countryValue.toLowerCase();
    const exactCountryMatch = data.results.find((place) =>
        place.country && place.country.toLowerCase() === normalisedCountry
    );

    return exactCountryMatch || data.results[0];
}

async function fetchCountryInfo(countryCode) {
    const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(countryCode)}?format=json`;
    const data = await fetchJson(url, "Country information could not be loaded.");

    if (!Array.isArray(data) || !data[1] || !data[1][0]) {
        throw new Error("Country information was unavailable.");
    }

    return data[1][0];
}

async function fetchWeather(latitude, longitude, dateValue) {
    const dailyVariables = [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "wind_speed_10m_max"
    ].join(",");

    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&daily=${dailyVariables}` +
        `&start_date=${dateValue}` +
        `&end_date=${dateValue}` +
        "&timezone=auto";

    const data = await fetchJson(url, "The weather forecast could not be loaded.");

    if (!data.daily || !data.daily.temperature_2m_max || data.daily.temperature_2m_max.length === 0) {
        throw new Error("Weather data was unavailable for that date.");
    }

    return {
        code: data.daily.weather_code?.[0],
        maxTemp: data.daily.temperature_2m_max[0],
        minTemp: data.daily.temperature_2m_min[0],
        rainChance: data.daily.precipitation_probability_max?.[0] ?? 0,
        windSpeed: data.daily.wind_speed_10m_max?.[0] ?? 0
    };
}

function renderDestination(place) {
    locationName.textContent = place.name || "Not available";
    countryName.textContent = place.country || "Not available";
    destinationResult.hidden = false;
}

function renderCountryInfo(countryDetails) {
    capitalCity.textContent = countryDetails.capitalCity || "Not available";
    countryRegion.textContent = countryDetails.region?.value || "Not available";
    incomeLevel.textContent = countryDetails.incomeLevel?.value || "Not available";
    countryInfoResult.hidden = false;
}

function renderWeather(weather) {
    weatherSummary.textContent = describeWeatherCode(weather.code);
    weatherMax.textContent = `${weather.maxTemp}°C`;
    weatherMin.textContent = `${weather.minTemp}°C`;
    weatherRain.textContent = `${weather.rainChance}%`;
    weatherWind.textContent = `${weather.windSpeed} km/h`;
    weatherDataList.hidden = false;
    weatherResult.hidden = false;
}

function renderForecastUnavailable() {
    weatherSummary.textContent =
        "The trip is more than 16 days away, so an accurate forecast is not available yet. Please check again closer to the trip date.";
    weatherDataList.hidden = true;
    weatherResult.hidden = false;
}

function renderAdvice(advice) {
    adviceMessage.textContent = advice;
    adviceResult.hidden = false;
}

function renderChecklist(items) {
    checklistList.replaceChildren();

    items.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        checklistList.appendChild(listItem);
    });

    checklistResult.hidden = false;
}

function validateTripDate() {
    if (!tripDate.value) {
        tripDate.setCustomValidity("");
        return;
    }

    const selectedYear = Number(tripDate.value.slice(0, 4));

    if (!Number.isInteger(selectedYear) || selectedYear < 1000 || selectedYear > 2099) {
        tripDate.setCustomValidity("Please choose a date with a four-digit year between 1000 and 2099.");
    } else {
        tripDate.setCustomValidity("");
    }
}

const today = new Date().toISOString().split("T")[0];
tripDate.min = today;
tripDate.addEventListener("input", validateTripDate);
tripDate.addEventListener("change", validateTripDate);

tripForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    validateTripDate();

    if (!tripForm.checkValidity()) {
        tripForm.reportValidity();
        return;
    }

    const destinationValue = destination.value.trim();
    const countryValue = normaliseCountryName(country.value);

    hideResults();
    clearResultContent();
    setStatus("Searching for your destination and planning the trip...", "loading");
    setLoading(true);

    try {
        const place = await searchDestination(destinationValue, countryValue);

        if (!place) {
            setStatus("Sorry, I could not find that destination. Check the city and country and try again.", "error");
            return;
        }

        renderDestination(place);

        try {
            const countryDetails = await fetchCountryInfo(place.country_code);
            renderCountryInfo(countryDetails);
        } catch (countryError) {
            console.warn(countryError);
            countryInfoResult.hidden = true;
        }

        const daysAway = getDaysAway(tripDate.value);

        if (daysAway > 16) {
            renderForecastUnavailable();

            const genericAdvice =
                "The weather forecast is not available yet. Recheck closer to the trip date and review local conditions before travelling.";
            renderAdvice(genericAdvice);

            const genericChecklist = createChecklist(
                ageGroup.value,
                tripType.value,
                Number.NaN,
                Number.NaN,
                Number.NaN
            );
            renderChecklist(genericChecklist);
        } else {
            const weather = await fetchWeather(place.latitude, place.longitude, tripDate.value);
            renderWeather(weather);

            const advice = createWeatherAdvice(
                weather.maxTemp,
                weather.rainChance,
                weather.windSpeed
            );
            renderAdvice(advice);

            const checklist = createChecklist(
                ageGroup.value,
                tripType.value,
                weather.maxTemp,
                weather.rainChance,
                weather.windSpeed
            );
            renderChecklist(checklist);
        }

        setStatus(
            `Your ${tripType.value.toLowerCase()} trip to ${place.name} for ${ageGroup.value} has been planned.`,
            "success"
        );
    } catch (error) {
        console.error(error);
        setStatus(
            "Sorry, PlanSmart could not complete the trip plan. Please check your connection and try again.",
            "error"
        );
    } finally {
        setLoading(false);
    }
});

tripForm.addEventListener("reset", () => {
    hideResults();
    clearResultContent();
    resultsSection.hidden = true;
    submitButton.disabled = false;
    submitButton.textContent = "Plan My Trip";
});
