var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var memberModule = require('./modules/member_module');
var boardModule = require('./modules/board_module');

/*************************** DB Connect ****************************/
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
app.use(bodyParser.json());
app.use(cookieParser());

/*************************** router *******************************/
// root
app.get('/', function(req, res){
	res.render('index', {user:req.cookies.member});
});

// 회사소개
app.get('/company/introduce', function(req, res){
	res.render('company/introduce', {user:req.cookies.member});
});

memberModule.setRouter(app);
boardModule.setRouter(app);

/*************************** listen *******************************/
app.listen(3000, function(){
	console.log('--------------------------------------------------------------------------------');
	console.log(new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate() + '   ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds());
	console.log('--------------------------------------------------------------------------------');
	console.log('Server on~!');
});