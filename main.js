//Player Info
let player = {
    name: "player",
    attempt: 0,
    number: [],
    guessed: false
}

//PC Info
let pc = {
    name: "Computer",
    attempt: 0,
    number: [],
    guessed: false
}

let gameMode = 1; //Easy Mode: 1, Hard Mode: 2
let turn; //Number of turn
let guessList = []; //[guessedNum, feedback]

let possibleDigits = new Set([1,2,3,4,5,6,7,8,9]); //Remaining possible digits

////////////////////////////////////////////////////////////////////////
//   Logic Functions
////////////////////////////////////////////////////////////////////////

//Generate secret number for PC
function getPcNum() {
    return genRandNum();
}

//generate random 3 digit numbers
function genRandNum() {
    let num = [];
    while (num.length<3) {
        let ranNum = Math.floor(Math.random() * 9)+1;
        if(!num.includes(ranNum)) {
            num.push(ranNum);
        }
    }
    return num;
}

//check number, only 1-9, 3 digit, no repeat number
function checkNum(num) {
    const regex = /^[1-9]{3}$/;
    if(regex.test(num.join(''))&&noRepeatNum(num)) {
        return true;
    } else {
        return false;
    }
}

//check repeat numbers
function noRepeatNum(num) {
    let noRepeat = true;
    for(let i=0;i<num.length;i++) {
        for(let j=0;j<num.length;j++) {
            if(i!=j) {
                if(num[i] == num[j]) {
                    noRepeat = false;
                }
            }
        }
    }
    return noRepeat;
}

// Generate firt turn - Player: 0, Pc: 1
function getFirstTurn() {
    return Math.random() < 0.5 ? 1 : 0;
}

//Check if the guessNum is valid from previous feedback
function checkValidFeedbacks(guessNum) {
    let valid = true;
    for(let guess of guessList) {
        if(!arrayEqual(getFeedback(guessNum, guess[0]), guess[1])) {
            valid = false;
        }
    }
    return valid;
}

//Geerate guess number for PC
function generatePcGuessNum() {
    if(gameMode==1) {
        return generateSimpleGuess()
    }
    if(gameMode==2) {
        const turn = guessList.length + 1;

        if (turn === 1) return [1,2,3];
        if (turn === 2) return [4,5,6];
        if (turn === 3) return generateTurn3Guess();
        return generateTurn4PlusGuess();
    }
    
}

// Generate guess number for easy mode
function generateSimpleGuess() {
    let guessNum = genRandNum();
    while(!checkValidFeedbacks(guessNum)) {
        guessNum = genRandNum();
    }
    console.log(guessNum)
    return guessNum;
}

//Place digit in first valid empty position without violating previous feedbacks
function placeDigitInFirstEmpty(digit, guessNum) {
    for (let i = 0; i < 3; i++) {
        if (guessNum[i] === "" && isPlacementValid(i, digit, guessNum)) {
            guessNum[i] = digit;
            return true;
        }
    }
    return false; // could not place
}

//Generate guess number for 3rd turn
function generateTurn3Guess() {
    const guessNum = ["", "", ""];

    for (let [prevGuess, feedback] of guessList.slice(0, 2)) {
        for (let i = 0; i < 3; i++) {
            const digit = prevGuess[i];
            if (feedback[i] === "+") {
                if (isPlacementValid(i, digit, guessNum)) {
                    guessNum[i] = digit;
                }
            } else if (feedback[i] === "-") {
                placeDigitInFirstEmpty(digit, guessNum);
            }
        }
    }

    // Fill remaining empty positions with 7,8,9
    for (let i = 0; i < 3; i++) {
        if (guessNum[i] === "") {
            for (let d of [7, 8, 9]) {
                if (!guessNum.includes(d) && isPlacementValid(i, d, guessNum)) {
                    guessNum[i] = d;
                    break;
                }
            }
        }
    }
    if(!checkNum(guessNum)) {
        while(!checkValidFeedbacks(guessNum)) {
            guessNum = genRandNum();
        }
    }
    return guessNum;
}

