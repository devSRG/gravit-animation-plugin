let arr = [
    '0','1','2','3','4','5','6','7','8','9',
    'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
    'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'
];

let SHORT_LENGTH = 8;
let LONG_LENGTH = 16;

const CONSTANTS = {
    ANIMATE: {
        TYPE : {
            TRANSLATE: 'translate',
            SCALE: 'scale',
            ROTATE: 'rotate',
            COLOR: 'color'
        }
    }
};

function shortID() {
    let ID = '';
    for (let i = 0; i <= SHORT_LENGTH; i++) {
        let j = Math.floor(Math.random() * 62);
        ID += arr[j];
    }
    return ID;
}

function longID() {
    let ID = '';
    for (let i = 0; i <= LONG_LENGTH; i++) {
        let j = Math.floor(Math.random() * 62);
        ID += arr[j];
    }
    return ID;
}

function updateStatus(msg, type) {
    let status_msg = $('.status-msg');
    let label = status_msg.children()[0];

    label.innerHTML = msg;
    status_msg.removeClass('warn error info');
    status_msg.addClass('show');

    if(type == 'warn') {
        status_msg.addClass('warn');
    } else if(type == 'error') {
        status_msg.addClass('error');
    } else {
        status_msg.addClass('info');
    }

    setTimeout(() => {
        label.innerHTML = 'Default';
        status_msg.removeClass('show');
    }, 3000);
}


module.exports = {
    CONSTANTS,
    shortID,
    longID,
    updateStatus
};