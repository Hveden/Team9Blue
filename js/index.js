// Based on an example:
//https://github.com/don/cordova-plugin-ble-central


// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

// ASCII only
function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

//the bluefruit UART Service
var blue ={
	serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    txCharacteristic: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // transmit is from the phone's perspective
    rxCharacteristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e'  // receive is from the phone's perspective
}

//Hardcoded så telefonen altid connecter til den rigtige device.
var ConnDeviceId = "D4:79:09:AC:61:BF";
var deviceList =[];
var modtag;

function onLoad(){
	document.addEventListener('deviceready', onDeviceReady, false);
}

function onDeviceReady(){
	ble.autoConnect(ConnDeviceId, onConnect, onConnError);
}


function refreshDeviceList(){
	if (cordova.platformId === 'android') { // Android filtering is broken
		ble.scan([], 5, onDiscoverDevice, onError);
	}
	else
	{
		//alert("Disconnected");
		ble.scan([blue.serviceUUID], 5, onDiscoverDevice, onError);
	}
}
function onDiscoverDevice(device){
}
//connector
function conn(){
	var  deviceTouch= event.srcElement.innerHTML;
	document.getElementById("debugDiv").innerHTML =""; // empty debugDiv
	var deviceTouchArr = deviceTouch.split(",");
	ConnDeviceId = deviceTouchArr[1];
	document.getElementById("debugDiv").innerHTML += "<br>"+deviceTouchArr[0]+"<br>"+deviceTouchArr[1]; //for debug:
	ble.connect(ConnDeviceId, onConnect, onConnError);
 }

 //succes
function onConnect(){
	document.getElementById("statusDiv").innerHTML = " Status: Connected";
	document.getElementById("bleId").innerHTML = ConnDeviceId;
	ble.startNotification(ConnDeviceId, blue.serviceUUID, blue.rxCharacteristic, onData, onError);
}

//failure
function onConnError(){
	alert("Problem connecting");
	document.getElementById("statusDiv").innerHTML = " Status: Disonnected";
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}


 function onData(data){ // data received from Arduino
   modtag = bytesToString(data);

  document.getElementById("receiveDiv").innerHTML =  "Received: " + bytesToString(data) + "<br/>";
}

function reciveData(){
  var dataTest = stringToBytes("p");
  ble.writeWithoutResponse(ConnDeviceId, blue.serviceUUID, blue.txCharacteristic, dataTest, onSend, onError);
  //onData(data)
  document.getElementById("receiveDiv").innerHTML =  "Received: " + modtag + "<br/>";
}
function data(txt){
	messageInput.value = txt;
}

function sendData() { // send data to Arduino
	 var data = stringToBytes(messageInput.value);
	ble.writeWithoutResponse(ConnDeviceId, blue.serviceUUID, blue.txCharacteristic, data, onSend, onError);
}

function onSend(){
	document.getElementById("sendDiv").innerHTML = "Sent: " + messageInput.value + "<br/>";
}

function disconnect() {
	ble.disconnect(deviceId, onDisconnect, onError);
}

function onDisconnect(){
	document.getElementById("statusDiv").innerHTML = "Status: Disconnected";
}
function onError(reason)  {
	alert("ERROR: " + reason); // real apps should use notification.alert
}

function data(input){
  var data = stringToBytes(input);
 ble.writeWithoutResponse(ConnDeviceId, blue.serviceUUID, blue.txCharacteristic, data, onSend, onError);
}


var s;
function hashing(){
  //lånt fra https://gist.github.com/iperelivskiy/4110988
  //input
  s = messageInput.value;
  var a = 1, c = 0, h, o;
  //tjekker om der er et input
if (s) {
    a = 0;
    /*jshint plusplus:false bitwise:false*/
    for (h = s.length - 1; h >= 0; h--) {
        o = s.charCodeAt(h);
        //<< flytter bits til x pladser venstre
        //& XOR function
        a = (a<<6&268435455) + o + (o<<14);
        c = a & 266338304;
        a = c!==0?a^c>>21:a;
    }
}
  document.getElementById("hash").innerHTML = String(a);
}


// Konverter til HEX da nogle outputs kan være nonprintable
function encryptStringWithXORtoHex(key, input) {

    var c = '';
    while (key.length < input.length) {
         key += key;
    }
    for(var i=0; i<input.length; i++) {
        var value1 = input[i].charCodeAt(0);
        var value2 = key[i].charCodeAt(0);

        var xorValue = value1 ^ value2;

        var xorValueAsHexString = xorValue.toString("16");

        if (xorValueAsHexString.length < 2) {
            xorValueAsHexString = "0" + xorValueAsHexString;
        }

        c += xorValueAsHexString;
    }
    return c;
}

//hjælpe function
function encrypt(){
  var key = password.value;
  var input = messageInput.value;
  messageInput.value= encryptStringWithXORtoHex(key, input);
}
//hjælpe function
function decrypt(){
  var key = password.value;
  var input = hex2a(messageInput.value);
  messageInput.value = hex2a(encryptStringWithXORtoHex(key,input));
}


//omdanner HEX til ASCII
function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
