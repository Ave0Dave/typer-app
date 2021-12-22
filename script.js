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
const resultsTableElement = document.getElementById("results-table");
const focusModeElement = document.getElementById("focus-mode");
const inputModeElement = document.getElementById("input-mode");
const deleteResultsElement = document.getElementById("delete-results");

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
    datasets: [
        {
        label: 'WPM',
        backgroundColor: "#7e6db3",
        borderColor: '#7e6db3',
        cubicInterpolationMode: 'monotone',
        data: [],
    },
    {
        label: 'Accuracy',
        backgroundColor: "#5f43b2",
        borderColor: '#5f43b2',
        cubicInterpolationMode: 'monotone',
        data: [],
    }
    ]
};

const config = {
    type: 'line',
    data: data,
    options: {
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                
                        grid: {
                        drawOnChartArea: false,
                        },
                    },
                }
            }
        }
    }
};

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

//TODO: Clear word after whitespace
//TODO: Stop inputText from moving
//TODO: If errors before space dont proceed to another word
function handleText() { 
    running = true;
    const quoteArray = quoteTextElement.querySelectorAll(".char")
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

function updateTimer() {
    if (timeRemaining > 0) {
        timeRemaining--;
        timeElapsed++;
        
        let minutes = parseInt(timeRemaining / 60);
        let seconds = parseInt((timeRemaining ) % 60);
        
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
                
        wordsPerMinute = Math.round((((charactersTyped / 5) / timeElapsed) * 60));
        addDataToChart(myChart, timeElapsed, wordsPerMinute, currentAccuracy);

        currentTimeElement.innerText = `${minutes} : ${seconds}`;
        currentWPMElement.innerHTML = `${wordsPerMinute} <span class="small">WPM</span>`;
        
    } else {
        let result = new Result(wordsPerMinute, errorsTotal + currentErrors, currentAccuracy, selectedTimer);
        saveDataToLocalStorage(result);
        renderNewResult(resultsTableElement);
        resetInstance();
        running = false;
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

            running = false;
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

    myChart.destroy();
    removeData(myChart);
    myChart = new Chart(document.getElementById('myChart'), config);
}

function saveDataToLocalStorage(data) {
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

    const tableWPMElement = document.getElementById("table-wpm");
    const tableErrorsElement = document.getElementById("table-errors");
    const tableAccuracylement = document.getElementById("table-accuracy");
    const tableTimeElement = document.getElementById("table-time");

    if (resultsData != null) {
        console.log(resultsData.at(-1));
            const resultsRow = document.createElement("tr");
            resultsRow.innerHTML = `<td>${resultsData.at(-1).wpm}</td>
                                    <td>${resultsData.at(-1).errors}</td>
                                    <td>${resultsData.at(-1).accuracy.toFixed(2)} %</td>
                                    <td>${formatTime(resultsData.at(-1).time)}</td>`;
            table.appendChild(resultsRow);

            tableWPMElement.textContent = resultsData.at(-1).wpm;
            tableErrorsElement.textContent = resultsData.at(-1).errors;
            tableAccuracylement.textContent = resultsData.at(-1).accuracy.toFixed(2);
            tableTimeElement.textContent = resultsData.at(-1).time;
    }
}

function addDataToChart(chart, label, data1, data2) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data1);
    chart.data.datasets[1].data.push(data2);

    myChart.update();
}

function removeData(chart) {
    chart.data.datasets[0].data.length = 0;
    chart.data.datasets[1].data.length = 0;
    chart.data.labels.length = 0;
 }

// ----------------------- Listeners ----------------------- //

inputBoxElement.addEventListener("input", handleText);
inputBoxElement.addEventListener("keydown", addTimer, {once : true});

inputBoxElement.addEventListener("keydown", ({key}) => {
    const quoteArray = quoteTextElement.querySelectorAll(".char")
    const inputArray = inputBoxElement.value.split("");
    
    for (let [index, quoteCharacterElement] of quoteArray.entries()) {
        const inputCharacter = inputArray[index];
        if ((inputCharacter!= null) && ["Backspace", "Delete"].includes(key)) {
            quoteArray[index + 1].classList.remove("highlight");
            quoteCharacterElement.classList.add("highlight");
        }
    }
});

function removeResults() {
    localStorage.clear();
    resultsTableElement.innerHTML = "";
}

restartButtonElement.addEventListener("click", resetManual);
deleteResultsElement.addEventListener("click", removeResults);


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

// ----------------------- Listeners ----------------------- //

renderTime(timeRemaining);
attachListenerToTimers();
renderNewQuote();
renderCompleteResults(resultsTableElement);

