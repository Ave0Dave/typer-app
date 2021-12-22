const TimeLimit = {
    time10 : 5,
    time30: 30,
    time100: 60,
    time200: 120,
    time500: 300
}

const Result = function(wpm, errors, accuracy, time) {
    return {
        wpm,
        errors,
        accuracy,
        time
    };
}

const quoteTextElement = document.getElementById("qoute-text");
const currentWPMElement = document.getElementById("current-wpm");
const currentTimeElement = document.getElementById("current-time");
const currentErrorsElement = document.getElementById("current-errors");
const currentAccuracyElement = document.getElementById("current-accuracy");
const inputBoxElement = document.getElementById("input-box");
const restartButtonElement = document.getElementById("restart-button");
const resultsTabelElement = document.getElementById("results-table");
const focusModeElement = document.getElementById("focus-mode");
const inputModeElement = document.getElementById("input-mode");

const timerArray = document.querySelectorAll(".timer");

let selectedTimer = TimeLimit.time30;
let timeRemaining = selectedTimer;
let timeElapsed = 0;
let errorsTotal = 0;
let currentAccuracy;
let currentErrors;
let charactersTyped = 0;
let charactersCorrect = 0;
let wordsPerMinute = 0;
let timer;
let degrees = 0;
let resultsArray = [];
let running = false;

const data = {
    labels: [],
    datasets: [{
        label: 'My First dataset',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: [],
    }]
};

let config = {
    type: 'line',
    data: data,
    options: {}
};

if (JSON.parse(localStorage.getItem("Config") != null)) {
 config = JSON.parse(localStorage.getItem("Config"));
}

let myChart = new Chart(document.getElementById("myChart"), config);

function getRandomQuote() {
    return fetch("https://api.quotable.io/random?minLength=90&&maxLength=130")
        .then(response => response.json())
        .then(data => data.content.toLowerCase());
}

//TODO: Remove forEach
async function renderNewQuote() {
    const quote = await getRandomQuote();
    quoteTextElement.innerHTML = "";

    quote.split("").forEach((character) => {
        const quoteCharacter = document.createElement("span");
        quoteCharacter.className = "char";
        quoteCharacter.innerText = character;
        quoteTextElement.appendChild(quoteCharacter);
    })
    inputBoxElement.value = "";
}

inputBoxElement.addEventListener("input", handleText);
inputBoxElement.addEventListener("keydown", addTimer, {once : true});

inputBoxElement.addEventListener("keydown", ({key}) => {
    const quoteArray = quoteTextElement.querySelectorAll("span")
    const inputArray = inputBoxElement.value.split("");
    
    for (let [index, quoteCharacterElement] of quoteArray.entries()) {
        const inputCharacter = inputArray[index];
        if ((inputCharacter!= null) && ["Backspace", "Delete"].includes(key)) {
            quoteArray[index + 1].classList.remove("highlight");
            quoteCharacterElement.classList.add("highlight");
        }
    }
});

//TODO: Clear word after whitespace
//TODO: Stop inputText from moving
//TODO: If errors before space dont proceed to another word
function handleText() { 
    running = true;
    const quoteArray = quoteTextElement.querySelectorAll("span")
    const inputArray = inputBoxElement.value.split("");
    
    currentErrors = 0;
    charactersTyped++;

    for (let [index, quoteCharacterElement] of quoteArray.entries()) {
        const inputCharacter = inputArray[index];

        if ((inputCharacter != null) && ((index + 1) < quoteArray.length)) {
            quoteArray[index + 1].classList.add("highlight");
            quoteCharacterElement.classList.remove("highlight");
        }
        
        if (inputCharacter == null) {
            quoteCharacterElement.classList.remove("correct");
            quoteCharacterElement.classList.remove("incorrect");

        } else if (inputCharacter === quoteCharacterElement.innerText) {
            quoteCharacterElement.classList.add("correct");
            quoteCharacterElement.classList.remove("incorrect");

        } else {
            quoteCharacterElement.classList.remove("correct");
            quoteCharacterElement.classList.add("incorrect");

            currentErrors++;
        } 
    }

    charactersCorrect = (charactersTyped - (errorsTotal + currentErrors));
    currentErrorsElement.innerHTML = `${currentErrors + errorsTotal} <span class="small">Errors</span>`;

    currentAccuracy = ((charactersCorrect / charactersTyped ) * 100);
    currentAccuracyElement.innerHTML = `${Math.round(currentAccuracy)} <span class="small">%</span>`;

    if (inputArray.length === quoteArray.length) {
        renderNewQuote();
        errorsTotal += currentErrors;
    }
}

