var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');

var urlencodedParser = bodyParser.urlencoded({extended: false});

app.use(express.static('public'));


/****************  GET Submit ****************/

app.get('/index.htm', function(req, res){
    res.sendFile(__dirname + '/' + 'index.htm');
});

app.get('/process_get', function (req, res) {
    // Prepare output in JSON format
    response = {
        first_name:req.query.first_name,
        last_name:req.query.last_name
    };
    console.log(response);
    res.end(JSON.stringify(response));
});


/**************** POST Submit *****************/

app.get('/index_post.htm', function(req, res){
    res.sendFile(__dirname + '/' + 'index_post.htm');
});

app.post('/process_post', urlencodedParser, function (req, res) {
    // Prepare output in JSON format
    response = {
        first_name:req.body.first_name,
        last_name:req.body.last_name
    };
    console.log(response);
    res.end(JSON.stringify(response));
});


/**************** Read JSON *****************/

app.get('/listUsers', function(req, res){
    fs.readFile(__dirname + '/' + 'user.json', 'utf-8', function(err, data){
        res.end(data);
    });
});



/**************** ADD DATA *****************/

app.get('/addUser', function (req, res) {
    var user = {
        "user4" : {
            "name" : "mohit",
            "password" : "password4",
            "profession" : "teacher",
            "id": 4
        }
    };

    // First read existing users.
    fs.readFile( __dirname + "/" + "user.json", 'utf8', function (err, data) {
        data = JSON.parse( data );
        data["user4"] = user["user4"];
        console.log( data );
        res.end( JSON.stringify(data));
    });
});










/**************** App Listen *****************/

var server = app.listen(3000, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port);
});