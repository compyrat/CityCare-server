var express = require('express');
var router = express.Router();
var gcm = require('node-gcm');
var message = new gcm.Message();
var apikey_ANDROID = require('./apikey').getAndroid();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/push', function(req, res, next) {
  message.addData('key1', 'msg1');
  var device = req.query.token;

console.log(device);

	var data = {
					message:"Hola",
					title:"Hola",
					type:1
				};

	_sendNotificationANDROID(data, device);

	res.end();

});

router.get('/status', function(req, res, next) {

	res.send({"error":0});

});

if (typeof global.connections == "undefined") {
	global.connections = [];
}

var connections = [];


function LIBPUSH () {

}

//
// SEND notification
//	data: JSON to send
//	users:  {type: 1}
//		type: 0 (ios), 1 (android)
//		device: <pushid>
//	callback: cb(err, deviceId)
LIBPUSH.sendNotification = function (data, users, callback) {

	// check if users
	if (!users || (users.length == 0)) {
		debugI("no users found for sending notification");
		if (callback) callback(undefined, undefined)
		return;
	}

	// for each user
	console.log("* SEND ANDROID NOTIFIATION device " + J(user.device));

	_sendNotificationANDROID(data, user.device, callback);

}

var _sendNotificationANDROID = 	function (data, device) {

	// create sender
	var sender = new gcm.Sender(apikey_ANDROID);

	// create message
	var message = new gcm.Message();
	message.addDataWithObject(data);

	// send message
	sender.sendNoRetry(message, device, function (err, result) {

		var fail = err;
		if (!err) {
			if (result.success > 0) {
				fail = null;
			}
			else {
				fail = result;
			}
		}
	});
}

module.exports = router;