//TODO: Make WPM color coded
function updateTimer() {
    if (timeRemaining > 0) {
        timeRemaining--;
        timeElapsed++;
        
        let minutes = parseInt(timeRemaining / 60);
        let seconds = parseInt((timeRemaining ) % 60);
        
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
                
        wordsPerMinute = Math.round((((charactersTyped / 5) / timeElapsed) * 60));
        addDataToChart(myChart, timeElapsed, wordsPerMinute);

        currentTimeElement.innerText = `${minutes} : ${seconds}`;
        currentWPMElement.innerHTML = `${wordsPerMinute} <span class="small">WPM</span>`;
        
    } else {
        myChart.update();
        console.log(config);
        localStorage.setItem("Config", JSON.stringify(config));
        removeData(myChart);
        myChart.destroy();
        myChart = new Chart(document.getElementById('myChart'), config);
        myChart.update();

        let result = new Result(wordsPerMinute, errorsTotal + currentErrors, currentAccuracy, selectedTimer);
        saveDataToLocalStorage(result);
        renderNewResult(resultsTabelElement);
        resetInstance();
    }
}

function addTimer() {
    timer = setInterval(updateTimer, 1000);
}

function formatTime(time) {
    return time < 60 ? `00 : ${time}` : `0${time / 60} : 00`;
}

function renderTime(time) {
    currentTimeElement.innerText = formatTime(time);
}

function attachListenerToTimers() {
    for (timer of timerArray) {
        timer.addEventListener("click", (e) => {
            if (running) {
                resetManual();
            }

            const selectedTimersArray = document.querySelectorAll(".timer");
            
            switch (e.target.id) {
                case "timer-10": timeRemaining = TimeLimit.time10;
                break;
                case "timer-30": timeRemaining = TimeLimit.time30;
                break;
                case "timer-100": timeRemaining = TimeLimit.time100;
                break;
                case "timer-200": timeRemaining = TimeLimit.time200;
                break;
                case "timer-500": timeRemaining = TimeLimit.time500;
                break;
            }
            
            for (timer of selectedTimersArray) {
                timer.classList.remove("selected");
            }
            e.target.classList.add("selected");
            
            currentTimeElement.classList.add("blink");
            const blink = document.querySelector(".blink");
            blink.addEventListener('animationend', () => {
                currentTimeElement.classList.remove("blink");
            });

            selectedTimer = timeRemaining; 
            currentTimeElement.innerText = formatTime(selectedTimer);
        });
    }
}

function resetInstance() {  
    renderNewQuote();
   
    clearInterval(timer);
    inputBoxElement.addEventListener("keydown", addTimer, {once : true});
    inputBoxElement.disabled = true;
    inputBoxElement.style.cursor = "not-allowed";

    timeRemaining = selectedTimer;
    timeElapsed = 0;
    wordsPerMinute = 0;
    errorsTotal = 0;
    currentErrors = 0;
    charactersTyped = 0;
    currentAccuracy = 0;

    renderTime(timeRemaining);
    currentWPMElement.innerHTML = '0 <span class="small">WPM</span>';
    currentErrorsElement.innerHTML = '0 <span class="small">Errors</span>';
    currentAccuracyElement.innerHTML = '0 <span class="small">%</span>';

    degrees += 360;
    const restartIconElement = document.getElementById("restart-icon");
    restartIconElement.style.transform = `rotate(${degrees}deg)`;
}

function resetManual() {
    resetInstance();
    inputBoxElement.disabled = false;
    inputBoxElement.style.cursor = "text";
    inputBoxElement.focus();
}

function saveDataToLocalStorage(data)
{
    resultsArray = JSON.parse(localStorage.getItem("Results")) || [];
    resultsArray.push(data);

    localStorage.setItem("Results", JSON.stringify(resultsArray));
}

function renderCompleteResults(table) {
    const resultsData = JSON.parse(localStorage.getItem("Results"));
    if (resultsData != null) {
        for (result of resultsData) {
            const resultsRow = document.createElement("tr");
            resultsRow.innerHTML = `<td>${result.wpm}</td>
                                    <td>${result.errors}</td>
                                    <td>${result.accuracy.toFixed(2)} %</td>
                                    <td>${formatTime(result.time)}</td>`;
            table.appendChild(resultsRow);
        }
    }
}

function renderNewResult(table) {
    const resultsData = JSON.parse(localStorage.getItem("Results"));
    if (resultsData != null) {
        console.log(resultsData.at(-1));
            const resultsRow = document.createElement("tr");
            resultsRow.innerHTML = `<td>${resultsData.at(-1).wpm}</td>
                                    <td>${resultsData.at(-1).errors}</td>
                                    <td>${resultsData.at(-1).accuracy.toFixed(2)} %</td>
                                    <td>${formatTime(resultsData.at(-1).time)}</td>`;
            table.appendChild(resultsRow);
    }
}

function addDataToChart(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
}

function removeData(chart) {
    while (chart.data.labels.length != 0) {
        chart.data.labels.pop();
    }
    
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    chart.update();
}
 

renderTime(timeRemaining);
attachListenerToTimers();
renderNewQuote();
renderCompleteResults(resultsTabelElement);

restartButtonElement.addEventListener("click", resetManual);

focusModeElement.addEventListener("click", () => {
    focusModeElement.classList.toggle("selected");
    const overlayElement = document.getElementById("overlay");
    overlayElement.classList.toggle("overlay-visible");
});

inputModeElement.addEventListener("click", () => {
    inputModeElement.classList.toggle("selected");
    inputBoxElement.classList.toggle("input-visible");
    inputBoxElement.focus();
});

