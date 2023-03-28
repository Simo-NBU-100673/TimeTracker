const timeSelection = document.getElementById('time-interval');
const domainTableBody = document.getElementById('table-important');
const addNewDomainButton = document.getElementById('add-new-domain');
const addNewDomainInput = document.getElementById('input-field');
const timeIntervalSelectInput = document.getElementById('time-interval');
const toggle = document.getElementById('switch');
const timePeriodInput = document.getElementById('range-input');
let datePeriod;

window.onload = init;

function init(){
    initTimeSelection();
    initToggle();
    setEventListenerRangeInput();

    chrome.storage.sync.get(['Important', 'Other'], function (items) {
        items = JSON.parse(JSON.stringify(items));
        const array = items.Important;

        initializeTable(domainTableBody, array);

        let editButtons = document.querySelectorAll('.fa-edit');
        addEditButtonListener(editButtons);

        let removeButtons = document.querySelectorAll('.fa-trash-alt');
        addRemoveButtonListener(removeButtons);

        setAddNewDomainButtonListener();
    });
}

function setEventListenerRangeInput() {
    timePeriodInput.addEventListener('change', () => {
        const [start, end = start] = timePeriodInput.value.split(' - ').map(parseDate);
        if (start.toString() === "Invalid Date" || end.toString() === "Invalid Date") {
            const today = new Date();
            const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            datePeriod = { START: today, END: oneWeekLater };
        } else {
            datePeriod = { START: start, END: end };
        }

        //create the chart
        buildChart(datePeriod);
    });
}

//function that gets date in format DD/MM/YYYY and returns it in Date object
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
}

function initToggle(){
    chrome.storage.sync.get(['Toggle'], function (items) {
        items = JSON.parse(JSON.stringify(items));
        toggle.value = items.Toggle;
    });

    toggle.addEventListener('change', function () {
        const toggleValue = toggle.value;
        setToggle(toggleValue);
    });
}

function setToggle(toggleValue){
    chrome.storage.sync.set({ 'Toggle': toggleValue }, function() {
        console.log('Value of "Toggle" key set in Chrome storage.');
    });
}

function initTimeSelection(){
    chrome.storage.sync.get(['TimeOption'], function (items) {
        //check if the key exists
        if(!items.hasOwnProperty('TimeOption')){
            //if it doesn't exist, set it to 0
            items.TimeOption = 'minutes';
        }

        items = JSON.parse(JSON.stringify(items));
        timeIntervalSelectInput.value = items.TimeOption;
    });
}


function initializeTable(domainTableBody, array) {
    if(array.length === 0){
        return;
    }

    array.forEach(item => {
        const tableRow = buildTableRow(item.url);
        appendTableRow(domainTableBody, tableRow);
    });
}

function buildTableRow(url) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');

    td.innerText = url;
    tr.appendChild(td);

    const td2 = document.createElement('td');
    const i = document.createElement('i');
    i.classList.add('fas', 'fa-edit');
    td2.appendChild(i);

    const i2 = document.createElement('i');
    i2.classList.add('fas', 'fa-trash-alt');
    td2.appendChild(i2);
    tr.appendChild(td2);
    return tr;
}

function appendTableRow(domainTableBody, tableRow) {
    domainTableBody.appendChild(tableRow);
}


//when the user changes the time strategy
timeSelection.addEventListener('change', function () {
    //get the value of the time strategy
    const timeStrategy = timeSelection.value;
    //set the time strategy
    setTimeStrategy(timeStrategy);

    //rebuild the chart
    buildChart(datePeriod);
});

function setTimeStrategy(timeStrategy){
    //set the time strategy
    chrome.storage.sync.set({ 'TimeOption': timeStrategy }, function() {
        console.log('Value of "TimeOption" key set in Chrome storage.');
    });
}


//add event listener to each i-edit element
function addEditButtonListener(editButtons){
    editButtons.forEach(function (editButton) {
        setEditEventListener(editButton);
    });
}

