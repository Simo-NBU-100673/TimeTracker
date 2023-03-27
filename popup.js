const buttonStart = document.getElementById('button-start');
const buttonStop = document.getElementById('button-stop');
const buttonClear = document.getElementById('button-clear');
const buttonOption = document.getElementById('button-option');

const tableBodyImportant = document.getElementById('table-important');
const tableBodyOther = document.getElementById('table-other');

const tableFooterImportantSum = document.getElementById('table-footer-important-sum');
const tableFooterOtherSum = document.getElementById('table-footer-other-sum');

//function that gets json from chrome storage and makes it into an html element
const makeElement = (json) => {
    let tr = document.createElement('tr');
    let td1 = document.createElement('td');
    let td2 = document.createElement('td');

    td1.innerHTML = sanitizeDomainName(json.url);
    parseTime(json.milliseconds, function (result) {
        td2.innerHTML = result;
    });
    tr.appendChild(td1);
    tr.appendChild(td2);
    return tr;
}

function sanitizeDomainName(domain){
    //check if json.url starts www. and remove it
    if(domain.startsWith('www.')){
        domain = domain.substring(4);
    }

    //TODO make a CSS class for this
    if(domain.length > 15){
        domain = domain.substring(0,15)+'...';
    }

    return domain;
}

//append the html element to the table
const appendElement = (element, htmlElement) => {
    htmlElement.appendChild(element);
}

//clears the table
const clearTable = (htmlElement) => {
    htmlElement.innerHTML = '';
}

//when the page loads, we want to get the keys from chrome storage
window.onload = init;

function init() {
    const ENUM_KEYS = ['Important', 'Other'];

    chrome.storage.sync.get([ENUM_KEYS[0], ENUM_KEYS[1]], function (items) {
        const KEYS = JSON.parse(JSON.stringify(items));

        processKey(KEYS, ENUM_KEYS[0], tableBodyImportant, tableFooterImportantSum);
        processKey(KEYS, ENUM_KEYS[1], tableBodyOther, tableFooterOtherSum);
    });

    initButtons();
}

function initButtons(){
    chrome.storage.sync.get('Toggle', function (items) {
        items = JSON.parse(JSON.stringify(items));
        if (items.Toggle === 'Working') {
            buttonStart.classList.add('disabled');
            buttonStop.classList.remove('disabled');
        }else {
            buttonStart.classList.remove('disabled');
            buttonStop.classList.add('disabled');
        }
    });
}

function processKey(items, key, tableBody, tableFooterSum) {
    //sort the array by milliseconds
    items[key].sort(function (a, b) {
        return b.milliseconds - a.milliseconds;
    });

    const itemsArray = items[key];
    const sum = sumMilliseconds(itemsArray);
    appendElements(itemsArray, tableBody);
    parseTime(sum, function (result) {
        tableFooterSum.innerHTML = result;
    });
}

function sumMilliseconds(array) {
    let sum = 0;
    array.forEach(item => {
        sum += parseInt(item.milliseconds);
    });
    return sum;
}

function appendElements(array, tableBody) {
    array.forEach(item => {
        const element = makeElement(item);
        appendElement(element, tableBody);
    });
}

function parseTime(milliseconds, callback) {
    getTimeStrategy(function (timeStrategy) {
        let result;
        switch (timeStrategy) {
            case 'days':
                result = Math.round(milliseconds / 86400000);
                callback(result + ' days');
                break;
            case 'hours':
                result = Math.round(milliseconds / 3600000);
                callback(result + ' hours');
                break;
            case 'minutes':
                result = Math.round(milliseconds / 60000);
                callback(result + ' minutes');
                break;
            case 'seconds':
                result = Math.round(milliseconds / 1000);
                callback(result + ' seconds');
                changeExtensionWidth(600);
                break;
            case 'milliseconds':
                callback(milliseconds + ' milliseconds');
                changeExtensionWidth(700);
                break;
            default:
                callback('Invalid time strategy');
                break;
        }
    });
}

function getTimeStrategy(callback) {
    chrome.storage.sync.get('TimeOption', function (items) {
        let timeStrategy = items.TimeOption;
        if (timeStrategy === undefined) {
            timeStrategy = 'minutes';
        }
        callback(timeStrategy);
    });
}

buttonClear.addEventListener('click', function () {
    clearTable(tableBodyImportant);
    clearTable(tableBodyOther);
    tableFooterImportantSum.innerHTML = '';
    tableFooterOtherSum.innerHTML = '';
    clearKeys();
});

function clearKeys(){
    chrome.storage.sync.set({ 'Important': [], 'Other': [] }, function() {
        console.log('Values Cleared');
    });
}

function changeExtensionWidth(size){
    let extension = document.getElementsByClassName('wrapper');
    extension[0].style.width = size + 'px';
}

buttonOption.addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
});

buttonStop.addEventListener('click', function () {
    chrome.storage.sync.get('Toggle', function (items) {
        items = JSON.parse(JSON.stringify(items));

        if (items.Toggle === 'Working') {
            chrome.storage.sync.set({'Toggle': 'Stopped'});
            buttonStart.classList.remove('disabled');
            buttonStop.classList.add('disabled');
        }
    });
});

buttonStart.addEventListener('click', function () {
    chrome.storage.sync.get('Toggle', function (items) {
        items = JSON.parse(JSON.stringify(items));

        if (items.Toggle !== 'Working') {
            chrome.storage.sync.set({'Toggle': 'Working'});
            buttonStart.classList.add('disabled');
            buttonStop.classList.remove('disabled');
        }
    });
});

