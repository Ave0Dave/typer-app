const TimeLimit = {
    test : 60,
    short : 60,
    medium: 120,
    long: 180,
    default: 60
}

const Score = function(wpm, errors) {
    return {
        wpm,
        errors
    };
}

const quoteTextElement = document.getElementById("qoute-text");
const currentWPMElement = document.getElementById("current-wpm");
const currentTimeElement = document.getElementById("current-time");
const currentErrorsElement = document.getElementById("current-errors");
const currentAccuracyElement = document.getElementById("current-accuracy");
const inputBoxElement = document.getElementById("input-box");
const restartButtonElement = document.getElementById("restart-button");

let timeRemaining = TimeLimit.test;
let timeElapsed = 0;
let errorsTotal = 0;
let currentAccuracy;
let currentErrors;
let charactersTyped = 0;
let charactersCorrect = 0;
let wordsPerMinute = 0;
let timer;
let scoresArray = [];

restartButtonElement.addEventListener("click", reset);
timeRemaining < 60 ? currentTimeElement.innerText = `00 : ${timeRemaining}` : currentTimeElement.innerText = `0${timeRemaining / 60} : 00`;

function getRandomQuote() {
    return fetch("https://api.quotable.io/random?minLength=100&&maxLength=175")
        .then(response => response.json())
        .then(data => data.content);
}

async function renderNewQuote() {
    const quote = await getRandomQuote();
    quoteTextElement.innerHTML = "";

    quote.split("").forEach((character) => {
        const quoteCharacter = document.createElement('span')
        quoteCharacter.innerText = character;
        quoteTextElement.appendChild(quoteCharacter);
    })
    inputBoxElement.value = null;
}

inputBoxElement.addEventListener("input", handleText);
inputBoxElement.addEventListener("keydown", addTimer, {once : true});
inputBoxElement.addEventListener("keydown", ({key}) => {
    const quoteArray = quoteTextElement.querySelectorAll('span')
    const inputArray = inputBoxElement.value.split("");

    for (let [index, quoteCharacterElement] of quoteArray.entries()) {
        if ((inputArray[index]!= null) && ["Backspace", "Delete"].includes(key)) {
            quoteArray[index + 1].classList.remove("neutral");
            quoteCharacterElement.classList.add("neutral");
        }
        
    }
});

//TODO: Make next character highlight working with deletation
//TODO: Fix weird delay on input
//TODO: Clear word after whitespace
function handleText() {

    const quoteArray = quoteTextElement.querySelectorAll('span')
    const inputArray = inputBoxElement.value.split("");
    currentErrors = 0;
    charactersTyped++;

    for (let [index, quoteCharacterElement] of quoteArray.entries()) {
        const inputCharacter = inputArray[index];

        if ((inputCharacter != null) && ((index + 1) < quoteArray.length)) {
            quoteArray[index + 1].classList.add("neutral");
            quoteCharacterElement.classList.remove("neutral");
        }

        if (inputCharacter == null) {
            quoteCharacterElement.classList.remove('correct')
            quoteCharacterElement.classList.remove('incorrect')

        } else if (inputCharacter === quoteCharacterElement.innerText) {
            quoteCharacterElement.classList.add('correct')
            quoteCharacterElement.classList.remove('incorrect')

        } else {
            quoteCharacterElement.classList.remove('correct')
            quoteCharacterElement.classList.add('incorrect')

            currentErrors++;
        }
        
    }

    charactersCorrect = (charactersTyped - (errorsTotal + currentErrors));
    currentErrorsElement.innerText = `${currentErrors} Errors`;

    currentAccuracy = ((charactersCorrect / charactersTyped ) * 100);
    currentAccuracyElement.innerText = `${Math.round(currentAccuracy)} %`;

    if (inputArray.length === quoteArray.length) {
        renderNewQuote();
        errorsTotal += currentErrors;
    }
}

//TODO: Make WPM color coded
function updateTimer() {
    if (timeRemaining >= 0) {
        let minutes = parseInt(timeRemaining / 60);
        let seconds = parseInt(timeRemaining % 60);
  
        timeRemaining--;
        timeElapsed++;

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        wordsPerMinute = Math.round((((charactersTyped / 5) / timeElapsed) * 60));
        
        currentWPMElement.innerText = `${wordsPerMinute} WPM`;
        
        currentTimeElement.innerText = `${minutes} : ${seconds}`;
    } 
    else {
        let score = new Score(wordsPerMinute, currentAccuracy);
        saveDataToLocalStorage(score);
        resetValues();
    }
}

function addTimer() {
    timer = setInterval(updateTimer, 1000);
}


function resetValues() {  
    inputBoxElement.disabled = true;
    renderNewQuote();
    clearInterval(timer);
    inputBoxElement.addEventListener("keydown", addTimer, {once : true});

    timeRemaining = TimeLimit.test;
    wordsPerMinute = 0;
    timeElapsed = 0;
    currentErrors = 0;
    errorsTotal = 0;
    charactersTyped = 0;
    currentAccuracy = 0;

    currentWPMElement.innerText = "0 WPM";
    timeRemaining < 60 ? currentTimeElement.innerText = `00 : ${timeRemaining}` : currentTimeElement.innerText = `0${timeRemaining / 60} : 00`;
    currentErrorsElement.innerText = "0 Errors";
    currentAccuracyElement.innerText = "0 %";
}

function reset() {
    resetValues();
    inputBoxElement.disabled = false;
}

renderNewQuote();

function saveDataToLocalStorage(data)
{
    scoresArray = JSON.parse(localStorage.getItem('Scores')) || [];
    scoresArray.push(data);

    localStorage.setItem('Scores', JSON.stringify(scoresArray));
}

const scores = JSON.parse(localStorage.getItem('Scores'));

// for (const element of scores) {
//     console.log(element);
// }
