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
	// type : String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array

var boardSchema = mongoose.Schema({
	// default field(수정 금지)
	parent:{type:String},
	step:{type:Number, default:0},
	depth:{type:Number, default:0},
	comment:{type:String},
	subject:{type:String},
	content:{type:String},
	writer:{type:String},
	password:{type:String},
	hits:{type:Number, default:0},
	user_id:{type:String},
	createAt:{type:Date, default:Date.now()},
	// add field
	field1:{type:String}
});

var memberSchema = mongoose.Schema({
	user_id:{type:String},
	password:{type:String},
	name:{type:String},
	email:{type:String},
	birth:Date,
	sex:String,
	phone:Array,
	sendEmail:Boolean,
	sendSMS:Boolean
});
var memberModel = mongoose.model('member', memberSchema);

/*************************** custom router *******************************/
// root 
app.get('/', function(req, res){
	res.render('index', {user:req.cookies.member});
});

// 회사소개
app.get('/company/introduce', function(req, res){
	res.render('company/introduce', {user:req.cookies.member});
});

/*************************** basic router *******************************/
// ------------------------ member -------------------------------//
// Login
app.get('/member/login', function(req, res){
	res.render('member/login', {redirect:req.query.redirect, user:req.cookies.member});
});

app.post('/member/login_process', urlencodedParser, function(req, res){
	var userId = req.body.user_id;
	var password = req.body.password;

	memberModel.findOne({user_id:userId, password:password}, function(err, data){
		if(!data){
			var sendData = sendAndBack('아이디 또는 비밀번호를 다시 화인하세요.\\n등록되지 않은 아이디 이거나, 아이디 또는 비밀번호를 잘못 입력하셨습니다.');
			res.send(sendData);
		} else {
			// 로그인 쿠키 생성
			res.cookie('member', {
				user_id:data.user_id,
				name:data.name,
				email:data.email,
				boardAuth:data.boardAuth
			});

			var redirectURL = '/';
			if(req.query.redirect) redirectURL = req.query.redirect;
			res.redirect(redirectURL);
		}
	});
});

app.get('/member/logout', function(req, res){
	res.clearCookie('member');
	res.redirect('/');
});

app.get('/member/register', function(req, res){
	res.render('member/register', {user:req.cookies.member});
});

app.post('/member/register_form', urlencodedParser, function(req, res){
	if(!req.body.check1 || !req.body.check2){
		var sendData = sendAndBack('회원가입약관과 개인정보취급방침을 읽고 동의해 주셔야 회원가입하실 수 있습니다.');
		res.send(sendData);
	} else {
		res.render('member/register_form', {user:req.cookies.member});
	}
});

app.post('/member/register/process', urlencodedParser, function(req, res){
	memberModel.create(req.body, function(err, data){
		console.log(data);
	});
});

// ------------------------ board -------------------------------//
/*
 *
 * 게시판 생성시 boardSetting에 카테고리를 추가한뒤 views/board/카테고리 폴더를 생성한뒤 게시판 파일을 복사해야 합니다.
 * boardSetting에 추가된 카테고리를 작성해 줍니다.
 *
 * options
 * collection, subject, listSize, pageSize, reply, comment, login, listAuth, writeAuth, deleteAuth
 *
 */
var boardSetting = {
	// default setting(수정금지)
	// Auth 관리자는 9번
	default:{listSize:10, pageSize:5, reply:true, comment:true, login:false, admin:false, listAuth:0, writeAuth:0, replyAuth:0, updateAuth:0, deleteAuth:0},
	// add category(* 반드시 collection 정보를 입력해 주어야 함)
	notice:{collection:'notice', subject:'공지사항', reply:false, comment:false, login:false, admin:true},
	qna:{collection:'qna', subject:'질문과답변', reply:false, comment:false, login:false, admin:true, writeAuth:1}
};

// list
app.get('/board/:category/list', function(req, res){
	var category = req.params.category;
	res.redirect('/board/' + category + '/list/1');
});

app.get('/board/:category/list/:currentPage', function(req, res){
	var category = req.params.category;
	var currentPage = req.params.currentPage;
	var searchTypes = req.query.searchType;
	var searchValue = req.query.searchValue;
	var collection = boardSetting[category].collection;
	var setting = extend(boardSetting.default, boardSetting[category] || {});
	var boardModel = mongoose.model(collection, boardSchema);
	var skipSize = (currentPage - 1) * setting.listSize;
	var limitSize = setting.listSize;
	var searchQuery = {};

	if(searchValue){
		searchTypes = searchTypes.split(',');
		if(searchTypes.length > 1) {
			searchQuery.$or = [];
			for (var i in searchTypes) {
				searchQuery.$or.push({});
				var searchType = searchTypes[i];
				searchQuery.$or[i][searchType] = new RegExp(searchValue, "gi");
			}
			searchTypes = searchTypes.join('%2C');
		} else {
			searchQuery[searchTypes[0]] = new RegExp(searchValue, "gi");
		}
	}

	boardModel.count(searchQuery, function(err, c){
		boardModel.find(searchQuery).skip(skipSize).limit(limitSize).sort({parent:-1, step:1}).exec(function(err, data){
			var startList = data.length - setting.listSize * currentPage + 1;
			var endList = data.length - setting.listSize * currentPage + setting.listSize;
			if(startList < 1) startList = 1;

			res.render('board/' + category + '/list', {user:req.cookies.member, data:data, category:category, totalCount:c, currentPage:currentPage, searchType:searchTypes, searchValue:searchValue, setting:setting});
		});
	});
});

