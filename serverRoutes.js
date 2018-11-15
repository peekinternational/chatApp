/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/

const bcrypt          = require('bcrypt');
const userModel       = require('./model/users-model');
const chatModel       = require('./model/chatModel');
const groupsModel     = require('./model/groupsModel');
const mongoose        = require('mongoose');
const chatController  = require('./controller/chatController');

module.exports = function(app,io,saveUser){

    /*create new object of chatController*/
    var chatCon = new chatController(io,saveUser);
   
    app.post('/login',chatCon.login);
    app.post('/groupChat',chatCon.groupChat);
    app.get('/checkSession',chatCon.checkSession);
    app.get('/createUser/:name',chatCon.createUser);
    app.get('/getUsers',chatCon.getUsers);
    app.post('/addgroup',chatCon.addGroup);
    app.get('/getGroups/:userId',chatCon.getGroups);
    app.post('/chat',chatCon.chat);
    app.post('/updateChat/:id',chatCon.updateChat);
    app.get('/getChat/:senderId/:recevierId',chatCon.getChat);
    app.get('/getGroup/:groupId/:mem_id',chatCon.getGroup);
    app.get('/deleteMsg/:msgId/:type',chatCon.deleteMsg);
    app.get('/logout',chatCon.logout);
    app.post('/updateGroupChat/:id',chatCon.updateGroupChat);
    app.get('/deleteGroupMsg/:msgId/:type/:groupId',chatCon.deleteGroupMsg);
    app.get('/getNotification/:userId',chatCon.getNotification);
    app.post('/notificationseen',chatCon.notificationseen);
   
}