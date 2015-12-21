var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
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
app.use(cookieParser());

/*************************** schema *******************************/
var noticeSchema = mongoose.Schema({
	subject:{type:String},
	content:{type:String},
	view:{type:Number, default:1},
	date:{type:Date, default:Date.now()}
});

var adminLoginSchema = mongoose.Schema({
	admin_id:{type:String},
	admin_password:{type:String}
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
	res.redirect('/customer/notice/list/1');
});

// notice List
app.get('/customer/notice/list/:currentPage', function(req, res){
	var listSetting = {
		listSize:10, // 한페이지에 보여질 목록 갯수
		pageSize:5 // 보여질 페이지 갯수
	};

	var currentPage = req.params.currentPage;
	var noticeModel = mongoose.model('notice', noticeSchema);
	var skipSize = (currentPage - 1) * listSetting.listSize;
	var limitSize = listSetting.listSize;
	var searchValue = req.query.search;
	var searchQuery = {};
	if(searchValue) searchQuery.subject = new RegExp(searchValue,"gi");

	noticeModel.count(searchQuery, function(err, c){
		noticeModel.find(searchQuery).skip(skipSize).limit(limitSize).sort({_id:-1}).exec(function(err, data){
			var startList = data.length - listSetting.listSize * currentPage + 1;
			var endList = data.length - listSetting.listSize * currentPage + listSetting.listSize;
			if(startList < 1) startList = 1;

			res.render('board/default/list', {data:data, totalCount:c, currentPage:currentPage, searchValue:searchValue, listSetting:listSetting});
		});
	});
});

// notice Write
app.get('/customer/notice/write', function(req, res){
	adminCheck(req, function(isAdmin){
		if(isAdmin){
			res.render('board/default/write');
		} else {
			res.redirect('/customer/admin/login/customer-notice-write');
		}
	});
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

	adminCheck(req, function(isAdmin){
		if(isAdmin){
			var noticeModel = mongoose.model('notice', noticeSchema);

			noticeModel.findOne({_id:id}).exec(function(err, data){
				res.render('board/default/update', {data:data});
			});
		} else {
			res.redirect('/customer/admin/login/customer-notice-update-' + id);
		}
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
	
	adminCheck(req, function(isAdmin){
		noticeModel.findOne({_id:id}).exec(function(err, data){
			var view = data.view++;
			data.save(function(err){
				res.render('board/default/view', {data:data, isAdmin:isAdmin});
			});
		});
	});
});

// notice Delete
app.get('/customer/notice/delete/:id', function(req, res){
	var id = req.params.id;

	adminCheck(req, function(isAdmin){
		if(isAdmin){
			var noticeModel = mongoose.model('notice', noticeSchema);

			noticeModel.findByIdAndRemove(id, function(err){
				res.redirect('/customer/notice/list');
			});
		} else {
			res.redirect('/customer/admin/login/customer-notice-delete-' + id);
		}
	});
});

// notice Login
app.get('/customer/admin/login/:redirect', function(req, res){
	console.log(req.params.redirect);
	res.render('member/login', {data:req.params.redirect});
});

// notice Login Process
app.post('/customer/admin/login/process/:redirect', urlencodedParser, function(req, res){
	var adminId = req.body.admin_id;
	var adminPassword = req.body.admin_password;
	var redicrtPage = '/' + req.params.redirect.split('-').join('/');

	adminLoginModel = mongoose.model('adminLogin', adminLoginSchema);
	
	adminLoginModel.find({admin_id:adminId, admin_password:adminPassword}).exec(function(err, data){
		if(!err){
			if(data.length == 0){
				var sendData = '<script type="text/javascript">';
					sendData +=	'alert("아이디 또는 비밀번호를 확인해 주세요.");';
					sendData +=	'history.back();';
					sendData +=	'</script>';
				res.send(sendData);
			} else {
				res.cookie('user', adminId, {path:'/'});
				res.redirect(redicrtPage);
			}
		}
	});
});

/*************************** listen *******************************/
app.listen(3000, function(){
	console.log('Server on~!');
});

/*************************** util function *************************/
function adminCheck(req, callback){
	var adminLoginModel = mongoose.model('adminLogin', adminLoginSchema);
	var isAdmin = false;

	adminLoginModel.find({}).exec(function(err, data){
		for(var i in data){
			if(req.cookies.user == data[i].admin_id){
				isAdmin = true;
			}
		}

		callback(isAdmin);
	});
}