// write
app.get('/board/:category/write', function(req, res){
	var category = req.params.category;
	var setting = extend(boardSetting.default, boardSetting[category] || {});

	authCheck(req, res, req.url, setting.writeAuth);

	res.render('board/' + category + '/write', {user:req.cookies.member, category:category, setting:setting});
});

// write_process
app.post('/board/:category/write_process', urlencodedParser, function(req, res){
	var category = req.params.category;
	var data = req.body;
	var collection = boardSetting[category].collection;
	var setting = extend(boardSetting.default, boardSetting[category] || {});
	var boardModel = mongoose.model(collection, boardSchema);

	boardModel.create(data, function(err, data){
		data.parent = data._id;
		data.save(function(err){
			res.redirect('/board/' + category + '/view/' + data._id);
		});
	});
});

// view
app.get('/board/:category/view/:id', function(req, res){
	var category = req.params.category;
	var id = req.params.id;
	var collection = boardSetting[category].collection;
	var setting = extend(boardSetting.default, boardSetting[category] || {});
	var boardModel = mongoose.model(collection, boardSchema);

	boardModel.findOne({_id:id}, function(err, data){
		data.hits++;
		data.save(function(err){
			res.render('board/' + category + '/view', {user:req.cookies.member, data:data, category:category, setting:setting});
		});
	});
});

// update
app.get('/board/:category/update/:id', function(req, res){
	var category = req.params.category;
	var id = req.params.id;
	var collection = boardSetting[category].collection;
	var setting = extend(boardSetting.default, boardSetting[category] || {});
	var boardModel = mongoose.model(collection, boardSchema);

	boardModel.findOne({_id:id}, function(err, data){
		res.render('board/' + category + '/update', {user:req.cookies.member, data:data, category:category, setting:setting});
	});
});

// update_process
app.post('/board/:category/update_process/:id', urlencodedParser, function(req, res){
	var category = req.params.category;
	var id = req.params.id;
	var data = req.body;
	var collection = boardSetting[category].collection;
	var setting = extend(boardSetting.default, boardSetting[category] || {});
	var boardModel = mongoose.model(collection, boardSchema);

	boardModel.findOne({_id:id}, function(err, originData){
		var updateData = extend(originData, data);

		updateData.save(function(err){
			res.redirect('/board/' + category + '/view/' + id);
		});
	});
});

// delete
app.get('/board/:category/delete/:id', function(req, res){
	var category = req.params.category;
	var id = req.params.id;
	var collection = boardSetting[category].collection;
	var setting = extend(boardSetting.default, boardSetting[category] || {});
	var boardModel = mongoose.model(collection, boardSchema);

	boardModel.findOne({_id:id}, function(err, data){
		res.render('board/' + category + '/delete', {user:req.cookies.member, category:category, setting:setting});
	});
});

// reply
app.get('/board/:category/reply/:id', function(req, res){
	var category = req.params.category;
	var id = req.params.id;
	var collection = boardSetting[category].collection;
	var setting = extend(boardSetting.default, boardSetting[category] || {});
	var boardModel = mongoose.model(collection, boardSchema);

	boardModel.findOne({_id:id}, function(err, data){
		res.render('board/' + collection + '/reply', {user:req.cookies.member, data:data, category:category, setting:setting});
	});
});

// reply_process
app.post('/board/:category/reply_process/:id', urlencodedParser, function(req, res){
	var category = req.params.category;
	var replyId = req.params.id;
	var data = req.body;
	var collection = boardSetting[category].collection;
	var setting = extend(boardSetting.default, boardSetting[category] || {});

	var boardModel = mongoose.model(collection, boardSchema);
	boardModel.findOne({_id:replyId}, function(err, replyData){
		var parent = replyData.parent;
		var depth = replyData.depth + 1;
		var step = replyData.step + 1;

		boardModel.find({parent:replyData.parent, step:{$gt:replyData.step}}).exec(function(err, db){
			data.parent = parent;
			data.depth = depth;
			data.step = step;

			for(var i=0; i<db.length; i++){
				db[i].step++;
				db[i].save();
			}

			boardModel.create(data, function(err, data){
				res.redirect('/board/' + category + '/view/' + data.id);
			});
		});
	});
});

// comment_process

function authCheck(req, res, redirect, authNum){
	if(authNum == 0) return;

	if(!req.cookies.member){
		res.redirect('/member/login?redirect=' + redirect);
	}

	if(!req.cookies.member.auth || req.cookies.member.auth < authNum){
		return false;
	} else {
		return true;
	}
}
































/*************************** listen *******************************/
app.listen(3000, function(){
	console.log('--------------------------------------------------------------------------------');
	console.log(new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate() + '   ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds());
	console.log('--------------------------------------------------------------------------------');
	console.log('Server on~!');
});

/*************************** util function *************************/
function sendAndBack(msg){
	var sendData = '<script type="text/javascript">';
	sendData +=	'alert("' + msg + '");';
	sendData +=	'history.back();';
	sendData +=	'</script>';

	return sendData;
}

function extend(obj, src) {
	for (var key in src) {
		if (src.hasOwnProperty(key)) obj[key] = src[key];
	}
	return obj;
}