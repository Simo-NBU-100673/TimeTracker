const calenderInput = document.getElementById('range-input');
let isCalendarOpen = false;

let firstClickedDate = null;
let secondClickedDate = null;
let table = null;
let tableBody = null;
let tableCells = null;

//adds a listener to the document that will close the calendar when the user clicks outside of it and will set the values of the input field
//if the calendar is not open, it will open the calendar
document.addEventListener('click', toggleCalendarVisibility);

function toggleCalendarVisibility(event){
    if(event.target.id === 'range-input' && isCalendarOpen === false){
        let calendarWrapper = document.createElement('div');
        calendarWrapper.id = 'calendar-wrapper';

        calenderInput.after(calendarWrapper);
        init(calendarWrapper);
        isCalendarOpen = true;
        // console.log('Calendar opened');
        return;
    }

    if(isCalendarOpen && !event.target.closest('#calendar-wrapper')){
        //remove div with id calendar-wrapper
        let currentCalendarWrapper = document.getElementById('calendar-wrapper');
        currentCalendarWrapper.remove();
        isCalendarOpen = false;
        // console.log('Calendar closed');

        setValuesToInput();
    }
}

function setValuesToInput(){
    if(firstClickedDate && secondClickedDate){
        //makes the date to be in format DD/MM/YYYY and the set the value of the input field to be the two dates separated by a dash
        calenderInput.value = `${getDateStringFromCell(firstClickedDate)} - ${getDateStringFromCell(secondClickedDate)}`;
        return;
    }

    if(firstClickedDate){
        calenderInput.value = getDateStringFromCell(firstClickedDate);
    }
}

function getDateStringFromCell(cell){
    let cellDate = cell.getAttribute('date');
    const today = new Date(cellDate);
    const day = today.getDate().toString().padStart(2, '0'); // padStart ensures 2 digits
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // add 1 to get 1-12 range
    const year = today.getFullYear().toString();

    // date in "DD/MM/YYYY" format
    return `${day}/${month}/${year}`;
}

function getDateFromCell(cell){
    let cellDate = cell.getAttribute('date');
    return new Date(cellDate);
}

function init(divRoot){
    let currentDate = new Date();

    let headerButtons = createHeader(currentDate);
    divRoot.appendChild(headerButtons);

    let calendar = document.createElement('div');
    calendar.id = 'calendar';
    createMonth(currentDate.toDateString(), calendar);
    divRoot.appendChild(calendar);

    table = calendar.querySelector('table');
    tableBody = table.querySelector('tbody');
    tableCells = tableBody.querySelectorAll('td');
    addEventCellsListeners(tableCells);
    addHeaderButtonsListeners(headerButtons, calendar);
}

function createHeader(currentDate) {
    const headerButtons = document.createElement("div");
    headerButtons.id = "header-buttons";

    // create left button and add to header
    headerButtons.appendChild(createButton("left", "fas fa-arrow-left"));

    // create month/year div and add to header
    const monthYearDiv = createMonthYearDiv(currentDate);
    headerButtons.appendChild(monthYearDiv);

    // create right button and add to header
    headerButtons.appendChild(createButton("right", "fas fa-arrow-right"));

    return headerButtons;
}

function createButton(direction, iconClass) {
    const button = document.createElement("button");
    button.id = `${direction}-button`;
    const icon = document.createElement("i");
    icon.className = iconClass;
    button.appendChild(icon);
    return button;
}

function createMonthYearDiv(currentDate) {
    const monthYearDiv = document.createElement("div");
    monthYearDiv.id = "month-year";
    monthYearDiv.innerHTML = getMonthYearString(currentDate);
    return monthYearDiv;
}

function getMonthYearString(date) {
    const monthName = getMonthName(date.getMonth());
    const year = date.getFullYear();
    return `${monthName} ${year}`;
}

function getMonthName(monthIndex){
    let monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthIndex];
}

