function _(id) {
    return document.getElementById(id);
}

var pagesElem = document.querySelector('.pages');
var mainMenuElem = _('main-menu');
var gameElem = _('game');
var taskElem = gameElem.querySelector('.task > td');
var playAgainBtn = gameElem.querySelector('.playAgainBtn');
var answerElem = gameElem.querySelector('.answer');


/** Der PressHandler wird bei Klicken mit Maus am PC oder
 * bei Berührung auf Tochgeräten ausgeführt.
 * 
 * @param elem
 *            Element, das auf Betätigung reagieren soll
 * @param func
 *            Handler, der durch die Press-Betätigung ausgeführt wird
 */
function addPressHandler(elem, handler) {

    function processEvent(elem, evt) {
        //Füge für Berührungsfeedback touching-Klasse hinzu
        elem.classList.add('touching');
        handler(evt);
        //Entferne Berührungsfeedback nach 100ms
        setTimeout(function() {
            elem.classList.remove('touching');
        }, 100);
    }

    elem.addEventListener('touchstart', function(evt) {
        processEvent(elem, evt);
        evt.preventDefault();
        evt.stopPropagation();
        touchEventOccured = true;

    }, true);

    elem.addEventListener('mousedown', function(evt) {
        if (!touchEventOccured) {
            processEvent(elem, evt);
            touchEventOccured = false;
        }

    }, true);
}

var Sound = (function(){
    
    function Sound(){
        
        function playNumber(numStr, finishedHandler) {
            playWord(numStr, finishedHandler);
        }
        
        function playWord(word, finishedHandler) {
            var msg = new SpeechSynthesisUtterance(word);
            msg.rate = 1.1;
            msg.onend = finishedHandler;
            window.speechSynthesis.speak(msg);
        }
        
        function letterizeZwanzigEinsNumber(num){
            var word = '';
            var numLength = num.length;
            
            function getArityWord(arity){
                switch(arity){               
                case 4:
                    return 'tausend';
                case 3:
                    return 'hundert';
                }
            }
            
            function getDigitWord(arity, digitName, twoArityName){
                var res;
                if(arity == 2){
                    res = twoArityName;
                }
                else{
                    res = digitName;
                    if(arity > 2){
                        res += getArityWord(arity);
                    }
                }
                return res;
            }
            
            for(var i = 0; i < numLength; i++){
                var digit = parseInt(num.charAt(i));
                
                var arity = numLength - i;
                switch(digit){
                case 1:
                    if(arity > 2){
                        word += getArityWord(arity);
                    }
                    else if(arity == 2){
                        word += 'zehn';
                    }
                    else{
                        word += 'eins';
                    }
                    break;
                case 2:
                    word += getDigitWord(arity, 'zwei', 'zwanzig');
                    break;
                case 3:
                    word += getDigitWord(arity, 'drei', 'dreißig');
                    break;
                case 4:
                    word += getDigitWord(arity, 'vier', 'vierzig');
                    break;
                case 5:
                    word += getDigitWord(arity, 'fünf', 'fünfzig');
                    break;
                case 6:
                    word += getDigitWord(arity, 'sechs', 'sechzig');
                    break;
                case 7:
                    word += getDigitWord(arity, 'sieben', 'siebzig');
                    break;
                case 8:
                    word += getDigitWord(arity, 'acht', 'achtzig');
                    break;
                case 9:
                    word += getDigitWord(arity, 'neun', 'neunzig');
                    break;
                }
                word += ' ';
                    
            }
            
            return word;
        }
        
        
        
        this.playTask = function(num1, operator, num2){
            
            lastNum1 = num1;
            lastOperator = operator;
            lastNum2 = num2;
            
            num1 = num1.toString();
            var num1Word = letterizeZwanzigEinsNumber(num1);
            num2 = num2.toString();
            var num2Word = letterizeZwanzigEinsNumber(num2);

            var word = num1Word + " " + operator + " " + num2Word;
            playWord(word);
            
        } 
        
        this.playAgain = function(){
            this.playTask(lastNum1, lastOperator, lastNum2);
            
        }
        
    }
    
    return new Sound();
}());

var rightResult;
var rightResultStr;

var wrongAnswerOccured;
var wrongAnswerTimeStamp;

var touchEventOccured = false;

var tasksPut = 0;
var gameStartTimeStamp;

