var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false});
var multer  = require('multer');
var fs = require('fs');
var path = require('path');
var memberModule = require('./member_module');
var utilModule = require('./util_module');

module.exports = boardModule;
module.exports.setRouter = setRouter;

function boardModule(){

}

// type : String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array
var boardSchema = mongoose.Schema({
    // default field(수정 금지)
    parent:String,
    ancestor:String,
    step:{type:Number, default:0},
    depth:{type:Number, default:0},
    subject:String,
    content:String,
    writer:String,
    password:String,
    hits:{type:Number, default:0},
    user_id:String,
    hidden:{type:Boolean, default:false},
    createAt:{type:Date, default:Date.now()},
    // add field
    field1:String, // email
    file1:mongoose.Schema.Types.Mixed,
    file2:mongoose.Schema.Types.Mixed,
    image1:mongoose.Schema.Types.Mixed,
    image2:mongoose.Schema.Types.Mixed,
    image3:mongoose.Schema.Types.Mixed,
    image4:mongoose.Schema.Types.Mixed,
    image5:mongoose.Schema.Types.Mixed
});

var commentSchema = mongoose.Schema({
    category:String,
    listId:String,
    parent:String,
    parent_writer:String,
    ancestor:String,
    step:{type:Number, default:0},
    depth:{type:Number, default:0},
    content:String,
    writer:String,
    password:String,
    user_id:String,
    hidden:{type:Boolean, default:false},
    createAt:{type:Date, default:Date.now()}
});
var commentModel = mongoose.model('comment', commentSchema);

var tempImageSchema = mongoose.Schema({
    fileURI:String,
    createAt:{type:Date, default:Date.now()}
});
var tempImageModel = mongoose.model('tempImage', tempImageSchema);

/*
 * board setting **********************************************************************************
 * 게시판 생성시 boardSetting에 카테고리를 추가한뒤 views/board/카테고리 폴더를 생성한뒤 게시판 파일을 복사해야 합니다.
 * boardSetting에 추가된 카테고리를 작성해 줍니다.
 */
var boardSetting = {
    // default setting(수정금지)
    // Auth 관리자는 9번
    default:{collection:'', render:'default', listSize:10, pageSize:5, reply:true, comment:true, listAuth:0, viewAuth:0, writeAuth:0, replyAuth:0, updateAuth:0, deleteAuth:0, commentAuth:0},
    // add category(* 반드시 collection 정보를 입력해 주어야 함)
    notice:{collection:'notice', subject:'공지사항', reply:false, comment:false, writeAuth:9, replyAuth:9, updateAuth:9, deleteAuth:9},
    qna:{collection:'qna', subject:'질문과답변', reply:true, comment:true, commentAuth:0}
};

// file upload multer setting
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
var limits = { fileSize: 2 * 1024 * 1024 }; // 업로드 가능 파일 개당 2MB 제한
var limitMimetype = ['html','htm','asp','aspx','php','jsp','cer','cdx','asa','php3','war','js','css','java'];
var fileUpload = multer({
    storage: storage,
    limits:limits,
    fileFilter:function(req, file, cb){
        var type = file.originalname.split(".");
        if (limitMimetype.indexOf(type[1]) > -1) {
            cb(null, false);
        }else {
            cb(null, true);
        }
    }
});
var fileType = fileUpload.fields([{name:'file1', maxCount:1},{name:'file2', maxCount:1}]);

var imageUpload = multer({
    storage: storage,
    limits:limits,
    fileFilter:function(req, file, cb){
        var type = file.mimetype.split("/");
        if (type[0] == 'image') {
            cb(null, true);
        }else {
            cb(null, false);
        }
    }
});
var imageType = imageUpload.fields([
    {name:'image1', maxCount:1},
    {name:'image2', maxCount:1},
    {name:'image3', maxCount:1},
    {name:'image4', maxCount:1},
    {name:'image5', maxCount:1}
]);

