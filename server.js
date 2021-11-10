//실행: nodemon server.js
require('dotenv').config(); //.env파일에서 환경변수 불러오기
const { PORT, MONGODB_URI } = process.env;

const port = PORT || 4000;
const { response } = require('express');
const express = require('express');
const app = express();
app.use(express.urlencoded({extended : true}));
//const bodyParser = require('body-parser');
//요청 데이터(body) 해석을 쉽게 도와줌
//express 4.16이상은 필요X
const MongoClient = require('mongodb').MongoClient;
//method-override: HTML에서 PUT/DELETE 요청하기 위해
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

//HTML에 서버데이터 삽입 가능
app.set('view engine', 'ejs');
//미들웨어
app.use('/public', express.static('public'));

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

// app.get('/', function(req, res){
//     res.sendFile(__dirname+'/index.html');
// });

// app.get('/write', function(req, res){
//     res.sendFile(__dirname+'/write.html');
// });

app.get('/', function(req, res){
    //res.sendFile(__dirname+'/index.html');
    res.render('index.ejs');
});

app.get('/write', function(req, res){
    //res.sendFile(__dirname+'/write.html');
    res.render('write.ejs');
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

            //counter라는 collection에 있는 totalPost도 +1 해줘야함. parameter 3가지.
            //1]어떤 데이터를 수정할지
            //2]수정할 값. operator(set,inc,,,) 사용
            //3]콜백함수.(순차적 실행을 위해) 생략가능
            db.collection('counter').updateOne({name:'게시물갯수'}, {$inc: {totalPost:1}}, function(err, result){
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

//삭제
app.delete('/delete', function(req, res){
    console.log(req.body);

    //문자->정수 변환 필요함
    req.body._id=parseInt(req.body._id);

    //req.body에 담겨온 게시물 번호를 가진 글을 DB에서 찾아 삭제
    db.collection('post').deleteOne(req.body, function(err, result){
        console.log('삭제완료');
        //서버는 꼭 뭔가 응답해줘야함
        res.status(200).send({ message: '성공'});
    })
})

//<상세페이지>: '/detail'로 접속하면 detail.ejs 보여줌
//':id'= url의 parameter
app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result){
        if(err) return res.sendStatus(400).send(err);

        console.log(result);
        //{'data'라는 이름으로 : result 데이터를}
        res.render('detail.ejs', {data : result});
    })
})

app.get('/edit/:id', function(req, res){
    //params.id: url의 파라미터 중 ':id'
    db.collection('post').findOne({_id: parseInt(req.params.id)}, function(err, result){
        if(err) return res.sendStatus(400).send(err);
        res.render('edit.ejs', {post: result});
    })
})

app.put('/edit', function(req, res){
    //폼에 담긴 제목,날짜 데이터를 가지고 db.collection에 업데이트
    //updateOne(어떤게시물수정할건지,수정값,콜백함수)
    db.collection('post').updateOne({_id: parseInt(req.body.id)}, {$set: {title: req.body.title, contents: req.body.contents}}, function(err, result){
        console.log('수정완료');
        //수정완료하면 list로 이동
        //응답코드가 꼭 필요함!!!안그러면 서버멈춤
        res.redirect('/list'); 
    })
})

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

//요청과 응답 중간에서 작동하는 미들웨어
app.use(session({secret:'비밀코드', resave:true, saveUninitialized:false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res){
    res.render('login.ejs');
})

//[1] '/login'으로 POST요청 하면 (로그인 요청하면)
app.post('/login', passport.authenticate('local',{
    failureRedirect: '/fail'
}), function(req, res){
    res.redirect('/')
});

//[2] 여기서 아이디와 비밀번호를 검증하고.
//Strategy: 인증하는 방법
passport.use(new LocalStrategy({
    //유저가 입력한 아이디, 비번 항목이 뭔지 정의 (name 속성)
    usernameField:'id',
    passwordField:'pw',
    session: true, 
    passReqToCallback: false,
}, function(inputId, inputPw, done){ //콜백함수에서 사용자가 입력한 아이디, 비번 검증
    //done(서버에러, 성공시 사용자 DB데이터, 에러메세지)
    console.log(inputId, inputPw);
    db.collection('login').findOne({id: inputId}, function(err, result){
        if(err) return done(err)

        //DB에 아이디가 없을때
        if(!result) return done(null, false, {message:'존재하지 않는 아이디입니다.'})

        //pw가 암호화되지 않음 -> 보안이 개th-레기
        if(inputPw==result.pw){
            return done(null, result)
        }else{
            return done(null, false, {message:'비밀번호가 틀립니다.'})
        }
    })
}));

//[3] 아이디, 비번 맞으면 세션정보를 만듦
//id를 이용해 세션을 저장하는 코드(로그인 성공시 발동)
//user: 아이디, 비번 검증 성공시 여기에 담아져옴
//만든 세션의 id정보를 쿠키로 보냄
passport.serializeUser(function(user, done){
    done(null, user.id)
});
//이 세션 데이터를 가진 사람을 DB에서 찾아주세요(나중에 마이페이지 접속시 발동)
passport.deserializeUser(function(아이디, done){
    done(null, {})
})