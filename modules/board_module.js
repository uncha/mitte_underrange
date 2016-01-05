var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false});
var memberModule = require('./member_module');
var utilModule = require('./util_module');

module.exports = boardModule;
module.exports.setRouter = setRouter;
function boardModule(){

}

// type : String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array
var boardSchema = mongoose.Schema({
    // default field(수정 금지)
    parent:{type:String},
    ancestor:{type:String},
    step:{type:Number, default:0},
    depth:{type:Number, default:0},
    comment:{type:Boolean, default:false},
    subject:{type:String},
    content:{type:String},
    writer:{type:String},
    password:{type:String},
    hits:{type:Number, default:0},
    user_id:{type:String},
    hidden:{type:Boolean, default:false},
    createAt:{type:Date, default:Date.now()},
    // add field
    field1:{type:String}
});

/*
 * board setting **********************************************************************************
 * 게시판 생성시 boardSetting에 카테고리를 추가한뒤 views/board/카테고리 폴더를 생성한뒤 게시판 파일을 복사해야 합니다.
 * boardSetting에 추가된 카테고리를 작성해 줍니다.
 */
var boardSetting = {
    // default setting(수정금지)
    // Auth 관리자는 9번
    default:{render:'default', listSize:10, pageSize:5, reply:true, comment:true, listAuth:0, viewAuth:0, writeAuth:0, replyAuth:0, updateAuth:0, deleteAuth:0},
    // add category(* 반드시 collection 정보를 입력해 주어야 함)
    notice:{collection:'notice', subject:'공지사항', reply:false, comment:false, writeAuth:9, replyAuth:9, updateAuth:9, deleteAuth:9},
    qna:{collection:'qna', render:'qna', subject:'질문과답변', reply:true, comment:false}
};

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
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
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
                });
            });
        });
    });

    // write
    app.get('/board/:category/write', function(req, res){
        var category = req.params.category;
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});

        authCheck(req, res, req.url, setting.writeAuth, function() {
            res.render('board/' + setting.render + '/write', {user: req.cookies.member, category: category, setting: setting});
        });
    });

    // write_process
    app.post('/board/:category/write_process', urlencodedParser, function(req, res){
        var category = req.params.category;
        var data = req.body;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

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
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        authCheck(req, res, req.url, setting.viewAuth, function() {
            boardModel.findOne({_id: id}, function (err, data) {
                data.hits++;
                data.save(function (err) {
                    res.render('board/' + setting.render + '/view', {
                        user: req.cookies.member,
                        data: data,
                        category: category,
                        setting: setting
                    });
                });
            });
        });
    });

    // update
    app.get('/board/:category/update/:id', function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
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
    app.post('/board/:category/update_process/:id', urlencodedParser, function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var data = req.body;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
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
                    if (originData.password == data.password || req.cookies.member.boardAuth == 9) {
                        var updateData = utilModule.extend(originData, data);

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

    // delete
    app.get('/board/:category/delete/:id', function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
        var boardModel = mongoose.model(collection, boardSchema);

        authCheck(req, res, req.url, setting.deleteAuth, function() {
            boardModel.findOne({_id:id}, function(err, data){
                res.render('board/' + setting.render + '/delete', {user:req.cookies.member, data:data, category:category, setting:setting});
            });
        });
    });

    // delete process not login
    app.post('/board/:category/delete_process/:id', urlencodedParser, function(req, res){
        var category = req.params.category;
        var id = req.params.id;
        var data = req.body;
        var collection = boardSetting[category].collection;
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
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
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
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
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
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
        var setting = utilModule.extend(boardSetting.default, boardSetting[category] || {});
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

    // comment_process

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