// router setting
function setRouter(app){
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
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);
        var skipSize = (currentPage - 1) * setting.listSize;
        var limitSize = setting.listSize;
        var searchQuery = {};
        authCheck(req, res, req.url, setting.listAuth, function() {
            if (searchValue) {
                searchTypes = searchTypes.split(',');
                if (searchTypes.length > 1) {
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

            boardModel.count(searchQuery, function (err, c) {
                boardModel.find(searchQuery).skip(skipSize).limit(limitSize).sort({
                    ancestor: -1,
                    step: 1
                }).exec(function (err, data) {
                    var startList = data.length - setting.listSize * currentPage + 1;
                    var endList = data.length - setting.listSize * currentPage + setting.listSize;
                    if (startList < 1) startList = 1;

                    if(setting.comment){
                        var cnt = 1;
                        data.forEach(function(e){
                            var _id = e._id;
                            commentModel.count({listId:_id}, function(err, commentCount){
                                e.commentCount = commentCount;
                                if(cnt == data.length){
                                    renderList();
                                }
                                cnt++;
                            });                            
                        });
                    } else{
                        renderList();
                    }

                    function renderList(){
                        res.render('board/' + setting.render + '/list', {
                            user: req.cookies.member,
                            data: data,
                            category: category,
                            totalCount: c,
                            currentPage: currentPage,
                            searchType: searchTypes,
                            searchValue: searchValue,
                            setting: setting
                        });
                    }
                });
            });
        });
    });

    // write
    app.get('/board/:category/write', function(req, res){
        var category = req.params.category;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});

        authCheck(req, res, req.url, setting.writeAuth, function() {
            res.render('board/' + setting.render + '/write', {user: req.cookies.member, category: category, setting: setting});
        });
    });

    // write_process
    app.post('/board/:category/write_process', urlencodedParser, fileType, function(req, res){
        var category = req.params.category;
        var data = req.body;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        for(var prop in req.files){
            data[prop] = req.files[prop][0];
        }

        authCheck(req, res, '/', setting.writeAuth, function() {
            boardModel.create(data, function(err, data) {
                data.ancestor = data._id;
                if(setting.writeAuth > 0){
                    data.writer = req.cookies.member.user_id;
                    data.user_id = req.cookies.member.user_id;
                    data.field1 = req.cookies.member.email;
                }
                data.save(function (err) {
                    res.redirect('/board/' + category + '/view/' + data._id);
                });
            });
        });
    });

    // view
    app.get('/board/:category/view/:id', function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        authCheck(req, res, req.url, setting.viewAuth, function() {
            if(setting.comment){
                commentModel.find({category:category, listId:id}).sort({ancestor:1, step:1}).exec(function(err, commentData){
                    renderView(commentData);
                });
            } else {
                renderView(null);
            }

            function renderView(commentData){
                boardModel.findOne({_id: id}, function (err, data) {
                    data.hits++;

                    data.save(function (err) {
                        res.render('board/' + setting.render + '/view', {
                            user: req.cookies.member,
                            data: data,
                            commentData:commentData,
                            category: category,
                            setting: setting
                        });
                    });
                });
            }
        });
    });

    // update
    app.get('/board/:category/update/:id', function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        authCheck(req, res, '/', setting.updateAuth, function() {
            authCheck(req, res, req.url, setting.viewAuth, function () {
                boardModel.findOne({_id: id}, function (err, data) {
                    res.render('board/' + setting.render + '/update', {
                        user: req.cookies.member,
                        data: data,
                        category: category,
                        setting: setting
                    });
                });
            });
        });
    });

    // update_process
    app.post('/board/:category/update_process/:id', urlencodedParser, fileType, function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var data = req.body;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        authCheck(req, res, '/', setting.updateAuth, function() {
            boardModel.findOne({_id: id}, function (err, originData) {
                if(setting.updateAuth > 0){
                    if(originData.user_id == req.cookies.member.user_id || req.cookies.member.boardAuth == 9){
                        var updateData = utilModule.extend(originData, data);

                        updateData.save(function (err) {
                            res.redirect('/board/' + category + '/view/' + id);
                        });
                    } else {
                        var sendData = utilModule.sendAndBack('수정 권한이 없습니다.');
                        res.send(sendData);
                    }
                } else {
                    if (originData.password == data.password || (req.cookies.member && req.cookies.member.boardAuth == 9)) {
                        var updateData = utilModule.extend(originData, data);

                        // TODO 파일 업로드 작업중
                        for(var prop in req.files){
                            data[prop] = req.files[prop][0];
                        }

                        updateData.save(function (err) {
                            res.redirect('/board/' + category + '/view/' + id);
                        });
                    } else {
                        var sendData = utilModule.sendAndBack('이전에 입력한 비밀번호와 동일한 비밀번호를 입력하셔야 합니다.');
                        res.send(sendData);
                    }
                }
            });
        });
    });
    
    // password
    app.get('/board/:category/password/:id', function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var action = req.query.action;
        var commentId = req.query.commentId;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        if(!commentId){
            authCheck(req, res, req.url, setting.deleteAuth, function() {
                res.render('board/' + setting.render + '/password', {user:req.cookies.member, action:action, category:category, setting:setting});
            });
        } else {
            authCheck(req, res, req.url, setting.commentAuth, function() {
                res.render('board/' + setting.render + '/password', {user:req.cookies.member, action:action, category:category, setting:setting});
            });
        }
    });

    // delete process not login
    app.post('/board/:category/delete_process/:id', urlencodedParser, function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var data = req.body;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        authCheck(req, res, req.url, setting.deleteAuth, function() {
            boardModel.findOne({_id:id}, function(err, originData){
                if(originData.password == data.password){
                    boardModel.findOne({parent:id}, function(err, data){
                        if(!data) {
                            boardModel.findByIdAndRemove(id, function (err) {
                                var sendData = utilModule.sendAndBack('삭제하였습니다.', '/board/' + category + '/list');
                                res.send(sendData);
                            });
                        } else {
                            var sendData = utilModule.sendAndBack('답글이 있는 글은 삭제하실 수 없습니다.', '/board/' + category + '/view/' + id);
                            res.send(sendData);
                        }
                    });
                } else {
                    var sendData = utilModule.sendAndBack('이전에 입력한 비밀번호와 동일한 비밀번호를 입력하셔야 합니다.');
                    res.send(sendData);
                }
            });
        });
    });

    // delete process login
    app.get('/board/:category/delete_process/:id', function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        if(!req.cookies.member){
            res.redirect('/member/login?redirect=' + '/board/' + category + '/view/' + id);
            return;
        }

        boardModel.findOne({_id:id}, function(err, originData) {
            if (originData.user_id == req.cookies.member.user_id || (req.cookies.member && req.cookies.member.boardAuth == 9)) {
                boardModel.findOne({parent:id}, function(err, data){
                    if(!data) {
                        boardModel.findByIdAndRemove(id, function (err) {
                            var sendData = utilModule.sendAndBack('삭제하였습니다.', '/board/' + category + '/list');
                            res.send(sendData);
                        });
                    } else {
                        var sendData = utilModule.sendAndBack('답글이 있는 글은 삭제하실 수 없습니다.');
                        res.send(sendData);
                    }
                });
            } else {
                var sendData = utilModule.sendAndBack('삭제 권한이 없습니다.');
                res.send(sendData);
            }
        });
    });

    // reply
    app.get('/board/:category/reply/:id', function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        if(!setting.reply){
            res.send('<script>history.back();</script>');
            return;
        }

        authCheck(req, res, req.url, setting.replyAuth, function() {
            boardModel.findOne({_id: id}, function (err, data) {
                res.render('board/' + setting.render + '/reply', {
                    user: req.cookies.member,
                    data: data,
                    category: category,
                    setting: setting
                });
            });
        });
    });

    // reply_process
    app.post('/board/:category/reply_process/:id', urlencodedParser, function(req, res){
        var category = req.params.category;
        var replyId = req.params.id;
        var data = req.body;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        if(!setting.reply){
            res.send('<script>history.back();</script>');
            return;
        }

        authCheck(req, res, '/', setting.replyAuth, function() {
            boardModel.findOne({_id: replyId}, function (err, replyData) {
                var ancestor = replyData.ancestor;
                var depth = replyData.depth + 1;
                var step = replyData.step + 1;

                boardModel.find({ancestor: replyData.ancestor, step: {$gt: replyData.step}}).exec(function (err, db) {
                    data.ancestor = ancestor;
                    data.depth = depth;
                    data.step = step;
                    data.parent = replyId;

                    if(setting.writeAuth > 0){
                        data.writer = req.cookies.member.user_id;
                        data.user_id = req.cookies.member.user_id;
                        data.field1 = req.cookies.member.email;
                    }

                    for (var i = 0; i < db.length; i++) {
                        db[i].step++;
                        db[i].save();
                    }

                    boardModel.create(data, function (err, data) {
                        res.redirect('/board/' + category + '/view/' + data.id);
                    });
                });
            });
        });
    });

    // comment-write
    app.post('/board/:category/comment/write_process/:listId/:parent', urlencodedParser, function(req, res){
        var category = req.params.category;
        var parent = req.params.parent;
        var listId = req.params.listId;
        var data = req.body;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});

        if(!setting.comment){
            res.send('<script>history.back();</script>');
            return;
        }

        data.listId = listId;
        data.category = category;

        authCheck(req, res, '/', setting.commentAuth, function() {
            if(setting.commentAuth > 0){
                data.writer = req.cookies.member.user_id;
                data.user_id = req.cookies.member.user_id;
            }

            commentModel.findOne({_id:parent}, function (err, commentData) {
                if(commentData){ // 댓글의 댓글인 경우
                    data.parent_writer = commentData.writer;
                    data.parent = parent;

                    var ancestor = commentData.ancestor;
                    var depth = commentData.depth + 1;
                    var step = commentData.step + 1;

                    commentModel.find({ancestor: commentData.ancestor, step: {$gt: commentData.step}}).exec(function (err, db) {
                        data.ancestor = ancestor;
                        data.depth = depth;
                        data.step = step;

                        for (var i = 0; i < db.length; i++) {
                            db[i].step++;
                            db[i].save();
                        }

                        commentModel.create(data, function (err, data) {
                            res.redirect('/board/' + category + '/view/' + listId);
                        });
                    });
                } else {
                    commentModel.create(data, function (err, data) {
                        data.ancestor = data._id;

                        data.save(function(err, data){
                            res.redirect('/board/' + category + '/view/' + listId);
                        });
                    });
                }
            });
        });
    });
    
    //comment-delete get
    app.get('/board/:category/comment/delete_process/:listId/:commentId', function(req,res){
        var category = req.params.category;
        var listId = req.params.listId;
        var commentId= req.params.commentId;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});

        if(!setting.comment){
            res.send('<script>history.back();</script>');
            return;
        }

        commentModel.findOne({_id:commentId}, function(err, originData) {
            if (originData.user_id == req.cookies.member.user_id || (req.cookies.member && req.cookies.member.boardAuth == 9)) {
                commentModel.findOne({parent:commentId}, function(err, data){
                    if(!data) {
                        commentModel.findByIdAndRemove(commentId, function (err) {
                            var sendData = utilModule.sendAndBack('삭제하였습니다.', '/board/' + category + '/view/' + listId);
                            res.send(sendData);
                        });
                    } else {
                        var sendData = utilModule.sendAndBack('답글이 있는 글은 삭제하실 수 없습니다.');
                        res.send(sendData);
                    }
                });
            } else {
                var sendData = utilModule.sendAndBack('삭제 권한이 없습니다.');
                res.send(sendData);
            }
        });
    });

    //comment-delete post
    app.post('/board/:category/comment/delete_process/:listId/:commentId', urlencodedParser, function(req,res){
        var category = req.params.category;
        var listId = req.params.listId;
        var commentId= req.params.commentId;
        var data = req.body;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extendSetting(boardSetting.default, boardSetting[category] || {});

        commentModel.findOne({_id:commentId}, function(err, originData){
            if(originData.password == data.password){
                commentModel.findOne({parent:commentId}, function(err, data){
                    if(!data) {
                        commentModel.findByIdAndRemove(commentId, function (err) {
                            var sendData = utilModule.sendAndBack('삭제하였습니다.', '/board/' + category + '/view/' + listId);
                            res.send(sendData);
                        });
                    } else {
                        var sendData = utilModule.sendAndBack('답글이 있는 글은 삭제하실 수 없습니다.', '/board/' + category + '/view/' + listId);
                        res.send(sendData);
                    }
                });
            } else {
                var sendData = utilModule.sendAndBack('이전에 입력한 비밀번호와 동일한 비밀번호를 입력하셔야 합니다.');
                res.send(sendData);
            }
        });
    });

    // download file
    app.get('/board/download/:fileURI', function(req, res){
        fs.readFile(path.join(__dirname,'..' ,'/public/uploads/') + req.params.fileURI, function (err, content) {
            res.setHeader('Content-disposition', 'attachment; filename=' + req.params.fileURI);
            res.end(content);
        });
    });

    // editor image_upload
    app.get('/popup/image_upload', function(req, res){
        res.render('popup/image_upload', {user: req.cookies.member});
    });

    app.post('/popup/image_upload_process', urlencodedParser, imageType, function(req, res){
        console.log(req.files);
        res.end();
    });
};

function authCheck(req, res, redirect, authNum, callback){
    if(authNum == 0){
        callback();
        return;
    }

    if(!req.cookies.member){
        res.redirect('/member/login?redirect=' + redirect);
        return;
    }

    if(!req.cookies.member.boardAuth || req.cookies.member.boardAuth < authNum) {
        var sendData = utilModule.sendAndBack('이용 권한이 없습니다.', '/');
        res.send(sendData);
        return;
    } else {
        callback();
        return;
    }
}