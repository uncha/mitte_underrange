var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false});

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

/*************************** schema *******************************/
var noticeSchema = mongoose.Schema({
	subject:{type:String},
	content:{type:String},
	view:{type:Number, default:1},
	date:{type:Date, default:Date.now()}
});

/*************************** router *******************************/
// root
app.get('/', function(req, res){
	res.render('index');
});

// 회사소개
app.get('/company/introduce', function(req, res){
	res.render('company/introduce');
});

// notice List
app.get('/customer/notice/list', function(req, res){
	var noticeModel = mongoose.model('notice', noticeSchema);

	noticeModel.find({}).sort({_id:-1}).exec(function(err, data){
		res.render('board/default/list', {data:data});
	});
});

// notice Write
app.get('/customer/notice/write', function(req, res){
	res.render('board/default/write');
});

// notice Write Process
app.post('/customer/notice/write/process', urlencodedParser, function(req, res){
	var noticeModel = mongoose.model('notice', noticeSchema);

	var data = {subject:req.body.subject, content:req.body.content};

	noticeModel.create(data, function(err, data){
		if(err){
			console.log('Error', err);
		} else {
			console.log('Create Success', data);
			res.redirect('/customer/notice/list');
		}
	});
});

// notice Update
app.get('/customer/notice/update/:id', function(req, res){
	var id = req.params.id;

	var noticeModel = mongoose.model('notice', noticeSchema);

	noticeModel.findOne({_id:id}).exec(function(err, data){
		res.render('board/default/update', {data:data});
	});
});

// notice Update Process
app.post('/customer/notice/update/process/:id', urlencodedParser, function(req, res){
	var noticeModel = mongoose.model('notice', noticeSchema);

	var id = req.params.id;

	noticeModel.findOne({_id:id}).exec(function(err, data){
		data.subject = req.body.subject;
		data.content = req.body.content;

		data.save(function(err){
			res.redirect('/customer/notice/list');
		});
	});
});

// notice View
app.get('/customer/notice/view/:id', function(req, res){
	var noticeModel = mongoose.model('notice', noticeSchema);

	var id = req.params.id;

	noticeModel.findOne({_id:id}).exec(function(err, data){
		var view = data.view++;
		data.save(function(err){
			res.render('board/default/view', {data:data});
		});
	});
});

// notice Delete
app.get('/customer/notice/delete/:id', function(req, res){
	var noticeModel = mongoose.model('notice', noticeSchema);

	var id = req.params.id;

	noticeModel.findByIdAndRemove(id, function(err){
		res.redirect('/customer/notice/list');
	});
});

/*************************** listen *******************************/
app.listen(3000, function(){
	console.log('Server on~!');
});