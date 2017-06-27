var express = require('express');
var router = express.Router();
var multer  = require('multer');
var fs = require('fs');
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var host = 'mongodb://localhost:27017';
var gcm = require('node-gcm');
var message = new gcm.Message();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Incidencias');
});

router.post('/image/upload', multer({ dest: './uploads/'}).single('uploaded_file'), function(req, res, next) {
	console.log("conect to image/upload");
	console.log(req.file);

	fs.rename('./uploads/'+req.file.filename, './uploads/'+req.file.originalname, function(err) {
    	if ( err ) console.log(err);
	});

  res.end();
});

router.get('/image/:image', function(req,res,next){
	var img = req.params.image;
  try {
    var img2 = fs.readFileSync('./uploads/' + img);
    res.writeHead(200, {'Content-Type': 'image/jpg' });
    res.end(img2, 'binary');

  }catch(err){
    res.json({err:404, msg:img + " not found"})
  }
})

router.post('/save', function(req,res,next){

	var mac = req.body.mac;
	var userId = req.body.userId;
	var category = req.body.category;
	var date = new Date().toISOString();
	var image = req.body.image;
	var lat = req.body.lat;
	var lng = req.body.lng;
	var street = req.body.street;
	var streetbyUser = req.body.streetbyUser;
	var status = "0";
	var title = req.body.title;
	var email = req.body.email;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		var doc = {"mac":mac,
					"userId":userId,
					"email":email,
					"title":title,
					"date":date,
					"category":category,
					"lat":lat,
					"lng":lng,
					"status":status,
					"street":street,
					"imageName":image,
					"streetbyUser":streetbyUser
					};

		console.log("Guardando incidencia del User: " + userId);

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

	});
})

router.get('/incidences/:id', function(req, res, next) {
	console.log("conect to login");
	var id = req.params.id;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");


		collection.find({"userId": id}).sort({"date":-1}).toArray(function(err, relatedItems) {
			if (!err){
				console.log({"incidencias":relatedItems});
                res.send({"incidencias":relatedItems});
			}else{
				console.log(err);
                res.send("relatedItems");
			}

			db.close();
        });
	});
});

router.get('/getAll/:id/WithPag/:skip', function(req, res, next) {
	console.log("conect to login");
	var id = req.params.id;
	var pag = req.params.skip;
	var isDelete = req.query.delete;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("**************buscando por incidencias***************");
		console.log(isDelete);
		if (isDelete == 2){
			collection.find({"userId": id, "status":"0"}).sort({"date":-1}).skip(parseInt(pag)).limit(5).toArray(function(err, relatedItems) {
				if (!err){
					console.log({"incidencias":relatedItems});
	                res.send({"incidencias":relatedItems});
	                db.close();
				}else{
					console.log(err);
	                res.send("relatedItems");
	                db.close();
				}
			});
		}else{
			collection.find({"userId": id}).sort({"date":-1}).skip(parseInt(pag)).limit(5).toArray(function(err, relatedItems) {
				if (!err){
					console.log({"incidencias":relatedItems});
	                res.send({"incidencias":relatedItems});
	                db.close();
				}else{
					console.log(err);
	                res.send("relatedItems");
	                db.close();
				}
			});
		}
	});
});

router.get('/find/:id', function(req, res, next) {
	console.log("conect to login");
	var id = req.params.id.toString();

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");


		collection.findOne({"_id": new mongo.ObjectID(id)}, function(err, result) {
			if (!err){
				console.log({"incidencia":result});
                res.send({"incidencia":result});
			}else{
				console.log(err);
                res.send(err);
			}

			db.close();
        });
	});
});

router.get('/incidencesAll', function(req, res, next) {
	console.log("conect to incidencesAll");

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");


		collection.find().toArray(function(err, relatedItems) {
			if (!err){
				console.log({"incidencias":relatedItems});
                res.send({"incidencias":relatedItems});
			}else{
				console.log(err);
                res.send("error");
			}

			db.close();
        });
	});
});

router.post('/delete', function(req, res, next) {
	var userId = req.body.userId.toString();
	var incidenceId = req.body.incidenceId.toString();
	var imageName = req.body.imageName;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');
		console.log("buscando por incidencias");

		if (userId == "Admin"){
			collection.deleteOne({"_id": new mongo.ObjectID(incidenceId)}, function(err, results) {
		    	if (err){
		        	console.log(err);
		    	}else{

		    		fs.unlink('./uploads/'+imageName, function(err) {
				    	if ( err ) console.log(err);
					});
		    	}
		    	db.close();
		    	res.end();
		    });
		}else{
			collection.deleteOne({"_id": new mongo.ObjectID(incidenceId), "userId":userId }, function(err, results) {
		    	if (err){
		        	console.log(err);
		    	}else{
		    		fs.unlink('./uploads/'+imageName, function(err) {
				    	if ( err ) console.log(err);
					});

		    	}
		    	db.close();
		    	res.end();
		    });
		}
	});
});