var options = {
    from1 : 1,
    to1 : 100,
    from2 : 1,
    to2 : 100,
    plus : true,
    minus : false,
    multiply : false,
    divide : false,
    numTasks : 10,
    fullscreen : false,
    auditive : false
};


function loadOptions(){
    var optionsJson = localStorage.getItem("options");
    if(optionsJson){
        var savedOptions = JSON.parse(optionsJson);
        
        //transfer newly introduced options, that were not saved 
        for(var propertyKey in options){
            if(typeof savedOptions[propertyKey] == 'undefined'){
                savedOptions[propertyKey] = options[propertyKey];
            }
        }
        options = savedOptions;
    }
}

function saveOptions(){
    var optionsJson = JSON.stringify(options);
    localStorage.setItem("options", optionsJson);
}


function bindOptions(){
    
    try{
        loadOptions();
    }
    catch(e){
        
    }
    
    function bindInputElem(id){
        var inputElem = _(id);
        inputElem.value = options[id];
        inputElem.oninput = function(e){
            var id = e.target.getAttribute("id");
            options[id] = e.target.value;
            saveOptions();
        };
    }
        
    bindInputElem("from1");
    bindInputElem("to1");
    bindInputElem("from2");
    bindInputElem("to2");
    
    function bindCheckboxElem(id){
        var checkboxElem = _(id);
        checkboxElem.checked = options[id];
        checkboxElem.onchange = function(e){
            var id = e.target.getAttribute("id");
            options[id] = e.target.checked;
            saveOptions();
        }
    }
    
    bindCheckboxElem("plus");
    bindCheckboxElem("multiply");
    bindCheckboxElem("minus");
    bindCheckboxElem("divide");
    bindCheckboxElem("fullscreen");
    bindCheckboxElem("auditive");
      
}


var numBtns = document.getElementsByClassName('numBtn');
for (var i = 0; i < numBtns.length; i++) {
    addPressHandler(numBtns[i], onNumBtnPressed);
}


var curTaskParts = [];

addPressHandler(playAgainBtn, function(){
    Sound.playAgain()
});

function startGame(){
    
    console.log('startGame');
        
    if(options.fullscreen){
        if(document.documentElement.webkitRequestFullscreen){
            document.documentElement.webkitRequestFullscreen();
        }
        else if(document.documentElement.requestFullscreen){
            document.documentElement.requestFullscreen();
        }
    }

    answerElem.innerHTML = "";
    putNewTask();

    wrongAnswerOccured = false;
    gameStartTimeStamp = new Date();
    tasksPut = 0;

    window.onkeydown = function(e){
        console.log(e.keyCode);
        if(e.keyCode >= 96 && e.keyCode <= 105){ //numpad-tasten von 0 bis 9
            processNumberInput(e.keyCode - 96);

        }
    }
    
    if(options['auditive']){
        gameElem.classList.add('auditive');
    }
    else{
        gameElem.classList.remove('auditive');
    }
    
    var queryTerm = 
        '#game:not(.auditive) .answerWrapper.simple .answer,' + 
        '#game.auditive .answerWrapper.auditive .answer';
    answerElem = gameElem.querySelector(queryTerm);
    
    if(location.hash != '#game'){
        var hashChangeListener = window.onhashchange;
        window.onhashchange = null;
        location.hash = 'game';

        setTimeout(function(e){
            window.onhashchange = hashChangeListener;
        }, 200);
        
    }
    
  
    
}

