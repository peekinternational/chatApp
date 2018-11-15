/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/
const bcrypt      = require('bcrypt');
const userModel   = require('../model/users-model');
const chatModel   = require('../model/chatModel');
const groupsModel = require('../model/groupsModel');
const notifiModel = require('../model/notificationModel');
const mongoose    = require('mongoose');
const helpers     = require('../helperfunctions/helpers');

module.exports = function(io,saveUser){
	var User;
	/*custom helper functions */
	var helper = new helpers(io);
	/*main router object which contain all function*/
	var router = {};

	router.groupChat = function(req,res){
        var id = req.body.id;
        var senderId = req.body.senderId;
        var message = req.body.message;
        var name = req.body.name;
        groupsModel.update({_id:id},{$push:{message:{name:name,sender:senderId,message:message}},lastMsg:message},function(err,data){
            if(err) throw err;
            groupsModel.findOne({_id:id}).limit(1).exec(function(err,data){
                if(err) throw err;
                res.json(data);
                helper.RTGU();
            })
        })
        
    }

    router.getUsers = function(req,res){
    	userModel.find({}).sort({updatedAt:-1}).exec(function(err,data){
    		res.json(data);
    	});
    }

    router.addGroup = function(req,res){
        var members = req.body.members;
        var obj = [];
        members.forEach(function(mem){
            obj.push({id:mem._id,name:mem.name,isseen:false});
        });
        var group = new groupsModel({
            'members': obj,
            'name': req.body.groupName,
        });
        group.save(function(err,data){
            res.json(data);
            helper.RTGU();
        })
        
    }

    router.getGroups = function(req,res){
        groupsModel.find({ members: { $elemMatch: { id: req.params.userId } } },function(err,data){
            if(err) throw err;
            res.json(data);
        })
    }

    router.chat = function(req,res){
        var sender = req.body.senderId;

        var name = req.body.senderName;
        var recevier = req.body.recevierId;
        var message = req.body.message;
        newMessage = new chatModel({
            "senderId":sender,
            "senderName":name,
            "recevierId":recevier,
            "message":message,
        });
        newMessage.save(function(err,data){
            if(err) throw err;
            /* update and push new message in recevier and sender user*/
            helper.addNewMessage(data);
            res.json(data);
        })
    }


        /* add notification to notification table*/
        newNotification = new notifiModel({
            "senderId":sender,
            "recevierId":recevier,
            "message":message,
        });
        newNotification.save(function(err,data){
            if(err) throw err;
        })
    }
    router.getNotification = (req,res) => {
        var userId = req.params.userId;
        notifiModel.find({recevierId:userId},function(err,data){
            if (err) throw err;
            notifiModel.count({recevierId:userId,isseen:false},function(err,count){
            res.json({count:count,noti:data});
            })
            
        })
    }
    router.getChat = function(req,res){
        var sender = req.params.senderId;
        var receiver = req.params.recevierId;
        
        var updateUnReadMsgQuery = {_id:receiver,chat:{$elemMatch:{senderId:receiver,recevierId:sender}}},
	        updatedata ={$set:{'chat.$.unreadMsg':0}};
            userModel.update(updateUnReadMsgQuery,updatedata,function(err,data){
            	helper.RTU();
            })
        chatModel.find({$or:[{senderId:sender,recevierId:receiver},{senderId:receiver,recevierId:sender}]}).exec(function(err,data){
            if(err) throw err;
            res.json(data);
        });
    }

    router.getGroup = function(req,res){
       var id = req.params.groupId;
       var memId = req.params.mem_id;
       groupsModel.update({_id:id,members:{$elemMatch:{id:memId}}},{$set:{'members.$.isseen':true}},function(err,data){
        if(err) throw err;
        helper.getData(groupsModel,{_id:id},function(data){
            helper.RTGU();
            res.json(data);
        })
       })
       
    }

    router.checkSession = function(req,res){
    	if(req.session.user){
            helper.changeStatus(req.session.user._id,{status:'online'},function(data){
                helper.RTU();
                res.json(data);
            });
    		
    	}else{
    		res.status(401).send();
    	}
    }

	router.login = function(req,res){
    	var email = req.body.email;
    	var password = req.body.password;
    	
    	helper.getData(userModel,{email:email},function(user){
            if(user.length > 0){
                User = user[0];
                /*check password*/
                if(bcrypt.compareSync(password, User.password)){
                    /*change status from offline to online*/
                    helper.changeStatus(User._id,{status:'online'},function(data){
                        /*set session */
                        req.session.user = User;
                        /*this function use to move user info to another view*/
                        saveUser(User);
                        /*get users to show order by newly messages*/
                        helper.RTU();
                        res.json(User);
                    });
                    
                }else{
                    res.status(401).send();
                }
            }else{
                res.status(401).send();
            }
    		
    	});
    }
	router.createUser = function (req,res){
		var name = req.params.name;
		var newUser = new userModel({
	    		"name":name,
	    		"email":name+"@gmail.com",
	    		"password": helper.incrypt(name),
	    		"phone":03339876859,
	    		"country":"pakistan"
	    	});
	    	newUser.save(function(err,data){
	    		if(err) throw err;
	    		res.json(data);
	    	})
	}

	router.logout = function(req,res){
        if(User){
            helper.changeStatus(User._id,{status:'offline'},function(data){
               req.session.destroy(function(err) {
                    res.status(404).send();
                })
               helper.RTU();
               res.json({msg:"session destroy"});
            });
        }
    }

    router.deleteMsg = function(req,res){
        var msgId = req.params.msgId;
        var type = req.params.type;
        chatModel.findByIdAndUpdate(msgId,{delete:type},function(err,data){
            if (err) throw err;
            res.json(data);
        })
    }
    router.updateChat = function(req,res){
        var chatId = req.params.id;
        var message = req.body.message;
        chatModel.findByIdAndUpdate(chatId,{message:message},{new:true},function(err,data){
            if (err) throw err;
            helper.addNewMessage(data);
            res.json(data);
        })
    }

    router.updateGroupChat = function(req,res){
        var id = req.params.id;
        var message = req.body.message;
        var groupId = req.body.groupId;
        groupsModel.update({'message._id':id},{$set:{'message.$.message':message}},function(err,data){
            if(err) throw err;
            helper.getData(groupsModel,{_id:groupId},function(data){
                res.json(data);
            })
        });
    }
    router.notificationseen = (req,res) => {
       userId =  req.body.userId;
       notifiModel.update({recevierId:userId},{isseen:true},{multi:true},function(err,data){
        if (err) throw err;
        console.log(data);
        res.json(data);
       })

    }
    router.deleteGroupMsg = function(req,res){
        var msgId = req.params.msgId;
        var type = req.params.type;
        var groupId = req.params.groupId;
        groupsModel.update({'message._id':msgId},{$set:{'message.$.delete':type}},function(err,data){
            if(err) throw err;
            helper.getData(groupsModel,{_id:groupId},function(data){
                res.json(data);
            })
        });
    }





	return router;
}
