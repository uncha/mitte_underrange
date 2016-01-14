/*
 * author uncha(kyutae21c@naver.com)
 * member module v0.1.0
 * lastest 2016.01.14
 */

var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false});
var utilModule = require('./util_module');

module.exports = memberModule;
module.exports.setRouter = setRouter;
module.exports.searchUserId = searchUserId;
function memberModule(){

}

// type : String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array
var memberSchema = mongoose.Schema({
    user_id:{type:String},
    password:{type:String},
    name:{type:String},
    email:{type:String},
    birth:Array,
    sex:String,
    phone:Array,
    sendEmail:Boolean,
    sendSMS:Boolean,
    boardAuth:{type:Number, default:1},
    createAt:{type:Date, default:Date.now()}
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

    // register_form search_user_id
    app.get('/member/register_form/:searchUID', function(req, res){
        var searchUID = req.params.searchUID;
        searchUserId(searchUID, function(data){
            if(data){
                var sendData = utilModule.sendAndBack('이미 존재하는 아이디 입니다.');
                res.send(sendData);
            } else {
                var sendData = utilModule.sendAndBack('이용가능한 아이디 입니다.');
                res.send(sendData);
            }
        });
    });

    // register process
    app.post('/member/register_process', urlencodedParser, function(req, res){
        var birth = [];
        birth[0] = req.body['birth-year'];
        birth[1] = req.body['birth-month'];
        birth[2] = req.body['birth-date']; 

        req.body.birth = birth;

        memberModel.create(req.body, function(err, data){
            console.log(data);
            res.send('회원가입');
        });
    });

    // register_modify
    app.get('/member/modify', function(req, res){
        loginCheck(req, res);
        
        memberModel.findOne({user_id:req.cookies.member.user_id}, function(err, data){
            res.render('member/modify', {data:data, user:req.cookies.member});
        });
    });

    app.post('/member/modify_process', urlencodedParser, function(req, res){
        loginCheck(req, res);

        var birth = [];
        birth[0] = req.body['birth-year'];
        birth[1] = req.body['birth-month'];
        birth[2] = req.body['birth-date'];
        req.body.birth = birth;
        req.body.user_id = req.cookies.member.user_id; // 아이디 수정 방지

        memberModel.findOne({user_id:req.cookies.member.user_id}, function(err, data){
            data = utilModule.extend(data, req.body);
            data.save();

            var sendData = utilModule.sendAndBack('수정하였습니다.', '/');
            res.send(sendData);
        });
    });

    /***************************   admin member ******************************/

    // admin member list
    app.get('/admin/member', function(req, res){
        authCheck(req, res);

        res.redirect('/admin/member/1');
    });
    
    app.get('/admin/member/:currentPage', function(req, res){
        authCheck(req, res);

        var searchQuery = {};
        var searchTypes = req.query.searchType;
        var searchValue = req.query.searchValue;
        var currentPage = req.params.currentPage;
        var listSize = 20;
        var pageSize = 10;
        var skipSize = (currentPage - 1) * listSize;
        var limitSize = listSize;

        if (searchValue) {
            searchQuery[searchTypes] = new RegExp(searchValue, "gi");
        }
        
        memberModel.count(searchQuery, function (err, c) {
            memberModel.find(searchQuery).skip(skipSize).limit(limitSize).sort({_id:-1}).exec(function (err, data) {
                var startList = data.length - listSize * currentPage + 1;
                var endList = data.length - listSize * currentPage + listSize;
                if (startList < 1) startList = 1;

                res.render('admin/member', {
                    data: data,                    
                    totalCount: c,
                    currentPage: currentPage,
                    searchType: searchTypes,
                    searchValue: searchValue,
                    listSize: listSize,
                    pageSize:pageSize
                });
            });
        });
    });
    
    // admin modify process
    app.post('/admin/member/modify_process/:id', urlencodedParser, function(req, res){
        authCheck(req, res);

        var id = req.params.id;
        var redirect = req.query.redirect;

        memberModel.findOne({_id:id}, function(err,data){
            data = utilModule.extend(data, req.body);
            data.save();

            res.send('<script>location.href="' + redirect + '"</script>');
        });
    });

    // admin delete process
    app.get('/admin/member/delete_process/:id', function(req, res){
        authCheck(req, res);

        var id = req.params.id;
        var redirect = req.query.redirect;

        memberModel.findByIdAndRemove(id, function(err, data){
            res.send('<script>location.href="' + redirect + '"</script>');
        });
    });
}

function loginCheck(req, res){
    if(!req.cookies.member){
        res.redirect('/member/login');
    }
}

function searchUserId(searchUID, callback){
    memberModel.findOne({user_id:searchUID}, function(err, data){
        callback(data);
    });
}

function authCheck(req, res){
    if(!req.cookies.member){
        res.redirect('/member/login');
        return;
    }

    if(!req.cookies.member.boardAuth || req.cookies.member.boardAuth < 9){
        var sendData = utilModule.sendAndBack('이용권한이 없습니다.', '/');
        res.send(sendData);
        return;
    }
}