//Generate guess number for 4+ turn
function generateTurn4PlusGuess() {
    const guessNum = ["", "", ""];

    const [lastGuess, lastFeedback] = guessList[guessList.length - 1];

    // --- STEP 1: HANDLE LAST GUESS FIRST ---
    const usedDigits = new Set();

    for (let i = 0; i < lastFeedback.length; i++) {
        const symbol = lastFeedback[i];
        if (symbol !== "+" && symbol !== "-") continue;

        // Find first unused digit from last guess
        let digit = null;
        for (let d of lastGuess) {
            if (!usedDigits.has(d) && possibleDigits.has(d)) {
                digit = d;
                break;
            }
        }
        if (digit === null) continue;

        usedDigits.add(digit);

        if (symbol === "+") {
            // Place in the same position if valid
            for (let pos = 0; pos < 3; pos++) {
                if (lastGuess[pos] === digit &&
                    guessNum[pos] === "" &&
                    isPlacementValid(pos, digit, guessNum)) 
                {
                    guessNum[pos] = digit;
                    break;
                }
            }
        }

        if (symbol === "-") {
            // Place in first empty position that is not same position as before
            for (let pos = 0; pos < 3; pos++) {
                if (guessNum[pos] === "" &&
                    lastGuess[pos] !== digit &&
                    isPlacementValid(pos, digit, guessNum)) 
                {
                    guessNum[pos] = digit;
                    break;
                }
            }
        }
    }

    // --- STEP 2: HANDLE FIRST TWO GUESSES ---
    const firstTwo = guessList.slice(0, 2);

    for (let [prevGuess, feedback] of firstTwo) {
        const neededCount = feedback.length;
        let inserted = 0;

        for (let digit of prevGuess) {
            if (inserted === neededCount) break;
            if (!possibleDigits.has(digit)) continue;
            if (guessNum.includes(digit)) continue;

            if (placeDigitIfPossible(digit, guessNum)) {
                inserted++;
            }
        }
    }

    // --- STEP 3: FILL REMAINING WITH 7, 8, 9 ---
    for (let pos = 0; pos < 3; pos++) {
        if (guessNum[pos] === "") {
            for (let d of [7, 8, 9]) {
                if (!guessNum.includes(d) && possibleDigits.has(d)) {
                    if (isPlacementValid(pos, d, guessNum)) {
                        guessNum[pos] = d;
                        break;
                    }
                }
            }
        }
    }

    if(!checkNum(guessNum)) {
        while(!checkValidFeedbacks(guessNum)) {
            guessNum = genRandNum();
        }
    }
    return guessNum;
}

// Update possible digits after feedback
function updatePossibleDigits(guess, feedback) {
    const hasMatch = feedback.includes("+") || feedback.includes("-");
    if (!hasMatch) {
        // No matches → remove all digits in this guess
        for (let d of guess) possibleDigits.delete(d);
    }
}

// Check if placing a digit is valid
function isPlacementValid(pos, digit, guessNum) {
    if (!possibleDigits.has(digit)) return false;
    if (guessNum.includes(digit)) return false;

    const test = [...guessNum];
    test[pos] = digit;

    for (let [prevGuess, feedback] of guessList) {
        if (!matchesFeedback(test, prevGuess, feedback)) return false;
    }

    return true;
}

// Check if a candidate guess matches previous feedback
function matchesFeedback(candidate, guess, feedback) {
    const plusNeeded = feedback.filter(f => f === "+").length;
    const minusNeeded = feedback.filter(f => f === "-").length;

    // Count exact matches
    let plus = 0;
    for (let i = 0; i < 3; i++) {
        if (candidate[i] === guess[i]) plus++;
    }
    if (plus > plusNeeded) return false;

    // Count total shared digits
    let shared = candidate.filter(d => guess.includes(d)).length;
    let minus = shared - plus;
    if (minus > minusNeeded) return false;

    return true;
}

//Place and check if the placement is valid
function placeDigitIfPossible(digit, guessNum) {
    for (let i = 0; i < 3; i++) {
        if (guessNum[i] === "" && isPlacementValid(i, digit, guessNum)) {
            guessNum[i] = digit;
            return true;
        }
    }
    return false;
}

// Call after receiving feedback
function processFeedback(guess, feedback) {
    guessList.push([guess, feedback]);
    updatePossibleDigits(guess, feedback);
}

// Checking if two arrays are equal
function arrayEqual(arr1, arr2) {
    if(arr1.length!=arr2.length) {
        return false;
    }
    for(let i=0;i<arr1.length;i++) {
        if(arr1[i]!=arr2[i]) {
            return false
        }
    }
    return true
}