function addHeaderButtonsListeners(headerButtons, calendar) {
    const leftButton = headerButtons.querySelector("#left-button");
    const rightButton = headerButtons.querySelector("#right-button");
    const monthYearDiv = headerButtons.querySelector("#month-year");

    leftButton.addEventListener("click", () => handleHeaderButton(leftButton, monthYearDiv, calendar, -1));
    rightButton.addEventListener("click", () => handleHeaderButton(rightButton, monthYearDiv, calendar, 1));
}

function handleHeaderButton(button, monthYearDiv, calendar, direction) {
    removeEventCellsListeners(tableCells);
    // clearAllCells();

    const [month, year] = monthYearDiv.innerHTML.split(" ");
    const newDate = new Date(`${month} 1, ${year}`);
    newDate.setMonth(newDate.getMonth() + direction);
    monthYearDiv.innerHTML = getMonthYearString(newDate);
    createMonth(newDate.toDateString(), calendar);
    tableCells = getTableCells(calendar);
    addEventCellsListeners(tableCells);
}

function getTableCells(calendar) {
    const table = calendar.querySelector("table");
    const tableBody = table.querySelector("tbody");
    return tableBody.querySelectorAll("td");
}

function createMonth(monthToCreate, calendarWrapper) {
    const currentDate = new Date();
    const month = new Date(monthToCreate);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay(); // 0 is Sunday, 1 is Monday, etc.

    let tableHTML = '<table><thead><tr><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th><th id="sunday">S</th></tr></thead><tbody>';

    let day = 1;
    for (let i = 0; i < 6; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDayOfMonth - 1) {
                tableHTML += '<td class="disabled"><i class="fas fa-times"></i></td>';
            } else if (day <= daysInMonth) {
                let isWeekend = j === 6 || j === 5;
                tableHTML += createTableCell(day, month, currentDate, isWeekend);
                day++;
            } else {
                tableHTML += '<td class="disabled"><i class="fas fa-times"></i></td>';
            }
        }

        //check if day is greater than days in month and break
        if (day > daysInMonth) {
            break;
        }

        tableHTML += '</tr>';
    }

    tableHTML += '</tbody></table>';
    calendarWrapper.innerHTML = tableHTML;
}

function createTableCell(day, month, currentDate, isWeekend) {
    let date = new Date(month);
    date.setDate(day);

    return `<td date="${date}" class="${getClassList(day, month, date, currentDate, isWeekend)}">${day}</td>`;
}

function getClassList(day, month, date, currentDate, isWeekend) {
    //make an array of string
    let classList = [];
    if (isWeekend) {
        classList.push("weekend");
    }

    if (day === currentDate.getDate() && month.getMonth() === currentDate.getMonth() && month.getFullYear() === currentDate.getFullYear()) {
        classList.push("today");
    }

    if (firstClickedDate !== null && getDateFromCell(firstClickedDate).getTime() === date.getTime()) {
        classList.push("selected start-date");
    }

    if (secondClickedDate !== null && getDateFromCell(secondClickedDate).getTime() === date.getTime()) {
        classList.push("selected end-date");
    }

    if(firstClickedDate !== null && secondClickedDate !== null) {
        if (date.getTime() > getDateFromCell(firstClickedDate).getTime() && date.getTime() < getDateFromCell(secondClickedDate).getTime()) {
            classList.push("selected");
        }
    }

    return classList.join(" ");
}

function addEventCellsListeners(tableCells){
    tableCells.forEach(function (cell) {
        if(!cell.classList.contains('disabled')){
            cell.addEventListener('click', function () {
                if (firstClickedDate === null) {
                    handleFirstClickedDate(cell);
                } else if (secondClickedDate === null) {
                    handleSecondClickedDate(cell);
                } else {
                    handleThirdClickedDate(cell);
                }
            });
        }
    });
}

function removeEventCellsListeners(tableCells){
    tableCells.forEach(function (cell) {
        if(!cell.classList.contains('disabled')){
            cell.removeEventListener('click', function () {
                if (firstClickedDate === null) {
                    handleFirstClickedDate(cell);
                } else if (secondClickedDate === null) {
                    handleSecondClickedDate(cell);
                } else {
                    handleThirdClickedDate(cell);
                }
            });
        }
    });
}

