// Gets the date & dashboard display
const dashboardDate = document.getElementById("dashboardDate");
const caloriesConsumed = document.getElementById("caloriesConsumed");
const currentWeight = document.getElementById("currentWeight");
const caloriesBurned = document.getElementById("caloriesBurned");
const message = document.getElementById("message");

// Start with empty logs
let bodyLogData = {
  version: 1,
  foods: [],
  weights: [],
  exercises: [],
};

// Get today's date for the date field
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

dashboardDate.value = year + "-" + month + "-" + day;

// Dashboard calculations
function updateDashboard() {
  const selectedDate = dashboardDate.value;

  let foodTotal = 0;
  let exerciseTotal = 0;
  let latestWeight = null;
  let latestWeightDate = "";

  // Food calorie calculations for selected date
  bodyLogData.foods.forEach(function (entry) {
    if (entry.date === selectedDate) {
      foodTotal += entry.calories;
    }
  });

  // Exercise calorie calculations for selected date
  bodyLogData.exercises.forEach(function (entry) {
    if (entry.date === selectedDate) {
      exerciseTotal += entry.caloriesBurned;
    }
  });

  // Weight calculations for selected date
  bodyLogData.weights.forEach(function (entry) {
    if (entry.date <= selectedDate && entry.date >= latestWeightDate) {
      latestWeight = entry.weight;
      latestWeightDate = entry.date;
    }
  });

  // Calorie total displays
  caloriesConsumed.textContent = foodTotal + " cal";
  caloriesBurned.textContent = exerciseTotal + " cal";

  // Weight displays
  if (latestWeight === null) {
    currentWeight.textContent = "- lbs";
  } else {
    currentWeight.textContent = latestWeight.toFixed(1) + " lbs";
    }
}

// Loads & displays saved data
function loadDashboard(){
    try{
        const savedData = localStorage.getItem("bodylog.v1");
        if (savedData !== null){
            const data = JSON.parse(savedData);

            if (!data || data.version !== 1 || !Array.isArray(data.foods) || !Array.isArray(data.weights) || !Array.isArray(data.exercises)) {
                throw new Error("Unsupported saved data.");
            }
            
            bodyLogData = data;

        } else {
            bodyLogData = {
                version: 1,
                foods: [],
                weights: [],
                exercises: []
            };
        }
        
        updateDashboard();
        message.textContent = "";
    } catch (error) {
        caloriesConsumed.textContent = "Unavailable";
        currentWeight.textContent = "Unavailable";
        caloriesBurned.textContent = "Unavailable";

        message.textContent = "Saved content could not be recorded. No saved data was modified.";
    }
}

// Updates the dashboard for different dates
dashboardDate.addEventListener("change", loadDashboard);

// Displays the dashboard
loadDashboard();

//Clears all data from BodyLog
const clearDataButton = document.getElementById("clearDataButton");

clearDataButton.addEventListener("click", function() {
  if (!window.confirm("This will delete all data permanently. Are you sure?")){
    return;
  }

  try{
    localStorage.removeItem("bodylog.v1");
  } catch (error) {
    message.textContent = "Failed to clear data.";
    return;
  }
  loadDashboard();
  message.textContent = "All data has been cleared.";
});