// Generating the feedback from the guessing number
function getFeedback(targetNum, guessedNum) {
    let feedback = [];
    for(let i=0;i<3;i++) {
        if(targetNum.includes(guessedNum[i])) {
            if(targetNum[i]==guessedNum[i]) {
                feedback.push("+");
            } else {
                feedback.push("-");
            }
        }
    }
    return feedback;
}

//Check if feedback is valid
function checkFeedback(feedback, guessedReselt) {
    return arrayEqual(feedback.sort(), guessedReselt.sort())
}

////////////////////////////////////////////////////////////////////////
//   UI Functions
////////////////////////////////////////////////////////////////////////

//Toggle popup, (hidden)
function togglePopUp(popUp) {
    popUp.classList.toggle("hidden");
}

//toggle game mode targeted buttons
function selectGameMode(ele) {
    if(ele.id=="easyMode") {
        ele.classList.add("targeted");
        let hardMode = document.getElementById("hardMode");
        hardMode.classList.remove("targeted");
    } else if(ele.id=="hardMode") {
        ele.classList.add("targeted");
        let easyMode = document.getElementById("easyMode");
        easyMode.classList.remove("targeted");
    }
}

// Generating number keys
function generateKeyNum() {
    let numKeys = document.getElementById("inputKeys");
    numKeys.replaceChildren();

    for(let i=1;i<=9;i++) {
        let numButton = document.createElement("div");
        numButton.classList.add("numButton");
        numButton.id = i
        numButton.innerHTML = i;
        numButton.addEventListener('click', inputNum);
        numKeys.append(numButton);
    }
}

//Generate input keys for feedback, "+" "-"
function generateFeedbackKeys() {
    let feedbackKeys = document.getElementById("inputKeys");
    feedbackKeys.replaceChildren();

    let plusButton = document.createElement("div");
        plusButton.classList.add("plusButton");
        plusButton.id = "plusBtn"
        plusButton.innerHTML = "+";
        plusButton.addEventListener('click', inputNum);
        feedbackKeys.append(plusButton);

    let minusButton = document.createElement("div");
        minusButton.classList.add("minusButton");
        minusButton.id = "minusBtn"
        minusButton.innerHTML = "-";
        minusButton.addEventListener('click', inputNum);
        feedbackKeys.append(minusButton);

}

//Generating function Keys - Delete, Enter
function generateFunctionKeys() {
    let functionKeys = document.getElementById("functionKeys");

    let deleteBtn = document.createElement("div");
    deleteBtn.innerHTML = "Delete";
    deleteBtn.id = "delete";
    functionKeys.append(deleteBtn);
    deleteBtn.addEventListener('click', removeNum);

    let enterBtn = document.createElement("div");
    enterBtn.id = "enter";
    enterBtn.innerHTML = "Enter";
    enterBtn.addEventListener('click', enterNum);
    functionKeys.append(enterBtn);
}

// Generating PC's guess number
function generateGuessNum() {
    let pcDisplayBox = document.getElementById("pcDisplayBox");
    pc.number = getPcNum();

    let pcHeader = pcDisplayBox.getElementsByClassName("displayHeader")[0];
    pc.number.forEach(_=> {
        let numBox = document.createElement("div");
        numBox.innerHTML = "?";
        pcHeader.append(numBox);
    })
}

// Toggle player guess number popup
function getPlayerGuessNum() {
    let numPopUp = document.getElementById("numPopUp");
    numPopUp.classList.remove("hidden");
}

// Generate header for player's guess number
function generatePlayerHeader() {
    let playerHeader = document.getElementById("playerDisplayBox").getElementsByClassName("displayHeader")[0];

    player.number.forEach(num=> {
        let numBox = document.createElement("div");
        numBox.innerHTML = num;
        playerHeader.append(numBox);
    })
}

//Display the number input from number keys
function inputNum(ele) {

    let currentRow = document.getElementsByClassName("current")[0];

    if (currentRow.parentElement.parentElement.id == "pcDisplayBox") {
        let targetedBox = currentRow.getElementsByClassName("targeted")[0];
        let symbol = ele.target.innerHTML;     // "+" or "-"
        targetedBox.innerHTML = symbol;

        let nextTarget = targetedBox.nextElementSibling;
        if(nextTarget) {
            targetedBox.classList.remove("targeted");
            nextTarget.classList.add("targeted");
        }
    } else if(currentRow.parentElement.parentElement.id=="playerDisplayBox") {
        let targetedBox = currentRow.getElementsByClassName("targeted")[0];
        targetedBox.innerHTML = ele.target.id;    

        let nextTarget = targetedBox.nextElementSibling
        if(nextTarget) {
            targetedBox.classList.toggle("targeted");
            nextTarget.classList.toggle("targeted");
        }
    }
}

