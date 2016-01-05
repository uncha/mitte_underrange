var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false});
var utilModule = require('./util_module');

module.exports = commentModule;
module.exports.setRouter = setRouter;
function commentModule(){

}

// type : String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array
var commentSchema = mongoose.Schema({
    parent:{type:String},
    name:{type:String},
    password:{type:String},
    content:{type:String},
    createAt:{type:Date, default:Date.now()}
});
var commentModel = mongoose.model('comment', commentSchema);

function setRouter(app){
    // write
    app.post('/comment/write/:parent', urlencodedParser, function(req, res){

    });

    //

    //update
    app.post('/comment/update/:parent/:id', urlencodedParser, function(req, res){

    });

    //delete
}

function getCommentList(parentId, callback){
    commentModel.find({parent:parentId}).sort({_id:-1}).exec(function(err, data){
        callback(data);
    });
}