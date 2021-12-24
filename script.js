const TimeLimit = {
    time10 : 10,
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

const quoteTextElement = document.getElementById("qoute-text");
const inputBoxElement = document.getElementById("input-box");
const currentWPMElement = document.getElementById("current-wpm");
const currentTimeElement = document.getElementById("current-time");
const currentErrorsElement = document.getElementById("current-errors");
const currentAccuracyElement = document.getElementById("current-accuracy");
const restartButtonElement = document.getElementById("restart-button");
const deleteResultsElement = document.getElementById("delete-results");

const resultsData = JSON.parse(localStorage.getItem("Results"));
const resultsTableElement = document.getElementById("results-table");

const focusModeElement = document.getElementById("focus-mode");
const inputModeElement = document.getElementById("input-mode");

const tableWPMElement = document.getElementById("table-wpm");
const tableErrorsElement = document.getElementById("table-errors");
const tableAccuracylement = document.getElementById("table-accuracy");
const tableTimeElement = document.getElementById("table-time");

let timer = 0;
let selectedTimer = TimeLimit.time30;
let timeRemaining = selectedTimer;
let timeElapsed = 0;
let errorsTotal = 0;
let wordsPerMinute = 0;
let currentErrors = 0;
let currentAccuracy = 0;
let charactersTyped = 0;
let charactersCorrect = 0;
let degrees = 0;
let resultsArray = resultsData;
let running = false;

let charIndex = 0;
let wordIndex = 0;
let reverse = false;
let currentIndex = 0;

let myChart = new Chart(document.getElementById("myChart"), config);

function getRandomQuote() {
    return fetch("https://random-word-api.herokuapp.com/word?number=12&swear=0")
        .then(response => response.json())
        .then(data => data);
}

async function renderNewQuote() {
    const quote = await getRandomQuote();
    quoteTextElement.innerHTML = "";

    for (word of quote) {
        word += " ";
        const quoteWord = document.createElement("span");
        quoteWord.className = "word";
        
        for (character of word) {
            const quoteCharacter = document.createElement("span");
            quoteCharacter.className = "char";
            quoteCharacter.innerText = character;
            quoteWord.appendChild(quoteCharacter);
        }
        quoteTextElement.appendChild(quoteWord);
    }

    inputBoxElement.value = "";
}

// function getRandomQuote() {
//     return fetch("https://api.quotable.io/random?minLength=80&&maxLength=130")
//         .then(response => response.json())
//         .then(data => data.content.toLowerCase());
// }

// async function renderNewQuote() {
//     const quote = await getRandomQuote();
//     quoteTextElement.innerHTML = "";

//     for (character of quote.split("")) {
//         const quoteCharacter = document.createElement("span");
//         quoteCharacter.className = "char";
//         quoteCharacter.innerText = character;
//         quoteTextElement.appendChild(quoteCharacter);
//     }

//     inputBoxElement.value = "";
// }

const checkWord = (e) => {
    running = true;
    const charArray = quoteTextElement.querySelectorAll(".char")
    const currentChar = inputBoxElement.value.split("");
    
    charArray[charIndex].classList.remove("highlight");

    if (["Backspace", "Delete"].includes(e.key) && charIndex > 0) {
        reverse = true;
        charIndex--;
        console.log(charIndex)
        charArray[charIndex].classList.add("highlight");
    }
    
    if (charArray[charIndex].innerText == e.key) {
        charArray[charIndex].classList.remove("incorrect");
        charArray[charIndex].classList.add("correct");

    } else if (charArray[charIndex].innerText != currentChar[charIndex]) {
        charArray[charIndex].classList.add("incorrect"); 
        charArray[charIndex].classList.remove("correct");
        currentErrors++;
    } 
    
    if (!reverse) {
        charIndex++;
        charArray[charIndex].classList.add("highlight");
    }
    
    charactersTyped++;
    reverse = false;
    
    const wordArray = quoteTextElement.querySelectorAll(".word")
    const currentWordElement = quoteTextElement.childNodes[wordIndex];
    const currentWord = wordArray[wordIndex].innerText;
    
    if (wordIndex === 0) {
        currentWordElement.classList.add('highlight-word');
        currentIndex = currentWord.length;
    }
    
    if (e.keyCode === 32 && charIndex >= currentIndex) {
        e.preventDefault();
        charArray[charIndex].classList.remove("highlight");
        charArray[currentIndex].classList.add("highlight");
        
        
        const currentInputValue = inputBoxElement.value;
        const nextWordElement = quoteTextElement.childNodes[wordIndex + 1];
        inputBoxElement.value = "";
        
        if (currentInputValue === currentWord) {
            currentWordElement.classList.add("correct");
        } else {
            currentWordElement.classList.add("incorrect");
        }
        
        if (nextWordElement) {
            currentWordElement.classList.remove("highlight-word");
            nextWordElement.classList.add("highlight-word");
        }
        
        wordIndex++;
        charIndex = currentIndex;
        currentIndex += nextWordElement.innerText.length;
    }

    charactersCorrect = (charactersTyped - (errorsTotal + currentErrors));
    currentErrorsElement.innerHTML = `${currentErrors + errorsTotal} <span class="small">Errors</span>`;

    currentAccuracy = ((charactersCorrect / charactersTyped ) * 100);
    currentAccuracyElement.innerHTML = `${Math.round(currentAccuracy)} <span class="small">%</span>`;

    console.log(charIndex + "=" + (charArray.length - 1))
    if (charIndex === charArray.length - 1) {
        renderNewQuote();
        resetIndexes();
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
        renderNewResult(resultsTableElement, resultsData);
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
    const timerArray = document.querySelectorAll(".timer");

    for (timer of timerArray) {
        timer.addEventListener("click", (e) => {
            if (running) {
                resetManual();
            }
            
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
            
            for (timer of timerArray) {
                timer.classList.remove("selected");
            }
            e.target.classList.add("selected");
            inputBoxElement.focus();
            
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
    resetIndexes();
    renderNewQuote();
    clearInterval(timer);
    
    inputBoxElement.addEventListener("keydown", addTimer, {once : true});
    inputBoxElement.style.cursor = "not-allowed";
    inputBoxElement.disabled = true;
    
    currentWPMElement.innerHTML = '0 <span class="small">WPM</span>';
    currentErrorsElement.innerHTML = '0 <span class="small">Errors</span>';
    currentAccuracyElement.innerHTML = '0 <span class="small">%</span>';
    
    timeRemaining = selectedTimer;
    timeElapsed = 0;
    wordsPerMinute = 0;
    errorsTotal = 0;
    currentErrors = 0;
    charactersTyped = 0;
    currentAccuracy = 0;
    degrees += 360;
    
    renderTime(timeRemaining);
    const restartIconElement = document.getElementById("restart-icon");
    restartIconElement.style.transform = `rotate(${degrees}deg)`;
}

function resetManual() {
    resetInstance();
    inputBoxElement.disabled = false;
    inputBoxElement.style.cursor = "text";
    inputBoxElement.focus();

    myChart.destroy();
    removeDataFromChart(myChart);
    myChart = new Chart(document.getElementById('myChart'), config);
}

function resetIndexes() {
    charIndex = 0;
    wordIndex = 0;
    currentIndex = 0;
    reverse = false;
}

// ----------------------- Data handlers ----------------------- //

function saveDataToLocalStorage(data) {
    resultsArray = JSON.parse(localStorage.getItem("Results")) || [];

    resultsArray.push(data);
    localStorage.setItem("Results", JSON.stringify(resultsArray));
}

function addDataToChart(chart, label, data1, data2) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data1);
    chart.data.datasets[1].data.push(data2);

    myChart.update();
}

function removeDataFromChart(chart) {
    for (dataset of chart.data.datasets) {
        dataset.data.length = 0
    }
    chart.data.labels.length = 0;
}

// ----------------------- Data handlers ----------------------- //

// ----------------------- Result handlers ----------------------- //

function renderCompleteResults(table, data) {
    if (data != null) {
        for (result of data) {
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
            const resultsRow = document.createElement("tr");
            resultsRow.innerHTML = `<td>${resultsData.at(-1).wpm}</td>
                                    <td>${resultsData.at(-1).errors}</td>
                                    <td>${resultsData.at(-1).accuracy.toFixed(2)} %</td>
                                    <td>${formatTime(resultsData.at(-1).time)}</td>`;
            table.appendChild(resultsRow);

            tableWPMElement.textContent = resultsData.at(-1).wpm;
            tableErrorsElement.textContent = resultsData.at(-1).errors;
            tableAccuracylement.textContent = resultsData.at(-1).accuracy.toFixed(2);
            tableTimeElement.textContent = formatTime(resultsData.at(-1).time);
    }
}

function removeResults() {
    localStorage.clear();
    resultsTableElement.innerHTML = "";
}

// ----------------------- Result handlers ----------------------- //

// ----------------------- Listeners ----------------------- //

inputBoxElement.addEventListener("keydown", checkWord);
inputBoxElement.addEventListener("keydown", addTimer, {once : true});
restartButtonElement.addEventListener("click", resetManual);
deleteResultsElement.addEventListener("click", removeResults);

focusModeElement.addEventListener("click", () => {
    focusModeElement.classList.toggle("selected");
    const overlayElement = document.getElementById("overlay");
    overlayElement.classList.toggle("overlay-visible");
    document.body.classList.toggle("scroll-disabled");
    window.scrollTo(0, 0); 
});

inputModeElement.addEventListener("click", () => {
    inputModeElement.classList.toggle("selected");
    inputBoxElement.classList.toggle("input-visible");
    inputBoxElement.focus();
});

window.addEventListener("keydown", function(e) {
    if(e.key == " " && e.target == document.body) {
        e.preventDefault();
    }
});

// ----------------------- Listeners ----------------------- //

renderTime(timeRemaining);
attachListenerToTimers();
renderNewQuote();
renderCompleteResults(resultsTableElement, resultsData);