//Remove number input after pressing delete button
function removeNum() {
    let currentRow = document.getElementsByClassName("current")[0];
    if(currentRow.parentElement.parentElement.id=="playerDisplayBox") {
        let targetedBox = currentRow.getElementsByClassName("targeted")[0];

        if(targetedBox.innerHTML!="") {
            targetedBox.innerHTML="";
        } else {
            let prevTarget = targetedBox.previousElementSibling;
            if(prevTarget) {
                targetedBox.classList.toggle("targeted");
                prevTarget.classList.toggle("targeted");
            }
        }
    }
    if(currentRow.parentElement.parentElement.id=="pcDisplayBox") {
        let targetedBox = currentRow.getElementsByClassName("targeted")[0];

        if(targetedBox.innerHTML=="") {
            let prevTarget = targetedBox.previousElementSibling;
            if(prevTarget) {
                targetedBox.classList.toggle("targeted");
                prevTarget.classList.toggle("targeted");
            }
        } else {
            targetedBox.innerHTML="";
        }
    }
}

// Update popup msgssage for each turn
function turnPopUp() {
    let turnPopUp = document.getElementById("msgPopUp");
    let msgDiv = turnPopUp.getElementsByClassName("msg")[0];
    if(turn%2==0) {
        msgDiv.innerHTML = `${player.name}'s Turn!`  
    } else {
        msgDiv.innerHTML = `${pc.name}'s Turn!`
    }
    togglePopUp(turnPopUp);
    setTimeout(() => {
        if(!turnPopUp.classList.contains("hidden")) {
            togglePopUp(turnPopUp);
        }
    }, 3000);
}

// generating row for guessing number
function createGuessRow(displayBox) {
    let guessRow = document.createElement("div");
    guessRow.classList.add("guessRow", "current");
    displayBox.append(guessRow);
    let guessNums = document.createElement("div");
    guessNums.classList.add("guessNums");
    guessRow.append(guessNums)
    let guessResults = document.createElement("div");
    guessResults.classList.add("guessResults");
    guessRow.append(guessResults)
    for(let i=0;i<3;i++) {
        let guessNum = document.createElement("div");
        guessNum.classList.add(i);
        guessNums.append(guessNum);
        
    }
    for(let i=0;i<3;i++) {
        let guessResult = document.createElement("div");
        guessResult.classList.add(i);
        guessResults.append(guessResult);
    }

    if(turn%2==0) {
        guessNums.firstChild.classList.add("targeted");
    } else {
        guessResults.firstChild.classList.add("targeted");
        startPcTurn();
    }
}

// Generate and display pc guessing number
function startPcTurn() {
    setTimeout(() => {
        let guessNum = generatePcGuessNum(); // Need to change to guessing logic
        let currentRow = document.getElementsByClassName("current")[0];
        let guessNums = currentRow.getElementsByClassName("guessNums")[0];
        let guessNumsDivs = guessNums.getElementsByTagName("div");
        for(let i=0; i< guessNumsDivs.length;i++) {
            guessNumsDivs[i].innerHTML = guessNum[i];
        }
    enterNum();
    }, 1000);
    
}

// Hide turn message popup when popup button is pressed
function toggleMsgPopUp(){
    let msgPopUp = document.getElementById("msgPopUp");
    togglePopUp(msgPopUp);
}

//Update attemps in player's info
function updateAttempt() {
    let attemptDisplay = document.getElementById("attempts");
    attemptDisplay.innerHTML = `Attempts: ${player.attempt}`;
}

////////////////////////////////////////////////////////////////////////
//   Game Flow
////////////////////////////////////////////////////////////////////////

//Game Start - display start popup for initial input
function initGame() {
    let startPopUp = document.getElementById("startPopUp");
    togglePopUp(startPopUp);

    turn = getFirstTurn();
}

