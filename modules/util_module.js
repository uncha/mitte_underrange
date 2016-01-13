module.exports = utilModule;
module.exports.sendAndBack = sendAndBack;
module.exports.extend = extend;
module.exports.extendSetting = extendSetting;
function utilModule(){

}

function sendAndBack(msg, url){
    var sendData = '<script type="text/javascript">';
    sendData +=	'alert("' + msg + '");';
    (!url) ? sendData += 'history.back();' : sendData += 'location.href="' + url + '"';
    sendData +=	'</script>';

    return sendData;
}

function extendSetting(obj, src) {
    var newObj = JSON.parse( JSON.stringify( obj ) );
    for (var key in src) {
        if (src.hasOwnProperty(key)) newObj[key] = src[key];
    }
    return newObj;
}

function extend(obj, src) {
    for (var key in src) {
        if (hasOwnProperty(src, key)) obj[key] = src[key];
    }
    return obj;
}

function hasOwnProperty (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop)
}