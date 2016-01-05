module.exports = utilModule;
module.exports.sendAndBack = sendAndBack;
module.exports.extend = extend;
function utilModule(){

}

function sendAndBack(msg, url){
    var sendData = '<script type="text/javascript">';
    sendData +=	'alert("' + msg + '");';
    (!url) ? sendData += 'history.back();' : sendData += 'location.href="' + url + '"';
    sendData +=	'</script>';

    return sendData;
}

function extend(obj, src) {
    var obj2 = JSON.parse( JSON.stringify( obj ) );
    for (var key in src) {
        if (src.hasOwnProperty(key)) obj2[key] = src[key];
    }
    return obj2;
}