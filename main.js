window.addEventListener("load", () => toggleLoadingSceen());

//* nav btn actions
let nav = document.querySelector("nav");
let menuBar = document.querySelector("[data-menu-btn]");
menuBar.addEventListener("click", toggleMenu);
function toggleMenu() {
  toggleOverlay();
  nav.dataset.active == "true"
    ? (nav.dataset.active = false)
    : (nav.dataset.active = true);
}

// function that toggles the overlay display
function toggleOverlay() {
  document.body.classList.toggle("active");
}

//* beginning of fetching weather

let unit = [...document.querySelectorAll("[data-unit]")].find(
  (r) => r.checked
).value;

let currentPos;
function userLocation() {
  navigator.geolocation.getCurrentPosition((loc) => {
    currentPos = `${loc.coords.latitude},${loc.coords.longitude}`;
    getWeather(currentPos);
  });
}
userLocation();

//! updating page content
async function getWeather(location) {
  toggleLoadingSceen();

  try {
    let response = await fetch(
      `https://weatherapi-com.p.rapidapi.com/forecast.json?q=${location}&days=6`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "weatherapi-com.p.rapidapi.com",
          "x-rapidapi-key":
            "1b398d9484mshe069f4f8b77adddp1d277bjsnf31e3c0a1784",
        },
      }
    );
    let data = await response.json();

    updateDetails(data);
    updateHourlyForcast(data);
    updateDaysForecast(data);
    refreshDate();
  } catch (err) {
    // showing an error in the input field
    locInputError();
  } finally {
    toggleLoadingSceen();
  }
}

function locInputError() {
  let input = document.querySelector("[data-loc-input]");

  input.classList.add("error");

  input.addEventListener("input", () => input.classList.remove("error"));
}

//* updating details
function updateDetails({
  location: { country, localTime, region },
  current,
} = data) {
  let citySpan = document.querySelector("[data-city]"),
    countrySpan = document.querySelector("[data-country]"),
    currentDegSpan = document.querySelector("[data-current-degrees]"),
    currentStatusSpan = document.querySelector("[data-current]"),
    feelsLikeSpan = document.querySelector("[data-feel-like]"),
    dateSpan = document.querySelector("[data-date]"),
    conditionImageTag = document.querySelector("[data-coniditon-image]");

  citySpan.innerHTML = region;
  countrySpan.innerHTML = country;

  let currentConditions = {
    realDegrees: current[`temp_${unit}`] + "°",
    conditionText: current.condition.text,
    conditionImg: current.condition.icon,
    feelsDegrees: current[`feelslike_${unit}`] + "°",
  };

  currentDegSpan.innerHTML = currentConditions.realDegrees;
  currentStatusSpan.innerHTML = currentConditions.conditionText;
  feelsLikeSpan.innerHTML = currentConditions.feelsDegrees;
  conditionImageTag.src = currentConditions.conditionImg;
}

//* creating hourly forecast
function updateHourlyForcast({
  forecast: { forecastday: forcastDays },
} = data) {
  // getting the forcast for upcoming hours and removing passed hours

  let holder = document.querySelector("[data-hourly-holder]");

  holder.innerHTML = "";

  let allHours = forcastDays.reduce((arr, forcast) => {
    return arr.concat(forcast.hour);
  }, []);

  let passedHours = new Date().getHours();
  allHours.splice(0, passedHours);

  // getting the next 24 hrs only
  allHours.length = 24;

  allHours.forEach((forcast) => {
    createHourlyForcast(forcast);
  });
}
//  a function that implements data to an hourly forcast div from a clone
function createHourlyForcast(forcast) {
  let forcastDetails = {
    image: forcast.condition.icon,
    degrees: forcast[`temp_${unit}`] + "°",
    conditionText: forcast.condition.text,
    time: convert12HoursSystem(forcast.time),
  };

  let template = document
    .querySelector("[data-hourly-template]")
    .cloneNode(true);
  let holder = document.querySelector("[data-hourly-holder]");

  delete template.dataset.hourlyTemplate;
  template.querySelector("img").src = forcastDetails.image;
  template.querySelector("[data-time-hourly]").innerHTML = forcastDetails.time;
  template.querySelector("[data-degrees-hourly]").innerHTML =
    forcastDetails.degrees;
  template.querySelector("[data-status-hourly]").innerHTML =
    forcastDetails.conditionText;

  holder.appendChild(template);
}

//* creating days forecast
function updateDaysForecast({ forecast: { forecastday } } = data) {
  let holder = document.querySelector("[data-days-forecast-holder]");
  holder.innerHTML = "";

  forecastday.forEach((dayForecast, dayNumber) => {
    createDaysForecast(dayForecast, dayNumber);
  });
}
//  a function that implements data to days forcast div from a clone
function createDaysForecast(dayForecast, dayNumber) {
  let { date, day } = dayForecast;

  let holder = document.querySelector("[data-days-forecast-holder]");

  let forecastDetails = {
    dayName: new Date(date).toLocaleDateString("en-US", { weekday: "long" }),
    conditionImg: day.condition.icon,
    conditionText: day.condition.text,
    maxDegrees: parseInt(day[`maxtemp_${unit}`]) + `°`,
    minDegrees: parseInt(day[`mintemp_${unit}`]) + "°",
  };

  let template = document.querySelector("[data-day-template]").cloneNode(true);

  delete template.dataset.dayTemplate;
  template.querySelector("img").src = forecastDetails.conditionImg;
  template.querySelector("[data-day]").textContent = forecastDetails.dayName;
  template.querySelector("[data-day-condition]").textContent =
    forecastDetails.conditionText;
  template.querySelector("[data-degrees-day-max]").textContent =
    forecastDetails.maxDegrees;
  template.querySelector("[data-degrees-day-min]").textContent =
    forecastDetails.minDegrees;

  // adding a style class to the current date
  if (dayNumber == 0) {
    template.classList.add("today");
  }

  holder.append(template);
}

