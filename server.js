const { response } = require('express');
const express = require('express');
const app = express();

app.listen(4000, function(){
    console.log('listening on 4000')
});

//누군가가 /pet으로 방문을 하면
//pet 관련 안내문을 띄워주자
app.get('/pet', function(req, res){
    res.send("pet page");
});

app.get('/', function(req, res){
    res.sendFile(__dirname+'/index.html')
})