// Get user Input from start Popup
function submitGame() {
    let name = document.getElementById("name").value;
    let startPopUp = document.getElementById("startPopUp");

    if(name.length<4) {
        let alerMsg = startPopUp.getElementsByClassName("alertMsg")[0];
        alerMsg.innerHTML = "Invalid name. Please enter a name with 4 to 20 characters.";
    } else {
        player.name = name;
        
        if(document.getElementById("easyMode").className=="targeted") {
            gameMode = 1;
        } else if(document.getElementById("hardMode").className=="targeted") {
            gameMode = 2;
        }
        initDisplay();        
        togglePopUp(startPopUp);
    }
}

//Create initial display
function initDisplay() {
    let nameDisplay = document.getElementById("playerName");
    nameDisplay.innerHTML = player.name;

    let attemptDisplay = document.getElementById("attempts");
    attemptDisplay.innerHTML = `Attempts: ${player.attempt}`;

    let playerNameHeader = document.getElementById("playerNameHeader");
    playerNameHeader.innerHTML = player.name;
    let pcNameHeader = document.getElementById("pcNameHeader");
    pcNameHeader.innerHTML = pc.name;

    generateFunctionKeys(); //generate delete and enter keys
    generateGuessNum(); // get PC guess number
    getPlayerGuessNum(); // get Player's guess number
}

// Display popup for player's guess number
function getPlayerGuessNum() {
    let numPopUp = document.getElementById("numPopUp");
    numPopUp.classList.remove("hidden");
}

// Get player guess number and start round
function submitNum() {
    let guessNum = document.getElementById("guessNum").value.split("");
    let numPopUp = document.getElementById("numPopUp");

    if(checkNum(guessNum)) {
        player.number = guessNum.map((e)=>parseInt(e));
        generatePlayerHeader();
        togglePopUp(numPopUp);
        startRound();
    } else {
        let alertMsg = numPopUp.getElementsByClassName("alertMsg")[0];
        alertMsg.innerHTML = "Invalid number. Please enter a 3 digit number from 1 - 9, and no repeat numbers.";
    }
}

//Start of the round
function startRound() {
    turnPopUp();
    let displayBox;
    if(turn%2==0) {
        displayBox = document.getElementById("playerDisplayBox");
        generateKeyNum(); //generate number keys
    } else {
        displayBox = document.getElementById("pcDisplayBox");
        generateFeedbackKeys();
    }

    let guessNumContainer = displayBox.getElementsByClassName("guessNumContainer")[0];
    createGuessRow(guessNumContainer);
}

