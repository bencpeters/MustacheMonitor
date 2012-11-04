var config = require('../config').config;

//relative paths
exports.getGifPath = makeGifPath;
exports.getAnimationPagePath = makeAnimationPagePath;
//global paths
exports.getGlobalGifPath = makeGlobalGifPath;
exports.getGlobalAnimationPagePath = makeGlobalAnimationPath;

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
