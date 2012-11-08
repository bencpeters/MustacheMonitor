var config = require('../config').config;

//relative paths
exports.getGifPath = makeGifPath;
exports.getAnimationPagePath = makeAnimationPagePath;
//global paths
exports.getGlobalGifPath = makeGlobalGifPath;
exports.getGlobalAnimationPagePath = makeGlobalAnimationPath;

exports.getDateString = timeToString;

function makeGifPath (gifId, screenName) {
    return makeAnimationPagePath(gifId, screenName) + '/gif';
}

function makeAnimationPagePath (gifId, screenName) {
    return '/user/' + screenName + '/' + gifId;
}

function makeGlobalGifPath (gifId, screenName) {
    return config.baseUrl + makeGifPath(gifId, screenName);
}

function makeGlobalAnimationPath (gifId, screenName) {
    return config.baseUrl + makeAnimationPagePath(gifId, screenName);
}

function timeToString(date) {
    var string = '';
    switch (date.getMonth()) {
        case 0:
            string += 'Jan';
            break;
        case 1:
            string += 'Feb';
            break;
        case 2:
            string += 'Mar';
            break;
        case 3:
            string += 'Apr';
            break;
        case 4:
            string += 'May';
            break;
        case 5:
            string += 'Jun';
            break;
        case 6:
            string += 'Jul';
            break;
        case 7:
            string += 'Aug';
            break;
        case 8:
            string += 'Sep';
            break;
        case 9:
            string += 'Oct';
            break;
        case 10:
            string += 'Nov';
            break;
        case 11:
            string += 'Dec';
            break;
    }
    string += ' ' + date.getDate();
    var lastDigit = parseInt(string.charAt(string.length-1));
    string += '<sup>';
    switch (lastDigit) {
        case 0:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
            string += 'th';
            break;
        case 1:
            string += 'st';
            break;
        case 2:
            string += 'nd';
            break;
        case 3:
            string += 'rd';
            break;
    }
    string += '</sup>' + ', ';
    return string + date.getFullYear();
}
