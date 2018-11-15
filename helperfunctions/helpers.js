/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/
const bcrypt      = require('bcrypt');
const userModel   = require('../model/users-model');
const chatModel   = require('../model/chatModel');
const groupsModel = require('../model/groupsModel');
const mongoose    = require('mongoose');

module.exports = function(io){
	var helper = {};

	helper.RTU = function (){
	    userModel.find({}).sort({updatedAt:-1}).exec(function(err,users){
	       io.emit('getUsers',users);
	    });
	}

	helper.RTGU = function (){
	    groupsModel.find({},function(err,groups){
	        io.emit('groupUpdate',groups);
	    })
	    
	}

	helper.incrypt = function (pass){
	    return bcrypt.hashSync(pass,bcrypt.genSaltSync(9))
	}
	helper.updateLastMsg = function (data,type){
	    /*this promise update user last msg if has else add*/
	    return new Promise((resolve,reject) =>{
	        var id;
	        if(type == 'sender'){
	            id = data.senderId;
	        }else{
	            id = data.recevierId;
	        }
	        var query = {_id:id,chat:{$elemMatch:{$or:[{senderId:data.senderId,recevierId:data.recevierId},{senderId:data.recevierId,recevierId:data.senderId}] }}},
	            update = {$set:{'chat.$._id':data._id,'chat.$.senderId':data.senderId,'chat.$.recevierId':data.recevierId,'chat.$.message':data.message,'chat.$.isseen':data.isseen,'chat.$.date':data.date }};
	        
	        userModel.update(query, update, function(error, result) {
	            if(error) reject('user not update');
	            if(result.n == 1 && result.nModified == 1 && result.ok == 1) resolve();
	            if (result.n == 0 && result.nModified == 0 && result.ok == 1){
	                userModel.update({_id:id}, {$push:{chat:data}}, function(error, result) {
	                   if(error) reject('user not add');
	                    resolve();
	                });
	            }
	        });
	       
	    });
	    
	}
	
	helper.incrementUnReadMsg = function (data){
		var updateUnReadMsgQuery = {_id:data.senderId,chat:{$elemMatch:{senderId:data.senderId,recevierId:data.recevierId}}},
	    	updatedata ={$inc:{'chat.$.unreadMsg':1}};
	    userModel.update(updateUnReadMsgQuery,updatedata,function(err,data){
	    	if(err) throw err;
	    })

	}
	helper.addNewMessage = function (data){
        helper.updateLastMsg(data,'sender').then(function(){
        	/*increment unread message*/
        	helper.incrementUnReadMsg(data);
            helper.updateLastMsg(data,'recevier').then(function(){
                helper.RTU();
            }).catch((err) => console.log(err));
        }).catch((err) => console.log(err));
	}

	helper.changeStatus = function (id,status,callback){
		if(status){
			userModel.findByIdAndUpdate(id,{$set:status}).exec(function(err,data){
				if(err) throw err;
				callback(data);
			});
		}
	}

	helper.getData = function (model,obj = 0, callback){
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
	return helper;
}