function convert12HoursSystem(date) {
  // getting the time part from the date by splitting on space
  // then splitting the time to convert the first part
  let time = date.toString().split(" ")[1].split(":");
  if (time[0] > 12) {
    time[0] -= 12;
    time[1].padStart(2, "0");
    return `${time.join(":")} pm`;
  } else {
    return `${time.join(":")} am`;
  }
}

//! user changes the units

function handlingUnits() {
  let radioBtns = document.querySelectorAll('input[name="unit"]');

  radioBtns.forEach((radio) => {
    radio.addEventListener("change", () => {
      changeUnit(radio.value);
    });
  });
}
handlingUnits();

function changeUnit(unit) {
  //* getting all the degrees displayed in the page to conver them
  let hoursDegs = document.querySelectorAll("[data-degrees-hourly]"),
    daysDegsMax = document.querySelectorAll("[data-degrees-day-max]"),
    daysDegsMin = document.querySelectorAll("[data-degrees-day-min]"),
    currentDeg = document.querySelector("[data-current-degrees]"),
    feelLikeDeg = document.querySelector("[data-feel-like]");

  let allDegs = [
    ...hoursDegs,
    ...daysDegsMax,
    ...daysDegsMin,
    currentDeg,
    feelLikeDeg,
  ];

  allDegs.forEach((deg) => {
    if (unit == "f") {
      deg.innerHTML = (parseInt(deg.innerHTML) * 9) / 5 + 32 + "°";
    } else if (unit == "c") {
      deg.innerHTML =
        (((parseInt(deg.innerHTML) - 32) * 5) / 9).toFixed(1) + "°";
    }
  });
}

//! user changing location

function handleLocChange() {
  let changeLocationLi = document.querySelector("[data-change-loc]"),
    locationForm = document.querySelector("[data-searcher-holder]"),
    locationInput = document.querySelector("[data-loc-input]");

  changeLocationLi.addEventListener("click", showInputLoc);
  function showInputLoc(e) {
    locationForm.dataset.active = "true";
    toggleOverlay();
    toggleMenu();
  }

  locationInput.addEventListener("input", showSuggestions);
  async function showSuggestions() {
    let userTyped = locationInput.value.toLowerCase();

    if (!/[a-z]+/gi.test(userTyped)) return;

    let response = await fetch(
      `https://weatherapi-com.p.rapidapi.com/search.json?q=${userTyped}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "weatherapi-com.p.rapidapi.com",
          "x-rapidapi-key":
            "1b398d9484mshe069f4f8b77adddp1d277bjsnf31e3c0a1784",
        },
      }
    );

    let suggestions = await response.json();
    suggestions.length = 9;

    let suggestionsHolder = document.querySelector("[data-suggestions-holder]");
    suggestionsHolder.innerHTML = "";

    suggestions.forEach((suggestion) => {
      let { name, region, country } = suggestion;
      let text = `${name}, ${region}, ${country}`;
      createSuggestion(suggestionsHolder, text);
    });

    function createSuggestion(appender, text) {
      let sugg = document.createElement("div");
      sugg.className = "suggestion";
      sugg.setAttribute("data-suggestion", null);
      sugg.textContent = text;
      sugg.addEventListener("click", () => {
        locationInput.value = sugg.textContent;
      });

      appender.appendChild(sugg);
    }
  }

  locationForm.addEventListener("submit", changeLocation);
  function changeLocation(e) {
    e.preventDefault();
    locationForm.dataset.active = "false";
    toggleOverlay();
    getWeather(locationInput.value);
  }
}
handleLocChange();

function handleRefresh() {
  let refreshBtn = document.querySelector("[data-refresh]");

  refreshBtn.addEventListener("click", () => {
    getWeather(currentPos);
  });
}
handleRefresh();

// function that is called to refresh the date which the weather was updated at
function refreshDate() {
  let refreshDateSpan = document.querySelector("[data-updated-at]");

  let timeNow = `YYYY ${new Date().getHours()}:${new Date().getMinutes()}`;
  console.log(timeNow);
  refreshDateSpan.textContent = `Last updated on ${convert12HoursSystem(
    timeNow
  )}`;
}

// event when clicking on screen while an action is going (like if the menu was opened)
document.body.addEventListener("click", closeAction);
function closeAction(e) {
  if (!e.target.classList.contains("overlay")) return;

  let activeAction = document.querySelector('[data-active= "true"]');

  if (activeAction) {
    activeAction.dataset.active = "false";
    toggleOverlay();
  }
}

// function that toggles the display of the loading screen
function toggleLoadingSceen() {
  let loadingScreen = document.querySelector("[data-loading]");
  loadingScreen.classList.toggle("active");
}
