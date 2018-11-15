/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/

const express     = require('express');
const app         = express();
const mongoose    = require('mongoose');
const bcrypt      = require('bcrypt');
const session     = require('express-session');
const userModel   = require('./model/users-model');
const chatModel   = require('./model/chatModel');
const bodyParser  = require('body-parser');
const webpush     = require('web-push');
const sslConfig   = require('./ssl-config');
const options     = {
    	key: sslConfig.privateKey,
    	cert: sslConfig.certificate,
      };
const server    = require('http').Server(app);
const io        = require('socket.io')(server);

 

//*****
//*****
//mongo db connection 
//*****
//*****

const db = "mongodb://localhost/chatApp";
mongoose.connect(db);

//*****
//*****
// define all variable used in app
//*****
//***** 
var users  = [];

const port = 4000;
var authUser;

const publicVapidKey = 'BEU-89R8Bp4KeZEjOSQtFj-3aBvwgFE8iJ20y4CG2H4Mwip9jaX8dkldWsOPJtnp7fcqnQR1FbzVZeQ1YD7N5tA';
const privateVapidKey = 'ntLibayiqZ-KpIC5swgVRep2ywsbn6zEVC0sS10mnaQ';
const port = 4000;
var authUser;


//*****
//*****
// middle ware area 
//*****
//*****
app.use(session({secret:"bluefreelancersajid",resave:false,saveUninitialized:true}));
app.use(express.static('public'));
// Provide access to node_modules folder
app.use('/scripts', express.static(`${__dirname}/node_modules/`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//*****
//*****
// server start
//*****
//***** 

webpush.setVapidDetails('mailto:muhammadsajid9005@gmail.com',publicVapidKey,privateVapidKey);
app.post('/subscribe',(req,res) => {
	//Get push subcription object
	const subscription = req.body.subscription;
	//send 201 resource created
	res.status(201).json({});
	//create payload
	const payload = JSON.stringify({ title :req.body.title});
	//pass object into send notification
	webpush.sendNotification(subscription,payload).catch(err => console.error(err));
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.info('listening on %d', port);
});

//*****
//*****
// routes area 
//*****
//*****
require('./serverRoutes')(app,io,saveUser);
//*****
//*****
// custom function area 
//*****
//*****
function changeStatus(id,status,callback){
	if(status){
		userModel.findByIdAndUpdate(id,{$set:status}).exec(function(err,data){
			if(err) throw err;
			callback(data);
		});
	}
}
function getData(model,obj = 0, callback){
	if(obj != 0 && obj != null){
		model.find(obj).exec(function(err,data){
			if(err){
				callback({err:err});
			}else{
				callback(data);
			}
		});	
	}else{
		model.find({status:"online"}).exec(function(err,data){
			callback(data);
		});
	}
	
}
function saveUser(user){
	authUser = user;
}
//*****
//*****
// socket io events area 
//*****
//*****

io.on('connection', function (socket) {

	/*get new msg and it again to the view*/

	function updateUsers(){
		getData(userModel,{},function(users){ 
			io.emit('getUsers',users);
		});
	};

	/*disconnect user */
	socket.on('disconnect', function () {
		
		if(authUser){
			changeStatus(authUser._id,{status:'away'},function(data){
				updateUsers();
			});
		}
	});
	socket.on('updatechat',(coversation) => {
		io.emit('updateChatAll',coversation);
	});
	socket.on('checkmsg',function(chat){
		io.emit('remsg',chat);
	});
	socket.on('videoCall',function(data){
		io.emit('videoCallToFriend',data);
	})
	socket.on('calldisconnect',function(data){
		io.emit('calldis',data);
	})
	socket.on('callStart',function(data){
		io.emit('startTimmer',data);
	});
	socket.on('updateGroupChat',function(chats){
		io.emit('updateAllGroupChat',chats);
	});
	socket.on('busy',function(data){
		io.emit('userBusy',data);
	});
	socket.on('groupvideoCall',function(data){
		io.emit('reveiceGroupVideoCall',data);
	});
	socket.on('broadcasting',function(data){
		io.emit('receiveBroadcasting',data);
	});
	socket.on('connectUsers',function(data){
		io.emit('updateConnectedUsers',data);
	})
	socket.on('removeconnectUser',function(data){
		io.emit('deductConnectedUser',data);
	})
	socket.on('dropCall',function(data){
		io.emit('callDroped',data);
	})
	socket.on('dropTheCall',function(data){
		io.emit('dropeTheFriendCall',data);
	})
	socket.on('dropTheGroupCall',function(data){
		io.emit('dropeTheMembersCall',data);
	})
});