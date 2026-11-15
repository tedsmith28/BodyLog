// Gets log type & page elements
const logType = document.body.dataset.log;
const logForm = document.getElementById('logForm');
const entryDate = document.getElementById('entryDate');
const entryDescription = document.getElementById('entryDescription');
const entryValue = document.getElementById('entryValue');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');
const filterDate = document.getElementById('filterDate');
const showAllButton = document.getElementById('showAllButton');
const historyBody = document.getElementById('historyBody');
const historySummary = document.getElementById('historySummary');
const message = document.getElementById('message');

let bodyLogData;
let editingId = null;
let valueProperty;

// Sets the right value to use based on the log type
if (logType === "foods") {
    valueProperty = "calories";
} else if (logType === "weights") {
    valueProperty = "weight";
} else {
    valueProperty = "caloriesBurned";
}

// Return today's date
function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    
    return year + "-" + month + "-" + day;
}

// Load all logs
function loadData() {
    const savedData = localStorage.getItem("bodylog.v1");

    if (savedData === null) {
        return{
            version: 1,
            foods: [],
            weights: [],
            exercises: []
        };
    }

    const data = JSON.parse(savedData);

    if (!data || data.version !== 1 || !Array.isArray(data.foods) || !Array.isArray(data.weights) || !Array.isArray(data.exercises)) {
        throw new Error("Invalid data format");
    }

    return data;
}

// Update the data after successful saving
function saveData(data){
    try{
        localStorage.setItem("bodylog.v1", JSON.stringify(data));
    } catch (error) {
        message.textContent = "Changes could not be saved. Existing data is kept. Please try again.";
        return false;
    }
    bodyLogData = data;
    return true;
}

// Clears the form and exits editing mode
function resetForm() {
    logForm.reset();
    entryDate.value = getToday();
    editingId = null;
    saveButton.textContent = "Save Entry";
    cancelButton.hidden = true;
}

// Places an existing entry in the form
function editEntry(entry){
    editingId = entry.id;
    entryDate.value = entry.date;
    entryValue.value = entry[valueProperty];

    // The weight page doesn't have a description field
    if (entryDescription) {
        entryDescription.value = entry.description;
    }

    saveButton.textContent = "Save Changes";
    cancelButton.hidden = false;
    message.textContent = "Editing entry form" + entry.date + ".";
    entryDate.focus();
}

// Deletes an entry from the log
function deleteEntry(id){
    if (!window.confirm("Delete this entry?")) {
        return;
    }

    let updatedData;

    try{
        updatedData = loadData();
    } catch (error) {
        message.textContent = "Failed to load data for deletion. Please try again.";
        return;
    }

    updatedData[logType] = updatedData[logType].filter(function(entry){
        return entry.id !== id;
    });
   
    if (saveData(updatedData)){
        if (editingId === id) {
            resetForm();
        }

        renderHistory();
        message.textContent = "Entry deleted successfully.";
        entryDate.focus();
    }
}

// Displays the saved entries and history totals
function renderHistory() {
    const entries = bodyLogData[logType].slice().reverse();

    // Sorts entries by newest date first
    entries.sort(function(a, b){
        return b.date.localeCompare(a.date);
    });

    historyBody.replaceChildren();
    let total = 0;
    let count = 0;

    entries.forEach(function(entry){
        //Skips entries with missing or invalid values
        if (filterDate.value !== "" && entry.date !== filterDate.value) {
            return;
        }
        const row = historyBody.insertRow();
        row.insertCell().textContent = entry.date;

        if (entryDescription){
            row.insertCell().textContent = entry.description;
        }
        let displayValue = entry[valueProperty];

        if (logType == "weights"){
            displayValue = displayValue.toFixed(1);
        }

        row.insertCell().textContent = displayValue;

        // Crates edit & delete buttons
        const actions = document.createElement("div");
        actions.className ="entry-actions";
        row.insertCell().appendChild(actions);

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function(){
            editEntry(entry);
        });
       
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function(){
            deleteEntry(entry.id);
        });

        actions.append(editButton, deleteButton);
        total += entry[valueProperty];
        count++;
    });

    // Shows a message when history is empty
    if (count === 0){
        const cell = historyBody.insertRow().insertCell();
        cell.colSpan = entryDescription ? 4 : 3;
        cell.textContent = "No entries recorded.";
    }

    if (logType === "weights"){
        historySummary.textContent = "Entries shown: " + count;
    } else {
        historySummary.textContent = "Total calories shown: " + total + " cal";
    }
}

//Validates & saves new or modified entries
logForm.addEventListener("submit", function(event){
    event.preventDefault();
    
    if (!logForm.reportValidity()){
        return;
    }

    const value = Number(entryValue.value);

    if (!Number.isFinite(value) || value <= 0) {
        message.textContent = "Enter a number greater than 0.";
        return;
    }

    if (logType !== "weights" && !Number.isInteger(value)){
        message.textContent = "Enter calories in whole numbers.";
        return;
    }

    if (logType === "weights" && Number(value.toFixed(1)) !== value){
        message.textContent = "Enter weight with no more than one decimal place.";
        return;
    }

    if (entryDescription && entryDescription.value.trim() === ""){
        message.textContent = "Enter a description.";
        return;
    }

    //Reads the latest saved data before making changes.
    let updatedData;

    try{
        updatedData = loadData();
    } catch (error) {
        message.textContent = "Failed to load data.";
        return;
    }

    const entry = {
        id: editingId || crypto.randomUUID(),
        date: entryDate.value
    };

    entry[valueProperty] = value;
    if (entryDescription){
        entry.description = entryDescription.value.trim();
    }
    if (editingId){
        const index = updatedData[logType].findIndex(function(item){
            return item.id === editingId;
        });
        if (index === -1){
            message.textContent = "Entry no longer exists.";
            return;
        }

        updatedData[logType][index] = entry;
    } else {
        updatedData[logType].push(entry);
    }
    if (saveData(updatedData)){
        // Shows the saved entry's date
        filterDate.value = entry.date;

        resetForm();
        renderHistory();

        message.textContent = "Entry saved.";
        entryValue.focus();
    }
});

// Cancels editing without changing saved data
cancelButton.addEventListener("click", function(){
    resetForm();
    message.textContent = "Edit canceled. No changes were made.";
    entryDate.focus()
});

//Filters the history by date
filterDate.addEventListener("change", renderHistory);

//Removes the date filter
showAllButton.addEventListener("click", function(){
    filterDate.value = "";
    renderHistory();
});

// Sets up the page
resetForm();

try{
    bodyLogData = loadData();
    renderHistory();
} catch (error) {
    message.textContent = "Failed to load data.";

    historySummary.textContent = "Failed to load data.";

    //Prevents changes while saved data can't be read
    document.querySelectorAll("input, button").forEach(function(control){
        control.disabled = true;
});
}