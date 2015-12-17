var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var app = express();

mongoose.connect('mongodb://uncha:rbxo6727@ds033175.mongolab.com:33175/mitte_underrange');
var db = mongoose.connection;
db.once('open', function(){
	console.log('DB Connected');
});
db.on('error', function(err){
	console.log('DB Error :', err);
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname + '/public')));

app.get('/', function(req, res){
	res.render('index');
});

app.get('/company/company01', function(req, res){
	res.render('company/company01');
});

app.listen(3000, function(){
	console.log('Server on~!');
});