function putNewTask() {
        
    var operators = [];
    if(options['plus']){
        operators.push("plus");
    }
    if(options['minus']){
        operators.push("minus");
    }
    if(options['multiply']){
        operators.push("multiply");
    }
    if(options['divide']){
        operators.push("divide");
    }
    
    //würfele eine Zahl, die der Anzahl der gewählten Operatoren entspricht
    var randomIndex = getRandomNumber(0, operators.length - 1);
    
    var operator = operators[randomIndex];
    console.log("random operator: " + operator);
    
    var num1 = getRandomNumber(options['from1'], options['to1']);
    var num2 = getRandomNumber(options['from2'], options['to2']);
    console.log("random numbers: " + num1 + ", " + num2);
    
   
    
    switch(operator){
    
    case "plus":
        rightResult = num1 + num2;
        taskElem.innerHTML = num1 + ' + ' + num2;
        Sound.playTask(num1, operator, num2);
        break;
    
    case "minus":
        var minuend, subtrahent;
        if(num1 > num2){
            minuend = num1;
            subtrahent = num2;
        }
        else{
            minuend = num2;
            subtrahent = num1;
        }
        
        Sound.playTask(minuend, operator, subtrahent);
        
        rightResult = minuend - subtrahent;
        taskElem.innerHTML = minuend + ' - ' + subtrahent;
        
        break;
    
    case "multiply":
        operator = "mal";
        Sound.playTask(num1, operator, num2);
        rightResult = num1 * num2;
        taskElem.innerHTML = num1 + ' &times; ' + num2;
        break;
    
    case "divide":
        operator = "durch";
        var dividend, divisor;
        if(num1 > num2){
            dividend = num1;
            divisor = num2;
        }
        else{
            dividend = num2;
            divisor = num1;
        }
        Sound.playTask(dividend, operator, divisor);
        rightResult = dividend / divisor;
        taskElem.innerHTML = dividend + ' &divide; ' + divisor;
        break;
    
    }
    
    rightResultStr = new String(rightResult);
    styleGoodAnswer();
    tasksPut++;
}

function onNumBtnPressed(evt) {
    console.log(evt.currentTarget.innerHTML);
    var number = parseInt(evt.currentTarget.innerHTML);
    processNumberInput(number);
}

function styleWrongAnswer(){
    answerElem.style.color = 'white';
    answerElem.style.backgroundColor = 'red';
}

function styleGoodAnswer(){
    answerElem.style.color = 'black';
    answerElem.style.backgroundColor = 'white';
}

/**
 * Verarbeitet die Eingabe einer Zahl. 
 */
function processNumberInput(number) {
    
    if(wrongAnswerOccured){
        //wenn die eingegebene Antwort bereits falsch war
        //und mehr als 500ms seitdem vergangen sind, lösche 
        //bisherige Eingabe um automatisch neue, richtige Antwort zu ermöglichen
        var now = new Date();
        var elapsedMs = now.getTime() - wrongAnswerTimeStamp.getTime();
    
        if(elapsedMs > 500){
            answerElem.innerHTML = "";
            styleGoodAnswer();
            wrongAnswerOccured = false;
        }
        
    }
    var rightResultStr = rightResult.toString();
    
    answerElem.innerHTML = answerElem.innerHTML + number;

    if (rightResultStr == answerElem.innerHTML) {
        if(tasksPut < options.numTasks){
            putNewTask();
            answerElem.innerHTML = "";
        }
        else{
            finishGame();
        }        
    } 
    else {
        var rightResultBeginning = rightResultStr.substr(0, answerElem.innerHTML.length);
        if (rightResultBeginning != answerElem.innerHTML) {
            styleWrongAnswer();
            wrongAnswerOccured = true;
            wrongAnswerTimeStamp = new Date();
        }
    }
}

function getRandomNumber(from, to) {
    var min = parseInt(from);
    var max = parseInt(to);
     return Math.floor(Math.random() * (max - min + 1)) + min;
}

function finishGame(){
    
    var ellapsed = new Date().getTime() - gameStartTimeStamp.getTime();
    var ellapsedDate = new Date(ellapsed);
    
    window.history.back();
    document.querySelector("#menu .dialog").classList.add("showing");
    var minutes = ellapsedDate.getMinutes();
    var seconds = ellapsedDate.getSeconds();
    if(seconds < 10){
        seconds = '0' + seconds;
    }
    _('lastGameTime').innerHTML = minutes + ":" + seconds;
        
    setTimeout(function(){
        document.querySelector("#menu .dialog").classList.remove("showing");
    }, 2000);

}

function showPage(id){
  
    var pageElem = _(id);
    if(!pageElem){
        pageElem = mainMenuElem;
    }
    pagesElem.insertBefore(pageElem, pagesElem.firstChild);
    
    if(id == 'game'){
        startGame();
    }
}



var clearBtn = _('clearBtn');

addPressHandler(clearBtn, function() {
    answerElem.innerHTML = "";
    styleGoodAnswer();
});

var btnStart = _('btnStart');
addPressHandler(btnStart, function(evt){
    evt.preventDefault();
    showPage('game');
});

bindOptions();

if(window.location.hash){
    var navToken = location.hash.substring(1);
    showPage(navToken);
}

window.onhashchange = function(e){
    var navToken = location.hash.substring(1);
    showPage(navToken);
};

