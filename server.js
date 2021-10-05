//실행: nodemon server.js
require('dotenv').config(); //.env파일에서 환경변수 불러오기
const { PORT, MONGODB_URI }=process.env;

const port= PORT || 4000;
const { response } = require('express');
const express = require('express');
const app = express();
app.use(express.urlencoded({extended : true}));
//const bodyParser = require('body-parser');
//요청 데이터(body) 해석을 쉽게 도와줌
//express 4.16이상은 필요X
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs'); //HTML에 서버데이터 삽입 가능

var db;
MongoClient.connect(MONGODB_URI, 
function(err, client){
    if(err) return console.log(err);

    //todoapp이라는 database(폴더)에 연결
    db=client.db('todoapp');

    app.listen(port, function(){
        console.log(`listening at http://localhost:${port}`);
    });
})



//누군가가 /pet으로 방문을 하면
//pet 관련 안내문을 띄워주자 ->콜백함수를 이용해서
//콜백함수: 함수안의 함수(파라미터: 요청,응답). 
//순차적으로 단계적으로 실행하고 싶을 때.
app.get('/pet', function(req, res){
    res.send("pet page");
});

app.get('/', function(req, res){
    res.sendFile(__dirname+'/index.html');
});

app.get('/write', function(req, res){
    res.sendFile(__dirname+'/write.html');
});


//'todoapp'이라는 database(폴더), 'post'라는 collection(파일)

//어떤 사람이 /add라는 경로로 post 요청을 하면 
//데이터 2개(제목, 날짜)를 보내주는데,
//이때 post라는 이름을 가진 collection에 두개 데이터를 저장하기
//{제목: 'ㅁㅁㅁ', 날짜: 'ㅇㅇㅇ'}
app.post('/add', function(req, res){
    //항상 존재해야 함. 실패성공 상관없이 뭔가 서버에서 보내주어야 브라우저가 멈추지 않음.
    res.send('전송완료');

    //auto increment 구현
    //counter라는 collection에서 name:'게시물갯수'인 데이터를 찾아주세요
    db.collection('counter').findOne({name: '게시물갯수'}, function(err, result){
        console.log(result.totalPost); 

        var totalCnt=result.totalPost; //총 게시물갯수
        db.collection('post').insertOne( { _id: totalCnt+1, title : req.body.title, contents : req.body.contents}, function(err, res){
            console.log('저장완료');

            //counter라는 collection에 있는 totalPost도 +1 해줘야함.
            //1]어떤 데이터를 수정할지
            //2]수정할 값. operator(set,inc,,,) 사용
            //3]콜백함수.(순차적 실행을 위해) 생략가능
            db.collection('counter').updateOne({name:'게시물갯수'}, {$inc: {totalPost:1}}, function(err, res){
                if(err) return console.log(err);
            })
        });
    });
});

//list로 GET요청을 하면 실제 DB에 저장된 데이터들로 예쁘게 꾸며진 HTML을 보여줌.
app.get('/list', function(req, res){
    //DB에 저장된 post라는 collection안의 제목이 ㅁㅁ인 데이터를 꺼내주세요
    //찾은 데이터 EJS파일에 집어넣기
    db.collection('post').find().toArray(function(err, result){
        //result라는 데이터를 posts라는 이름으로 작명해서 EJS파일에 보내주세요
        console.log(result);
        res.render('list.ejs', { posts: result });
    });
});
