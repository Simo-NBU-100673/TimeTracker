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
        console.log(array);

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
        console.log(datePeriod);
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
            console.log(event.type);
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
        console.log(array);
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
    addNewDomainButton.addEventListener('click', function () {
        addNewDomain();
    });
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

        // array.push({url: domain,
        //     milliseconds: 0});
        array.push({
                    url: domain,
                    milliseconds: 0,
                    dates: [{
                        date: new Date(),
                        duration: 0
                    }]
                });
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
        if (startTime === null) startTime = currentTime; // Set the start time of the animation

        let timeElapsed = currentTime - startTime; // Calculate the time elapsed since the start of the animation
         // Calculate the new scroll position using the easing function
        element.scrollTop = easeInOutQuad(timeElapsed, startPosition, distance, duration); // Scroll the element to the new position

        if (timeElapsed < duration) requestAnimationFrame(scrollAnimation); // Request the next animation frame until the animation is complete
    }

    // Get the current scroll position
    let startPosition = element.scrollTop;

    // Calculate the distance to scroll
    let distance = element.scrollHeight - startPosition;

    // Set the start time of the animation to null
    let startTime = null;

    // Start the scroll animation
    requestAnimationFrame(scrollAnimation);
}
