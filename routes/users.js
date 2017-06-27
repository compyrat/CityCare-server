var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var multer  = require('multer');
var upload = multer();
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var host = 'mongodb://localhost:27017';
var gcm = require('node-gcm');
var message = new gcm.Message();


router.post('/avatar/upload', multer({ dest: './avatars/'}).single('avatar'), function(req, res, next) {
	//console.log(req.file);
	console.log("Uploading Avatar");


	fs.rename('./avatars/'+req.file.filename, './avatars/'+req.file.originalname, function(err) {
    	if ( err ) console.log(err);
    	res.send({path: req.file.originalname});
	});
});

router.get('/image/:image', function(req,res,next){
	var img = req.params.image;
	var img2 = fs.readFileSync('./avatars/' + img);
    res.writeHead(200, {'Content-Type': 'image/jpg' });
    res.end(img2, 'binary');
})

// error = 0 --> Ok.
// error = 1 --> Fail register
router.post('/login/facebook', function(req, res, next) {
	console.log("connect to login");
	var name = req.body.name;
	var idAccount = req.body.id_prov;
	var email = req.body.email;
	var birthday = req.body.birthday;
	var gender = req.body.gender;
	var avatar = req.body.avatar;
	var mac = req.body.mac;
	var token = req.body.token;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('usuarios');

		var doc = {"name":name,
					"id_prov":idAccount,
					"email":email,
					"birthday":birthday,
					"gender":gender,
					"avatar":avatar,
					"mac":mac,
					"status":1,
					"positivePoints":0,
					"negativePoints":0,
					"token":token
					};

			console.log(doc);

		//FALTA COMPROBAR SI ES DE FACEBOOK O SI ES LOGIN NORMAL, SI ES LOGIN NORMAL SE TIENE QUE HACER OTRA REQUEST PARA REGISTER.
		//SI ID_PROV ES NULL ENTONCES ES UN LOGIN NORMAL.
		collection.findOne({"email":email}).then(function(user){
							console.log("antes de insertar.");

			if (!user){
				console.log("insertando.");
				collection.insert(doc, function(err, result){
				    if (!err){
						console.log({ error: 0, user: result.insertedIds[0] });
						res.send({ error: 0, user: result.insertedIds[0] });
					}else{
					  	console.log("no se ha insertado");
				  		res.send({ error: 1, user: result.insertedIds[0] });
				  	}
				  	db.close();
				});
			}else{
				console.log({ error: 0, user: user._id });
				res.send({ error: 0, user: user._id });
				db.close();
			}
		});
	});
});

router.post('/editUserInfo', function(req, res) {
	console.log("***********changeUser***********");
	var id = req.body.id.toString();
	var name = req.body.name;
	var lastName = req.body.lastname;
	var pss = req.body.pass;
	var avatar = req.body.avatar;
	console.log("avatar: " + avatar);

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('usuarios');

		collection.findAndModify(
				{ "_id": new mongo.ObjectID(id)},
				[],
				{$set: {"name":name, "lastname":lastName, "password":pss, "avatar":avatar}},
				{ upsert:true, new:true },
			function(err,doc) {
				if(!err){
					console.log("***********changeUser OK***********");
					res.end();
				}else{
					console.log("***********changeUser NO***********");
					console.log(err);
					res.send({error:1});
				}
				db.close();
			});
	});
});

router.post('/sendPush', function(req, res, next) {
	var userId = req.body.userId;
	var titulo = req.body.title;
	var mesage = req.body.message;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('usuarios');
		console.log("buscando por incidencias");

		var data = {
				message:mesage,
				title:titulo,
				type:3
			};

		db.collection('usuarios').findOne({"_id": new mongo.ObjectID(userId)}, function(err, result) {
	    	if (err){
	        	console.log(err);
	    	}else{
				_sendNotificationANDROID(data, result.token);
	    	}
	    	db.close();
	    	res.end();
	    });

	});
});

router.post('/edit/token', function(req, res, next) {
	console.log("***********changeToken***********");
	var id = req.body.id.toString();
	var token = req.body.token;


	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('usuarios');

		collection.findAndModify(
				{ "_id": new mongo.ObjectID(id)},
				[],
				{$set: {"token":token}},
				{ new:true },
			function(err,doc) {
				if(!err){
					console.log("***********changeToken OK***********");
					res.end();
				}else{
					console.log("***********changeToken NO***********");
					console.log(err);
					res.end();
				}
				db.close();
			});
	});
});


// error = 404 --> Fail login
router.post('/login/email', function(req, res, next) {
	console.log("connect to login");
	var password = req.body.password;
	var email = req.body.email;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('usuarios');

		collection.findOne({"email":email, "password":password}).then(function(user){
			if (!user){
				console.log({ error: 404});
				res.send({ error: 404});
			}else{
				console.log({ error: 0, user: user._id });
				res.send({ error: 0, user: user._id });
			}
			db.close();
		});
	});
});

// error = 0 --> Ok.
// error = 1 --> Exist user
// error = 2 --> Register Error
router.post('/login/register', function(req, res, next) {
	console.log("connect to login");
	var name = req.body.name;
	var email = req.body.email;
	var lastname = req.body.lastname;
	var password = req.body.password;
	var mac = req.body.mac;
	var type = req.body.accountType;
	var token = req.body.token;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('usuarios');

		var doc = {"name":name,
					"email":email,
					"lastname":lastname,
					"password":password,
					"mac":mac,
					"accountType":type,
					"status":"1",
					"positivePoints":0,
					"negativePoints":0,
					"token":token
					};

		console.log("Registrando.");

		collection.findOne({"email":email}).then(function(user){
			if (!user){
				collection.insert(doc, function(err, result){
				    if (!err){
						console.log({ error: 0, user: result.insertedIds[0] });
						res.send({ error: 0, user: result.insertedIds[0] });
					}else{
					  	console.log("no se ha insertado");
				  		res.send({ error: 2, user: result.insertedIds[0] });
				  	}
				  	db.close();
				});
			}else{
				console.log({ error: 1});
				res.send({ error: 1});
				db.close();
			}
		});
	});
});

