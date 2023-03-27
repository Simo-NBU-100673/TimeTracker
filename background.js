console.log("From background.js");

let currentTabId = null;
let currentTabDomain = null;
const ENUM_KEYS = {
    IMPORTANT:'Important',
    OTHER:'Other'
};

//TODO make a function to get the ImportantUrlDomains array from the chrome storage at startup
const ImportantUrlDomains = ["www.google.com"];

//make a event listener for change of the active tab
chrome.tabs.onActivated.addListener(function(activeInfo) {
    console.log('new tab');
    if(currentTabDomain !== null && currentTabDomain.domain !== undefined) {
        const currentTime = getCurrentTime();
        const timeDifference = getTimeDifference(currentTabDomain.startTime, currentTime);
        saveDomainToStorage(currentTabDomain, timeDifference);
    }

    isWorking(function (result) {
        if(!result){
            console.log('Not working');
            currentTabDomain = null;
            return;
        }

        currentTabId = activeInfo.tabId;

        chrome.tabs.get(currentTabId, function(tab) {
            const url = tab.url;
            const domain = url.split('/')[2];

            if (ImportantUrlDomains.includes(domain)) {
                currentTabDomain = {
                    important: true,
                    domain: domain,
                    startTime: getCurrentTime()
                };

            }else {
                currentTabDomain = {
                    important: false,
                    domain: domain,
                    startTime: getCurrentTime()
                };
            }

        });

    });

});

function isWorking(callback) {
        chrome.storage.sync.get('Toggle', function (items) {
            items = JSON.parse(JSON.stringify(items));

            if (items.Toggle === undefined) {
                chrome.storage.sync.set({'Toggle': 'Working'});
                items.Toggle = 'Working';
            }

            if (items.Toggle === 'Working') {
                callback(true);
            }else {
                callback(false);
            }
        });
}


//current time in milliseconds
function getCurrentTime() {
    return new Date().getTime();
}

function getTimeDifference(startTime, endTime) {
    return endTime - startTime;
}

function saveDomainToStorage(currentTabDomain, timeDifference) {

    getDomainFromStorage(function (keys) {
        console.log(keys);
        let dateString = new Date().toDateString();
        // console.log(keys);
        if (currentTabDomain.important) {
            let elementToUpdate = keys[ENUM_KEYS.IMPORTANT].find((element) => element.url === currentTabDomain.domain);

            if (elementToUpdate) {
                elementToUpdate.milliseconds += timeDifference;
                elementToUpdate.dates.push({
                    date: dateString,
                    duration: timeDifference
                });
            }else {
                keys[ENUM_KEYS.IMPORTANT].push({
                    url: currentTabDomain.domain,
                    milliseconds: timeDifference,
                    dates: [{
                        date: dateString,
                        duration: timeDifference
                    }]
                });
            }
        } else {
            let elementToUpdate = keys[ENUM_KEYS.OTHER].find((element) => element.url === currentTabDomain.domain);

            if (elementToUpdate) {
                elementToUpdate.milliseconds += timeDifference;
                elementToUpdate.dates.push({
                    date: dateString,
                    duration: timeDifference
                });
            }else {
                keys[ENUM_KEYS.OTHER].push({
                    url: currentTabDomain.domain,
                    milliseconds: timeDifference,
                    dates: [{
                        date: dateString,
                        duration: timeDifference
                    }]
                });
            }
        }

        chrome.storage.sync.set(keys, function () {
        });
    });
}

function getDomainFromStorage(callback) {
    chrome.storage.sync.get([ENUM_KEYS.IMPORTANT, ENUM_KEYS.OTHER], function (items) {
        if (items[ENUM_KEYS.IMPORTANT] === undefined) {
            items[ENUM_KEYS.IMPORTANT] = [];
        }

        if (items[ENUM_KEYS.OTHER] === undefined) {
            items[ENUM_KEYS.OTHER] = [];
        }

        const KEYS = JSON.parse(JSON.stringify(items));
        callback(KEYS);
    });
}