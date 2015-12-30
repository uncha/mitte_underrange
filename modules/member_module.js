var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false});
var utilModule = require('./util_module');

module.exports = memberModule;
module.exports.setRouter = setRouter;
function memberModule(){

}

// type : String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array
var memberSchema = mongoose.Schema({
    user_id:{type:String},
    password:{type:String},
    name:{type:String},
    email:{type:String},
    birth:Date,
    sex:String,
    phone:Array,
    sendEmail:Boolean,
    sendSMS:Boolean,
    boardAuth:{type:Number, default:1}
});
var memberModel = mongoose.model('member', memberSchema);

function setRouter(app){
    // login
    app.get('/member/login', function(req, res){
        res.render('member/login', {redirect:req.query.redirect, user:req.cookies.member});
    });

    // login process
    app.post('/member/login_process', urlencodedParser, function(req, res){
        var userId = req.body.user_id;
        var password = req.body.password;

        memberModel.findOne({user_id:userId, password:password}, function(err, data){
            if(!data){
                var sendData = utilModule.sendAndBack('아이디 또는 비밀번호를 다시 화인하세요.\\n등록되지 않은 아이디 이거나, 아이디 또는 비밀번호를 잘못 입력하셨습니다.');
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

    // logout
    app.get('/member/logout', function(req, res){
        res.clearCookie('member');
        res.redirect('/');
    });

    // register
    app.get('/member/register', function(req, res){
        res.render('member/register', {user:req.cookies.member});
    });

    // register_form
    app.post('/member/register_form', urlencodedParser, function(req, res){
        if(!req.body.check1 || !req.body.check2){
            var sendData = utilModule.sendAndBack('회원가입약관과 개인정보취급방침을 읽고 동의해 주셔야 회원가입하실 수 있습니다.');
            res.send(sendData);
        } else {
            res.render('member/register_form', {user:req.cookies.member});
        }
    });

    // register process
    app.post('/member/register_process', urlencodedParser, function(req, res){
        memberModel.create(req.body, function(err, data){
            console.log(data);
        });
    });
}