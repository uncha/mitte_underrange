var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var multer  = require('multer');
// custom module
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

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

var limits = { fileSize: 2 * 1024 * 1024 }; // 2MB
var upload = multer({
    storage: storage,
    limits:limits,
    fileFilter:function(req, file, cb){
        var type = file.mimetype;
        var typeArray = type.split("/");
        if (typeArray[0] == "video" || typeArray[0] == "image") {
            cb(null, true);
        }else {
            cb(null, false);
        }
    }
});
var type = upload.single('uploadFile');

/*************************** router *******************************/
// root
app.get('/', function(req, res){
    res.render('index', {user:req.cookies.member});
});

// 회사소개
app.get('/company/introduce', function(req, res){
    res.render('company/introduce', {user:req.cookies.member});
});

app.get('/upload', function(req, res){
    res.render('upload');
});

app.post('/upload', type, function (req, res, next) {
    if(req.file){
        res.send('<script>alert("업로드성공!"); location.href="/upload";</script>')
    } else {
        res.send('<script>alert("업로드실패!"); location.href="/upload";</script>')
    }
});

app.get('/se2', function(req, res){
    res.render('se2');
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