function setEditEventListener(editButton){
    editButton.addEventListener('click', function () {
        const td = editButton.parentElement.parentElement.firstElementChild;
        const oldDomain = td.innerText;

        const tr = td.parentElement;
        tr.removeChild(td);

        const input = createInputField(oldDomain);
        tr.insertBefore(input, tr.firstChild);

        //make an event listener which will be triggered when the user presses enter or leaves the input field this must be one event listener with two events
        input.addEventListener('keyup', function (event) {
            if(event.key === 'Enter'){
                const newDomain = input.value;
                changeDomain(oldDomain, newDomain);
                td.innerText = newDomain;
                tr.removeChild(input);
                tr.insertBefore(td, tr.firstChild);
            }
        });

    });
}

function createInputField(domain){
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('value', domain);
    return input;
}

function changeDomain(oldDomain, newDomain){
    console.log('OldDomain: '+oldDomain);
    console.log('NewDomain: '+newDomain);
    chrome.storage.sync.get(['Important','Other'], function (items) {
        items = JSON.parse(JSON.stringify(items));
        const array = items.Important;
        const element = array.find(function (element) {
            return element.url === oldDomain;
        });
        element.url = newDomain;

        updateImportantDomains(array);
    });
}

function updateImportantDomains(array){
    chrome.storage.sync.set({ 'Important': array }, function () {
        console.log('Value of "Important" key set in Chrome storage.');
    });
}

//set remove button listener
function addRemoveButtonListener(removeButtons){
    removeButtons.forEach(function (removeButton) {
        setRemoveButtonListener(removeButton);
    });
}

function setRemoveButtonListener(removeButton){
    removeButton.addEventListener('click', function () {
        const td = removeButton.parentElement.parentElement.firstElementChild;
        const domain = td.innerText;

        td.parentElement.remove();

        removeDomain(domain);
    });
}

function removeDomain(domain){
    chrome.storage.sync.get(['Important','Other'], function (items) {
        items = JSON.parse(JSON.stringify(items));
        const array = items.Important;
        const element = array.find(function (element) {
            return element.url === domain;
        });
        const index = array.indexOf(element);
        array.splice(index, 1);

        updateImportantDomains(array);
    });
}

//listen if the user presses enter in the input field
addNewDomainInput.addEventListener('keyup', function (event) {
    if(event.key === 'Enter'){
        addNewDomain();
    }
});
function setAddNewDomainButtonListener(){
    addNewDomainButton.addEventListener('click', addNewDomain);
}

function addNewDomain(){
    const domain = addNewDomainInput.value;
    if(domain === ''){
        return;
    }

    addNewDomainInput.value = '';

    chrome.storage.sync.get(['Important','Other'], function (items) {
        items = JSON.parse(JSON.stringify(items));
        const array = items.Important;

        //check if the domain already exists
        const element = array.find(function (element) {
            return element.url === domain;
        });

        if(element !== undefined){
            return;
        }

        const otherElement = items.Other.find(function (element) {
            return element.url === domain;
        });

        if(otherElement !== undefined){
            array.push(otherElement);
            //remove the element from the other array
            const index = items.Other.indexOf(otherElement);
            items.Other.splice(index, 1);

            chrome.storage.sync.set({ 'Other': items.Other }, function () {
                console.log('Value of "Other" key set in Chrome storage.');
            });
        } else {
            array.push({
                url: domain,
                milliseconds: 0,
                dates: [{
                    date: new Date(),
                    duration: 0
                }]
            });
        }

        updateImportantDomains(array);

        const tableRow = buildTableRow(domain);
        appendTableRow(domainTableBody, tableRow);

        const lastChild = domainTableBody.lastElementChild;
        setEditEventListener(lastChild.querySelector('.fa-edit'));
        setRemoveButtonListener(lastChild.querySelector('.fa-trash-alt'));

        //scroll to bottom on domainTableBody
        //make it smooth scroll
        smoothScrollToBottom(domainTableBody);
    });
}

function smoothScrollToBottom(element) {
    // Define the duration of the scroll animation in milliseconds
    let duration = 800;

    // Define the easing function (in this case, a quadratic function)
    function easeInOutQuad(t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    }

    // Define the scroll animation function
    function scrollAnimation(currentTime) {
        if (startTime === null) startTime = currentTime;

        let timeElapsed = currentTime - startTime;
        element.scrollTop = easeInOutQuad(timeElapsed, startPosition, distance, duration);

        if (timeElapsed < duration) requestAnimationFrame(scrollAnimation);
    }

    let startPosition = element.scrollTop;
    let distance = element.scrollHeight - startPosition;
    let startTime = null;

    // Start the scroll animation
    requestAnimationFrame(scrollAnimation);
}