router.get('/checkRead/:id', function(req, res, next) {
	console.log("Marcando");
	var id = req.params.id;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");



		collection.findAndModify(
			    { "_id": new mongo.ObjectID(id)},
			    [],
			    {$set: {"status":"1"}},
				{upsert:true, new:true},
			function(err,doc) {
				if(!err){
					console.log("***********checkRead OK***********");
					res.end();
				}else{
					console.log("***********checkRead NO***********");
					console.log(err);
					res.end();
				}
				db.close();
	        });
	});
});

router.get('/count/:id', function(req, res, next) {
	console.log("Contando");
	var id = req.params.id;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");
		collection.count({"userId": id}, function(err, count) {
			console.log(count);
			db.close();
			res.send(count.toString());

        });
    });
});

router.get('/countSolved/:id', function(req, res, next) {
	console.log("Contando");
	var id = req.params.id;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");
		collection.count({"userId": id, "status":"3"}, function(err, count) {
			console.log(count);
			db.close();
			res.send(count.toString());

        });
    });
});

router.get('/countTest/:id', function(req, res, next) {
	console.log("Contando");
	var id = req.params.id;

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");
		collection.count({"userId": id}, function(err, count) {
			if(!err){
				collection.count({"userId": id, "status":"3"}, function(err, countSolved) {
					console.log(count + ", " + countSolved);
					res.send({solved:count.toString(), others:count.toString()});
		        	db.close();
		        });
			}else{
				console.log(err);
				db.close();
				res.end();
			}
        });
    });
});

router.get('/countAll', function(req, res, next) {
	console.log("Contando");

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");
		collection.aggregate([
		    { "$group": {
		        "_id": "$status",
		        "count": { "$sum": 1 }
		    }}
		],function(err,docs) {
			console.log(docs);
			db.close();
			res.send({count:docs});
		});
    });
});


router.get('/countAllCategory', function(req, res, next) {
	console.log("Contando");

	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");
		collection.aggregate([
		    { "$group": {
		        "_id": "$category",
		        "count": { "$sum": 1 }
		    }}
		],function(err,docs) {
			console.log(docs);
			db.close();
			res.send({count:docs});
		});
    });
});


router.get('/setStatus/:id/:status', function(req, res, next) {
	console.log("Marcando");
	var id = req.params.id;
	var status = req.params.status.toString();
	MongoClient.connect(host + "/CityCare", function(err, db) {
		if(err) { return console.dir(err); }

		var collection = db.collection('incidencias');

		console.log("buscando por incidencias");

		if (status == 3){
			var set = {
				"status":status,
				"resolutionDate":new Date().toISOString()
			}
		}else{
			var set = {
				"status":status,
			}
		}

		collection.findAndModify(
			    { "_id": new mongo.ObjectID(id)},
			    [],
			    {$set: set},
				{upsert:true, new:true},
			function(err,doc) {
				if(!err){
					console.log("***********checkRead OK***********");

					var mesage = "";
					if (status == 0){
						mesage = "La incidencia esta en tramite";
						console.log("***********Status 0***********");
					}else if(status == 1){
						mesage = "Tu incidencia ha sido Leída";
						console.log("***********Status 1***********");
					}else if(status == 2){
						mesage = "Tu incidencia esta en proceso";
						console.log("***********Status 2***********");
					}else if(status == 3){
						mesage = "Tu incidencia ha sido Solucionada";
						console.log("***********Status 3***********");
					}else if(status == 4){
						mesage = "Tu incidencia ha sido Rechazada";
						console.log("***********Status 4***********");
					}else{
						mesage = "Tu incidencia es Indeterminada";
						console.log("***********Status 5***********");
					}
					db.collection('usuarios').findOne({"_id": new mongo.ObjectID(doc.value.userId)}, function(err, result) {
				    	if (err){
				        	console.log(err);
				    	}else{
				    		var data = {
										message:mesage,
										type:"2"
									};

							console.log(status);
							_sendNotificationANDROID(data, result.token);
							if (status == 3){
								_plusPoint(doc.value.userId, db);
							}
							if (status == 4){
								_minePoint(doc.value.userId, db);
							}
				    	}
				    	db.close();
				    	res.end();
				    });
				}else{
					console.log("***********checkRead NO***********");
					console.log(err);
					db.close();
					res.end();
				}
	        });
	});
});

var _plusPoint = function(id, db){
	db.collection('usuarios').findAndModify(
			    { "_id": new mongo.ObjectID(id)},
			    [],
			    {$inc: {"positivePoints":2}},
				{upsert:true, new:true},
			function(err,doc) {
				console.log(doc);
				console.log(err);
				db.close();
			});
}

var _minePoint = function(id, db){
	db.collection('usuarios').findAndModify(
			    { "_id": new mongo.ObjectID(id)},
			    [],
			    {$inc: {"negativePoints":1, "positivePoints":-1} },
				{upsert:true, new:true},
			function(err,doc) {
				console.log(doc);
				console.log(err);
				db.close();
			});
}

var _sendNotificationANDROID = 	function (data, device) {

	if (typeof global.connections == "undefined") {
			global.connections = [];
		}

		var connections = [];


		var apikey_ANDROID = "AIzaSyAhit45aNJB6XMaHq_XC48bjj8xIVB8Bdc";

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
