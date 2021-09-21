const { response } = require('express');
const express = require('express');
const app = express();
//const bodyParser = require('body-parser'); 
//express 4.16이상은 필요X
//요청 데이터(body) 해석을 쉽게 도와줌
app.use(express.urlencoded({extended : true}));

app.listen(4000, function(){
    console.log('listening on 4000');
});

//누군가가 /pet으로 방문을 하면
//pet 관련 안내문을 띄워주자 ->콜백함수를 이용해서
app.get('/pet', function(req, res){
    res.send("pet page");
});

app.get('/', function(req, res){
    res.sendFile(__dirname+'/index.html');
});

app.get('/write', function(req, res){
    res.sendFile(__dirname+'/write.html');
});
//콜백함수: 함수안의 함수. 순차적으로 단계적으로 실행하고 싶을 때.
//요청,응답

//어떤사람이 /add경로로 POST요청을 하면 ???를 해주세요~
app.post('/add', function(req, res){
    res.send('전송완료');
    console.log(req.body.contents);
    //REST API-DB에 저장해주세요
});

//nodemon server.js