function buildChart(datePeriod) {
    const promise1 = new Promise((resolve, reject) => {
        getDateArray('Important', (importantDurations) => {
            const trImportantElements = new Map(importantDurations);
            resolve(trImportantElements);
        });
    });

    const promise2 = new Promise((resolve, reject) => {
        getDateArray('Other', (otherDurations) => {
            const trOtherElements = new Map(otherDurations);
            resolve(trOtherElements);
        });
    });

    Promise.all([promise1, promise2]).then(([trImportantElements, trOtherElements]) => {
        const filteredTrImportantElements = filterDateRange(trImportantElements, datePeriod);
        const filteredTrOtherElements = filterDateRange(trOtherElements, datePeriod);
        const chart = generateChart(filteredTrImportantElements, filteredTrOtherElements);
        renderChart(chart);
    });
}

function filterDateRange(trElements, datePeriod) {
    const firstDate = new Date(datePeriod.START);
    const lastDate = new Date(datePeriod.END);
    return new Map([...trElements].filter(([key, value]) => {
        return new Date(key) >= firstDate && new Date(key) <= lastDate;
    }));
}

function renderChart(chart) {
    const chartWrapper = document.querySelector('.chart-wrapper');
    chartWrapper.innerHTML = '';
    chartWrapper.appendChild(chart);
}



function generateChart(importantData, otherData) {
    const chart = document.createElement('table');
    chart.classList.add('charts-css', 'area', 'multiple', 'show-labels', 'show-data-on-hover');
    chart.id = 'my-chart';

    const tbody = document.createElement('tbody');
    chart.appendChild(tbody);

    const totalDuration = Array.from(importantData.values()).reduce((acc, curr) => acc + curr, 0) +
        Array.from(otherData.values()).reduce((acc, curr) => acc + curr, 0);

    const data = new Map([...importantData, ...otherData]);

    const dates = [...data.keys()].sort((a, b) => new Date(a) - new Date(b));

    let prevStart = 0;
    dates.forEach((date) => {
        const tr = document.createElement('tr');
        tbody.appendChild(tr);
        createChartLabel(tr, date);

        let hasImportantData = false;

        if (importantData.has(date)) {
            const value = importantData.get(date);
            const td = createTdElement(value, totalDuration, prevStart);
            tr.appendChild(td);
            prevStart += value;
            hasImportantData = true;
        }

        if (otherData.has(date)) {
            const value = otherData.get(date);
            const td = createTdElement(value, totalDuration, prevStart);
            tr.appendChild(td);
            prevStart += value;
        }

        if (!hasImportantData) {
            tr.appendChild(createEmptyTdElement());
        }
    });

    return chart;
}

function createChartLabel(tr, date){
    const th = document.createElement('th');
    th.scope = 'row';
    let formattedDate = new Date(String(date));
    //make the date look like this: DD/MM
    th.textContent = String(formattedDate.getDate() + '/' + (formattedDate.getMonth() + 1));
    tr.appendChild(th);
}

function createTdElement(value, totalDuration, prevStart) {
    const td = document.createElement('td');
    const start = (prevStart / totalDuration).toFixed(1);
    const size = (value / totalDuration).toFixed(1);
    td.style.setProperty('--start', start);
    td.style.setProperty('--size', size);
    // td.innerHTML = `<span class="data">${value}</span>`;
    parseTime(value, function (time) {
        td.innerHTML = `<span class="data">${time}</span>`;
    });
    return td;
}

function createEmptyTdElement() {
    const td = document.createElement('td');
    td.innerHTML = `<span class="data"></span>`;
    return td;
}

const getDateArray = function(type, callback) {
    chrome.storage.sync.get([type], function (items) {
        let durations = new Map();

        items[type].forEach(function (element) {
            // Map date.date to date.duration inside the element.dates array
            element.dates.forEach(function (date) {
                if(!durations.has(date.date)) {
                    durations.set(date.date, date.duration);
                } else {
                    durations.set(date.date, durations.get(date.date) + date.duration);
                }
            });
        });

        callback(durations);
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
                break;
            case 'milliseconds':
                callback(milliseconds + ' milliseconds');
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