router.get('/summary/:id', function(req, res, next) {
	console.log("connect to login");
	var id = req.params.id.toString();
	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('usuarios');

		console.log("buscando usuario por ID");

		collection.findOne({"_id": new mongo.ObjectID(id)}).then(function(user){
			if (!user){
				console.log({ error: 404, user:mongo.ObjectID(id)});
				res.send({ error: 404, user:mongo.ObjectID(id)});
				db.close();
			}else{
				db.collection('incidencias').count({"userId": id}, function(err, count) {
					if(!err){
			        	db.collection('incidencias').count({"userId": id, "status":"3"}, function(err, countSolved) {
							if(!err){
								console.log({ error: 0, user: user, numberIncidences: count.toString(), numberIncidencesSolved: countSolved.toString() });
								res.send({ error: 0, user: user, numberIncidences: count.toString(), numberIncidencesSolved: countSolved.toString() });
				        	}else{
				        		console.log(err);
				        	}
				        	db.close();
				        });
		        	}else{
		        		console.log(err);
		        		db.close();
		        	}
		        });
			}
		});
	});
});

router.get('/count', function(req, res, next) {
	console.log("Contando");

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('usuarios');

		console.log("buscando por incidencias");
		collection.count({"status":"0"}, function(err, count0) {
			if (!err){
				collection.count({"status":"1"}, function(err, count1) {
					if (!err){
						collection.count({"id_prov":{$exists: true}}, function(err, countFace) {
							if (!err){
								collection.count({"id_prov":{$exists: false}}, function(err, countNoFace) {
									if (!err){
										res.send({ban:count0, noBan:count1, face:countFace, noFace:countNoFace});
									}
									db.close();
						        });
							}
				        });
					}
		        });
			}
        });
    });
});


router.get('/deleteuser/:id', function(req, res, next) {
	var id = req.params.id.toString();
	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('usuarios');

		collection.remove({"_id": new mongo.ObjectID(id)}).then(function(user){
			if (!user){
				console.log({ error: 404, user:id});
				res.send({ error: 404, user:id});
			}else{
				db.collection('incidencias').remove({"userId": id}).then(function(incidence){
					if (!incidence){
						console.log({ error: 404, user:id});
						res.send({ error: 404, user:id});
					}else{
						console.log({ error: 0});
						res.send({ error: 0});
						/*db.collection('incidencias').findAndModify(
							{ "userId": id},
							[],
							{$set: {"userId": "Anonimo"}},
							{upsert:true, new:true},
								function(err,doc) {
									if(!err){
										console.log("***********EditUser OK***********");
										res.send({ error: 0, user: doc });
									}else{
										res.end(err);
									}
									db.close();
								});*/
					}
				});
			}
		});
	});
});

//ERROR 1 --> No hay Users
//ERROR 2 --> Error Server
router.get('/summaryall', function(req, res, next) {
	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }
		var collection = db.collection('usuarios');
        collection.find().toArray(function(err, items) {
         	if (!err){
         		if (items.length < 1){
	         		console.log("***********SummaryAll FAIL 1***********");
	         		console.log({ error: 1});
	                res.send({ error: 1});
         		}else{
         			console.log("***********SummaryAll OK***********");
	         		console.log({ error: 0, item:items});
	                res.send({ error: 0, item:items});
         		}
         	}else{
         		res.send({ error: 2});
         	}
             db.close();
        });
    });
});

router.post('/edituser', function(req, res, next) {
	var id = req.body.id.toString();
	var name = req.body.nombre;
	var password = req.body.password;
	var email = req.body.email;
	var lastname = req.body.lastname;
	var status = req.body.status;
	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }
		var collection = db.collection('usuarios');
		collection.findAndModify(
				{ "_id": new mongo.ObjectID(id)},
				[],
				{$set: {"name":name, "email":email, "password":password, "lastname":lastname, "status":status}},
				{upsert:true, new:true},
			function(err,doc) {
				if(!err){
					console.log("***********EditUser OK***********");
					res.end(doc);
				}else{
					res.end(err);
				}
				db.close();
			});
    });
});

router.post('/ban', function(req, res, next) {
	var id = req.body.id.toString();
	var status = req.body.status;
	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }
		var collection = db.collection('usuarios');
		collection.findAndModify(
				{ "_id": new mongo.ObjectID(id)},
				[],
				{$set: {"status":status}},
				{upsert:true, new:true},
			function(err,doc) {
				if(!err){
					console.log("***********EditUser OK***********");
					res.send({ error: 0, user:doc});
				}else{
					res.send(err);
				}
				db.close();
			});
    });
});

//ERROR 1 --> No hay Users
//ERROR 2 --> Error Server
router.get('/blackList/:mac', function(req, res, next) {
	var mac = req.params.mac;
	var status = "0";
	console.log(mac);
	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }
		var collection = db.collection('usuarios');
        collection.findOne({"mac":mac, "status":status}).then(function(user){
			if (!user){
				console.log({ error: 404});
				res.send({ error: 404});
			}else{
				console.log({ error: 1});
				res.send({ error: 1});
			}
			db.close();
		});
    });
});

var _sendNotificationANDROID = 	function (data, device) {
	var apikey_ANDROID = require('./apikey.js').getAndroid();
	if (typeof global.connections == "undefined") {
			global.connections = [];
		}

		var connections = [];
		
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