function handleFirstClickedDate(cell) {
    firstClickedDate = cell;
    cell.classList.add('start-date');
    cell.classList.add('selected');
}

function handleSecondClickedDate(cell) {
    if (getDateFromCell(cell) < getDateFromCell(firstClickedDate)) {
        clearAllCells();
    } else {
        secondClickedDate = cell;
        secondClickedDate.classList.add('end-date');
        secondClickedDate.classList.remove('selected');
        highlightCellsBetween(firstClickedDate, secondClickedDate);
    }
}

function handleThirdClickedDate(cell) {
    if (cell.classList.contains('selected')) {
        handleSelectedThirdClick(cell);
        return;
    }

    handleUnselectedThirdClick(cell);
}

function handleSelectedThirdClick(cell) {
    if (cell.classList.contains('start-date') || cell.classList.contains('end-date')) {
        clearAllCells();
        return;
    }

    deselectFromCellToCell(cell, secondClickedDate);
    removeEndDateClassFromSecondClickedDate();
    secondClickedDate = cell;
    addEndDateClassToSecondClickedDate();
    secondClickedDate.classList.remove('selected');
    highlightCellsBetween(firstClickedDate, secondClickedDate);
}

function handleUnselectedThirdClick(cell) {
    if (getDateFromCell(cell) > getDateFromCell(secondClickedDate)) {
        removeEndDateClassFromSecondClickedDate();
        highlightCellsBetween(secondClickedDate, cell);
        secondClickedDate = cell;
        addEndDateClassToSecondClickedDate();

    } else if (getDateFromCell(cell) < getDateFromCell(firstClickedDate)) {
        clearAllCells();
        handleFirstClickedDate(cell);

    } else {
        deselectFromCellToCell(firstClickedDate, cell);
        removeStartDateClassFromFirstClickedDate();
        firstClickedDate = cell;
        addStartDateClassToFirstClickedDate();
    }
}

function removeEndDateClassFromSecondClickedDate() {
    //get elements with class end-date and remove it
    let elements = document.getElementsByClassName('end-date');
    while(elements.length > 0){
        elements[0].classList.remove('end-date');
    }
    // secondClickedDate.classList.remove('end-date');
}

function addEndDateClassToSecondClickedDate() {
    secondClickedDate.classList.add('end-date');
}

function removeStartDateClassFromFirstClickedDate() {
    firstClickedDate.classList.remove('start-date');
}

function addStartDateClassToFirstClickedDate() {
    firstClickedDate.classList.add('start-date');
}

function highlightCellsBetween(firstDate, secondDate) {

    const firDate = getDateFromCell(firstDate);
    const secDate = getDateFromCell(secondDate);
    //get all the cells between the first and second date
    const cellsBetween = (Array.from(tableCells)).filter(function (cell) {
        let cellDate = getDateFromCell(cell);
        return cellDate >= firDate && cellDate <= secDate;
    });

    //add the selected class to all the cells between the first and second date
    cellsBetween.forEach(function (cell) {
        cell.classList.add('selected');
    });
}

function clearAllCells() {
    tableCells.forEach(function (cell) {
        cell.classList.remove('selected', 'start-date', 'end-date');
    });
    firstClickedDate = null;
    secondClickedDate = null;
}

function getCellIndex(cell) {
    return Array.from(tableCells).indexOf(cell);
}

function deselectFromCellToCell(startCell, endCell) {

    const startDate = getDateFromCell(startCell);
    const endDate = getDateFromCell(endCell);

    const cellsBetween = (Array.from(tableCells)).filter(function (cell) {
        let cellDate = getDateFromCell(cell);
        return cellDate >= startDate && cellDate <= endDate;
    });

    cellsBetween.forEach(function (cell) {
        cell.classList.remove('selected');
    });
}
