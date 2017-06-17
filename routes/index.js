var express = require('express');
var router = express.Router();
var gcm = require('node-gcm');
var message = new gcm.Message();

/* GET home page. */
router.get('/push', function(req, res, next) {
  message.addData('key1', 'msg1');
  var device = req.query.token;

console.log(device);
	


	
	var data = {
					message:"Hola",
					title:"Hola",
					type:1
				};

//RIBAS --> "fPzHHd67EsY:APA91bHsvs4CfOo7A4vlhhXd9BAIr3nOG8IFLOXOlydfe5J1nHm-FsIGDZ2-XJ7Gfc6ZA1fO5Tm1umg0WSjX9NieMIpvxN595qHL9llrquJmJKk8UGbgpeTcsYEWP0hKFjL3lubn5CqZ"
//MARLET --> "cRZoSn7KVjk:APA91bEFLEhs3mjgbA62RIwWgC5YMkdYM3HIQc-SC7J_Ic34N09Ndm70qoEfCKjZaZZWz8U84aJ6gGbYq09c1G_XNK0jpz_GeL6gJw6OWLYHOQHaehD9_qcFV8vxQLsg8tmb0f2jcLvF"
//ERIC --> "cW_mSKBRqhQ:APA91bFS5oScq9aQJKjc3BXNL7dlgpB1WPtmJufiLA9KHkM_5rKWRyfp5SMf_RUOyK_t5Eu2r6PEoWrvjZsFV3avZZZebfsjZmHrz8XoAiVmOWzKwztl4vKqdS71gCg9V3sf-VOSDc9u"
	//var device = "cRZoSn7KVjk:APA91bEFLEhs3mjgbA62RIwWgC5YMkdYM3HIQc-SC7J_Ic34N09Ndm70qoEfCKjZaZZWz8U84aJ6gGbYq09c1G_XNK0jpz_GeL6gJw6OWLYHOQHaehD9_qcFV8vxQLsg8tmb0f2jcLvF";

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


var apikey_ANDROID = "AIzaSyAhit45aNJB6XMaHq_XC48bjj8xIVB8Bdc";


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
