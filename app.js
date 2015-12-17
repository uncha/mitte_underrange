var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var app = express();

/*************************** DB Connect *******************************/
mongoose.connect('mongodb://uncha:rbxo6727@ds033175.mongolab.com:33175/mitte_underrange');
var db = mongoose.connection;
db.once('open', function(){
	console.log('DB Connected');
});
db.on('error', function(err){
	console.log('DB Error :', err);
});


/*************************** express *******************************/
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname + '/public')));


/*************************** router *******************************/
app.get('/', function(req, res){
	res.render('index');
});

app.get('/company/introduce', function(req, res){
	res.render('company/introduce');
});

app.get('/customer/notice', function(req, res){
	res.render('board/default/list');
});


/*************************** listen *******************************/
app.listen(3000, function(){
	console.log('Server on~!');
});