//When the enter key is pressed, check input
function enterNum() {
    let currentRow = document.getElementsByClassName("current")[0];

    let guessNums = currentRow.getElementsByClassName("guessNums")[0];
    let guessedNum = [];
    let guessNumsDivs = guessNums.getElementsByTagName("div");
    for(let i=0; i< guessNumsDivs.length;i++) {
        guessedNum.push(parseInt(guessNumsDivs[i].innerHTML));
    }
    if(checkNum(guessedNum)) {
        for(let i=0; i< guessNumsDivs.length;i++) {
            if(guessNumsDivs[i].classList.contains("targeted")) {
                guessNumsDivs[i].classList.remove("targeted")
            }
            guessNumsDivs[i].classList.add("submitted");
        }

        let targetNum;
        if(turn%2==0) { //Player
            targetNum = pc.number;
            let feedback = getFeedback(targetNum, guessedNum);
            let guessResults = currentRow.getElementsByClassName("guessResults")[0];
            let feedbackDivs = guessResults.getElementsByTagName("div");
            for(let i=0; i< feedbackDivs.length;i++) {
                if(feedback[i]) {
                    feedbackDivs[i].innerHTML = feedback[i];
                }   
                switch(feedbackDivs[i].innerHTML) {
                    case "+":
                        feedbackDivs[i].classList.add("plus");
                        break;
                    case "-":
                        feedbackDivs[i].classList.add("minus");
                        break;
                    default:
                        feedbackDivs[i].classList.add("empty");
                        break;
                }
            }
            if(arrayEqual(feedback, ["+","+","+"])) {
                if(turn%2==0) {
                    player.guessed = true;
                } else {
                    pc.guessed = true;
                }
                if(checkWinner()) {
                    endGame();
                }
                
            } else {
                if(turn%2==0) {
                    player.attempt+=1;
                } else {
                    pc.attempt+=1;
                }
                updateAttempt();

                if(player.attempt>=7&&pc.attempt>=7) {
                    endGame();
                } else {
                    turn += 1;
                    currentRow.classList.remove("current");
                    startRound();
                }
            }
        } else { //pc
            targetNum = player.number;
            let guessNums = currentRow.getElementsByClassName("guessNums")[0];
            let guessedNum = [];
            let guessNumsDivs = guessNums.getElementsByTagName("div");
            for(let i=0; i< guessNumsDivs.length;i++) {
                guessedNum.push(parseInt(guessNumsDivs[i].innerHTML));
            }

            let guessResults = currentRow.getElementsByClassName("guessResults")[0];
            let guessedReselt = [];
            let guessResultsDivs = guessResults.getElementsByTagName("div");
            for(let i=0; i< guessResultsDivs.length;i++) {
                if(guessResultsDivs[i].innerHTML) {
                    guessedReselt.push(guessResultsDivs[i].innerHTML);
                }
            }

            let feedback = getFeedback(targetNum, guessedNum);
            if(checkFeedback(feedback, guessedReselt)) {

                for(let i=0; i< guessResultsDivs.length;i++) {
                    if(guessResultsDivs[i].classList.contains("targeted")) {
                        guessResultsDivs[i].classList.remove("targeted")
                    }
                    switch(guessResultsDivs[i].innerHTML) {
                        case "+":
                            guessResultsDivs[i].classList.add("plus");
                            break;
                        case "-":
                            guessResultsDivs[i].classList.add("minus");
                            break;
                        default:
                            guessResultsDivs[i].classList.add("empty");
                            break;
                    }
                    
                }
                processFeedback(guessedNum, feedback);
                if(arrayEqual(feedback, ["+","+","+"])) {
                    if(turn%2==0) {
                        player.guessed = true;
                    } else {
                        pc.guessed = true;
                    }
                    if(checkWinner()) {
                        endGame();
                    }
                    
                } else {
                    if(turn%2==0) {
                        player.attempt+=1;
                    } else {
                        pc.attempt+=1;
                    }
                    updateAttempt();

                    if(player.attempt>=7&&pc.attempt>=7) {
                        endGame();
                    } else {
                        turn += 1;
                        currentRow.classList.remove("current");
                        startRound();
                    }
                }
            } else {
                for(let i=0; i< guessResultsDivs.length;i++) {
                    if(guessResultsDivs[i].classList.contains("targeted")) {
                        guessResultsDivs[i].classList.remove("targeted");              
                    }
                    guessResultsDivs[i].innerHTML = "";
                    guessResultsDivs[i].classList.add("error"); 
                    setTimeout(() => {
                            guessResultsDivs[i].classList.remove("error");
                        }, 1000); 
                    
                    
                }
                guessResultsDivs[0].classList.add("targeted")
            }
            
        }
    } else {
        for(let i=0; i< guessNumsDivs.length;i++) {
            if(guessNumsDivs[i].classList.contains("targeted")) {
                guessNumsDivs[i].classList.remove("targeted");              
            }
            guessNumsDivs[i].innerHTML = "";
            guessNumsDivs[i].classList.add("error"); 
            setTimeout(() => {
                    guessNumsDivs[i].classList.remove("error");
                }, 1000); 
        }
        guessNumsDivs[0].classList.add("targeted")
    }
}

//Check winner
function checkWinner() {
    if((player.guessed&&player.attempt<=pc.attempt)||(pc.guessed&&player.attempt>=pc.attempt)) {
        return true;
    } 
    return false;
}

// End of Game
function endGame() {
    let winner; //player:0, pc:1, draw: 2
    if(player.guessed&&pc.guessed||(!player.guessed&&!pc.guessed)) {
        winner = 2
    } else if(pc.guessed) {
        winner = 1
    } else {
        winner = 0
    }
    let endGamePopUp = document.getElementById("gameEndPopUp");

    let endGameMsg = endGamePopUp.getElementsByClassName("endMsg")[0];
    if(winner==2) {
        endGameMsg.innerHTML = `It's a draw! The correct guess is ${pc.number}`
    } else if(winner==1) {
        endGameMsg.innerHTML = `${pc.name} wins! It takes ${pc.attempt+1} attemps to guess the number! The correct guess is ${pc.number}`;
    } else {
        endGameMsg.innerHTML = `${player.name} wins! It takes ${player.attempt+1} attemps to guess the number!`;
    }
    
    togglePopUp(endGamePopUp)
}

//Reload game
function restartGame() {
    location.reload();
}

initGame()