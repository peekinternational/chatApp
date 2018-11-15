/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/

app.controller("dashController", function($scope, $http, $window, $location, $rootScope) {
    /*save with whom user are chatting*/
    $scope.chatWith = '';
    /*save all chats */
	$scope.chats = [];
    /*socket io connection*/
	var socket = io.connect();

    /*check session of the user if he is logged in or not*/
	$http({
          method: 'GET',
          url: '/checkSession',
        }).then(function successCallback(response) {

            $scope.check = function(event){
                console.log(event.keyCode);

            }
        	/*login user */
            $scope.usersInGroup     = 1;
            $scope.countGroupMembers= 1;
            $scope.groupOrUser      = '';
        	$rootScope.user         = response.data;
            $scope.busy             = false; // true then the user is on the call
            $scope.chatIsActive     = true;
            $scope.groupIsActive    = false;
            $scope.reveiveGroupCall = false;
            $scope.liveStream       = false;
            /*get all users*/
    		$http.get("/getUsers")
    		    .then(function(response) {
    		        $scope.allUsers    = response.data;
                     $scope.getmembers = response.data;
    		    });
                /*get All groups*/
            $http.get("/getGroups/"+$rootScope.user._id)
                .then(function(response) {
                    $scope.allGroups = response.data;
                });

            $scope.groupeActive = function() {
                $scope.chatIsActive  = false;
                $scope.groupeIsActive = true;
            }
                 
            $scope.chatActive = function(){
                $scope.groupeIsActive = false;
                $scope.chatIsActive  = true;
            }
            /*on click on a user this function get chat between them*/
    		$scope.startChat = function(obj){
                console.log(obj);
                /*obj is an object send from view it may be a chat or a group info*/
                if( obj.type == 'chat' ){

                    $scope.sendType     = 'chat';
                    $scope.chatWith     = obj.user._id;
                    $scope.groupOrUser  = obj.user.name;
                    $scope.status       = obj.user.status;
                    $scope.connectionId = $scope.user._id + $scope.chatWith;

                    $http.get('/getChat/'+$scope.user._id+'/'+$scope.chatWith)
                        .then(function(res){
                            $scope.groupMembers = '';
                            $scope.chats        = res.data;
                            scrollbottom();
                        });
                }else{

                    $scope.sendType     = 'group';
                    $scope.connectionId = obj.id;
                    $scope.groupOrUser  = obj.name;
                    $scope.status       = '';

                    $http.get('/getGroup/'+obj.id+'/'+obj.mem_id).then(function(group){

                        $scope.groupMembers = group.data[0].members;
                        $scope.chats        = group.data[0].message;
                        scrollbottom();

                    })
                }
                
    		}
            /* to show edit menu popup on right click on a message*/
            $scope.editMenu = function(chat){
                $scope.editMsgId   = chat._id;
                $scope.editMsgMenu = true;
                $scope.msgEdit     = chat.message;
            }
            /* to edit message */
            $scope.editMsg = function(){
                $scope.edit        = true;
                $scope.message     = $scope.msgEdit;
                $scope.editMsgMenu = false;
            }
            /* disconnect the call*/
            $scope.leaveRoom = function(){
                webrtc.leaveRoom();
                webrtc.disconnect();
                webrtc.stopLocalVideo();
                webrtc = '';
                timmerObj.stopCallTimmer();
                document.querySelector('.liveStreamTab').style.display = 'none';
                document.querySelector('.videoTab').style.display = 'none';
                document.querySelector('.audioTab').style.display = 'none';
            }
            
            /*disconnect the call from user side who hit the disconnect button*/
            $scope.disconnect = function(friendId){
                $scope.busy = false;
                $scope.leaveRoom();
                $scope.toggleBtn(false);
                if( $scope.reveiveGroupCall === false && $scope.liveStream === false){
                    socket.emit('calldisconnect',{friendId:friendId});
                }
                
            }
            /*disconnect the call from other side through socket io*/
            socket.on('calldis',function(data){
                if( data.friendId == $scope.user._id ){
                    $scope.toggleBtn(false);
                    $scope.busy = false;
                    $scope.leaveRoom();
                }
            })
            /* send message to the user group and chat both handle in this function through sendType*/
    		$scope.sendMessage = function(sendType,message = 0){
            
                if( sendType == 'chat' ){
                    if(message != 0){
                        $scope.message = 'call duration ' + timmerObj.showTime();
                    }
                    if( $scope.edit === true ){
                        $http.post('/updateChat/'+$scope.editMsgId,{"message":$scope.message})
                        .then(function(res){
                            $scope.message   = '';
                            $scope.editMsgId = '';
                            $scope.edit      = false;
                            updatechat();
                            //scrollbottom();
                        })
                    }else{
                        $http.post('/chat',{"senderId":$scope.user._id,"recevierId":$scope.chatWith,"message":$scope.message})
                        .then(function(res){
                            $scope.message = '';
                            $scope.chats.push(res.data);
                            socket.emit('checkmsg',res.data);
                            /*its a custom made function to scroll down at the end*/
                            scrollbottom();
                        })
                    }
        			
                }else{
                    if( $scope.edit === true ){
                        
                        $http.post('/updateGroupChat/'+$scope.editMsgId,{"message":$scope.message,groupId:$scope.connectionId})
                        .then(function(res){
                            $scope.chats     = res.data[0].message;
                            $scope.message   = '';
                            $scope.editMsgId = '';
                            $scope.edit      = false;
                        })
                    }else{
                        $http.post('/groupChat',{"senderId":$scope.user._id,name:$scope.user.name,"message":$scope.message,id:$scope.connectionId})
                        .then(function(res){
                            var last = res.data.message.length - 1;
                            var data = res.data.message[last];
                            $scope.message = '';
                            //$scope.chats.push(data);
                            socket.emit('checkmsg',{id:res.data._id,data:data});
                            scrollbottom();
                        })
                    }
                }
    		}
            /*this array save group members*/
            $scope.members = [];
            /*to create new group*/
            $scope.addgroup = function(){
                $http.post('/addgroup',{'groupName':$scope.groupName,'members':$scope.members}).then(function(res){
                    $scope.groupName = '';
                    $scope.members   = '';
                });
            }
            /* after enter the live stream pass this function call*/
            $scope.broadcasting = function(type){
                $scope.busy = true;
                $scope.liveStream = true;
                if( type == 'audio' ){
                    document.querySelector('.audioTab').style.display = 'block';
                }else{
                    document.querySelector('.videoTab').style.display = 'block';
                }
                createRoom(type,$scope.liveStreamCode,1);
                socket.emit('broadcasting',{userName:$scope.user.name,userId:$scope.user._id,callType:type});

            }
            socket.on('receiveBroadcasting',function(data){
                if($scope.busy == false){
                    $scope.liveUserName = data.userName;
                    $scope.liveUserId   = data.userId;
                    $scope.callType     = data.callType;
                    if( $scope.liveUserId != $scope.user._id )
                        $('#joinbbtn').trigger('click');
                }
                
            })

            $scope.joinbroadcasting = function(){
                if( $scope.callType == 'audio' ){
                    document.querySelector('.audioTab').style.display = 'block';
                }else{
                    document.querySelector('.liveStreamTab').style.display = 'block';
                }
                joinLiveStream($scope.callType,$scope.joinliveStreamCode);
                $scope.busy = true;
                $scope.liveStream = true;
            }

            /*logout the user and destroy the session*/
    		$scope.logout = function(){
    			$http.get('/logout').then(function(res){
    				if ( res.data.msg == "session destroy" ) {
    					$location.path('/');
    				}
    			})
    		}
            /* this function enable or disable the btns when the call receive or drop*/
            $scope.toggleBtn = function(bolean){
                $('#call').prop('disabled', bolean);
                $('#videoCall').prop('disabled', bolean);
                $('#live').prop('disabled', bolean);
            }

            /* video calling functionality*/
            $scope.videoCall = function(type,callerId){

                if( type == 'audio' ){
                    document.querySelector('.audioTab').style.display = 'block';
                }else{
                    document.querySelector('.videoTab').style.display = 'block';
                }
                $scope.toggleBtn(true);
                if( $scope.chatIsActive == true ){
                    /*its a custom function to create a room of simple webrtc*/
                    createRoom(type,$scope.user._id+$scope.chatWith);
                    $scope.busy = true; // it means the user is on a call no one call this user this time 
                    /* emit an socket io event to slow incoming call popup to friend*/
                    socket.emit('videoCall',{friendId:$scope.chatWith,callerName:$scope.user.name,callerId:$scope.user._id,callType:type});
                }
                if( $scope.groupeIsActive == true ){
                    createRoom( type, $scope.connectionId );
                    $scope.busy = true;
                    socket.emit('groupvideoCall',{members:$scope.groupMembers,groupName:$scope.groupOrUser,groupId:$scope.connectionId,callerId:$scope.user._id,callType:type});
                }
            }
            /* this is the main function call after time up and no one receive the call*/
            $scope.dropCall = function(){
                if($scope.reveiveGroupCall == true){
                    $scope.dropGroupCallAfterTime($scope.groupMembers,$scope.user._id);
                }else{
                    $scope.callDropAfterTime($scope.chatWith,$scope.user._id);
                }
            }
            /* this function drop the group call after times up and no one receive call*/
            $scope.dropGroupCallAfterTime = function(members,callerId){
                $scope.busy = false;
                $scope.toggleBtn(false);
                $scope.leaveRoom();
                socket.emit('dropTheGroupCall',{members,members,callerId:callerId});
            }
            /* this function drop the call after times up and no one receive call*/
            $scope.callDropAfterTime = function(friendId,callerId){
                $scope.busy = false;
                $scope.toggleBtn(false);
                $scope.leaveRoom();
                socket.emit('dropTheCall',{friendId,friendId,callerId:callerId});
            }
            /* drop the call of group members when the times up and no one receive the call*/
            socket.on('dropeTheMembersCall',function(data){
                $scope.$apply(function(){
                    for( var i = 0; i < data.members.length; i++ ){
                        if(data.members[i].id == $scope.user._id){
                            $scope.busy = false;
                            $scope.toggleBtn(false);
                            document.getElementById('incommingCall').style.display = 'none';
                            audio.pause();
                        }
                    }
                    if(data.callerId == $scope.user._id){
                        $.toaster({ priority : 'danger', title : 'call drop', message : 'group call due to time up no one reveive the call'});
                        callCancelTimmer.stopCallTimmer();
                    }
                });
            })
            /* drop the call then the user not receive the call and times up*/
            socket.on('dropeTheFriendCall',function(data){
                $scope.$apply(function(){
                    if(data.friendId == $scope.user._id){
                        $scope.busy = false;
                        $scope.toggleBtn(false);
                        document.getElementById('incommingCall').style.display = 'none';
                        audio.pause();
                    }
                    if(data.callerId == $scope.user._id){
                        $.toaster({ priority : 'danger', title : 'call drop', message : 'call drop due to time up'});
                        callCancelTimmer.stopCallTimmer();
                    }
                });
            })

            /* store video of calling sound*/
            var audio = new Audio('audio/call.mp3');
    		socket.on('reveiceGroupVideoCall',function(data){
                for(var i = 0;i < data.members.length; i++){
                    $scope.toggleBtn(true);
                    $scope.countGroupMembers  = 1;
                    $scope.busy               = true;
                    $scope.reveiveGroupCall   = true;
                    $scope.receiveGroupCallId = data.groupId;
                    $scope.receiveGroupMem    = data.members;
                    $scope.callType           = data.callType;
                    $scope.callerId           = data.callerId;
                    if( data.members[i].id == $scope.user._id && data.members[i].id != data.callerId ){
                        audio.loop                = true;
                        audio.play();
                        document.getElementById('incommingCall').style.display = 'block';
                        document.getElementById('callerName').innerHTML = data.groupName;
                        $scope.connectUsers('countGroupMembers');
                    }
                }
            })
            /* this function increase the user then he join the group*/
            $scope.connectUsers = function(check){
                if ( $scope.reveiveGroupCall == true ) 
                socket.emit('connectUsers',{check:check,members:$scope.receiveGroupMem});
            }
            socket.on('updateConnectedUsers',function(data){
                for( var i = 0; i < data.members.length; i++ ){
                    if( data.members[i].id == $scope.user._id ){
                        $scope.$apply(function(){
                            if( data.check == 'countGroupMembers' ){
                                $scope.countGroupMembers += 1;
                            }else{
                                $scope.usersInGroup += 1;
                            }
                        })
                    }
                }
            })
            /* this function downgrade the user when he left the group */
            $scope.removeconnectUser = function(check){
                if ( $scope.reveiveGroupCall == true && $scope.liveStream === false) 
                socket.emit('removeconnectUser',{check:check,members:$scope.receiveGroupMem});
            }
            socket.on('deductConnectedUser',function(data){
                for( var i = 0; i < data.members.length; i++ ){
                    if( data.members[i].id == $scope.user._id ){
                        $scope.$apply(function(){
                            $scope.countGroupMembers -=1;
                            if( data.check == 'afterReceive' ){
                                $scope.usersInGroup -= 1;
                                if( $scope.usersInGroup == 1 ){
                                    if($scope.callerId == $scope.user._id){
                                        $scope.busy = false;
                                        $scope.toggleBtn(false);
                                        $scope.leaveRoom();
                                    }
                                }
                                
                            }
                            
                        })
                    }
                }
            })
            /* show incomming call popup and caller name */
            socket.on('videoCallToFriend',function(data){
                
                if( data.friendId == $scope.user._id && $scope.busy == false ){
                    $scope.toggleBtn(true);
                    $scope.busy               = true;
                    $scope.reveiveGroupCall   = false;
                    $scope.receiveGroupCallId = ''
                    $scope.callerId           = data.callerId;
                    $scope.friendId           = data.friendId;
                    $scope.callType           = data.callType;
                    audio.loop                = true;
                    audio.play();
                    document.getElementById('incommingCall').style.display = 'block';
                    document.getElementById('callerName').innerHTML = data.callerName;
                }else if( data.friendId == $scope.user._id && $scope.busy == true ){
                    socket.emit('busy',data);
                }
            })
            /*show alert to the user that the person are busy on another call*/
            socket.on('userBusy',function(data){
                if(data.callerId == $scope.user._id){
                    $scope.toggleBtn(false);
                    $.toaster({ priority : 'danger', title : 'call drop', message : 'the person you are trying to call is busy on another call'});
                    webrtc = '';
                    callCancelTimmer.stopCallTimmer();
                    document.querySelector('.videoTab').style.display = 'none';
                    document.querySelector('.audioTab').style.display = 'none';
                }

            })
            /* delete message chat and group both handle in this function*/
            $scope.deleteMsg = function(type){
                if( $scope.sendType == 'chat' ){
                    if( confirm("do you relly wanna delete this message!") ){
                        $http.get('/deleteMsg/'+$scope.editMsgId+'/'+type).then(function(res){
                            updatechat(res);
                            $scope.editMsgId   = '';
                            $scope.editMsgMenu = false;
                        })
                    }
                }else{
                    if( confirm("do you relly wanna delete this message!") ){
                        $http.get('/deleteGroupMsg/'+$scope.editMsgId+'/'+type+'/'+$scope.connectionId).then(function(res){
                            $scope.editMsgId   = '';
                            $scope.editMsgMenu = false;
                            socket.emit('updateGroupChat',res.data[0].message);
                        })
                    }
                }
                
            }
            /* update chat after performing any action on reall time*/
            function updatechat(deletedItem){
              $http.get('/getChat/'+$scope.user._id+'/'+$scope.chatWith)
                  .then(function(res){
                      $scope.groupMembers = '';
                      $scope.chats        = res.data;
                      socket.emit('updatechat',res.data);
                  });
            }
            /* this function join the call when the user receive the call*/
            $scope.joinCall = function(){
                if( $scope.callType == 'audio' ){
                    document.querySelector('.audioTab').style.display = 'block';
                }else{
                    document.querySelector('.videoTab').style.display = 'block';
                }
                if( $scope.reveiveGroupCall == true ){
                    joinRoom($scope.callType,$scope.receiveGroupCallId);
                    if( $scope.usersInGroup <= 1 ){
                        socket.emit('callStart',{friendId:$scope.user._id,callerId:$scope.callerId});
                    }else{
                        timmerObj.reset();
                        timmerObj.startCallTimmer();
                    }
                }else{
                    /*custom function to join the room simple webrtc*/
                    joinRoom($scope.callType,$scope.callerId+$scope.user._id);
                    $scope.chatWith = $scope.callerId;
                    socket.emit('callStart',{callerId:$scope.callerId,friendId:$scope.friendId});
                }
                document.getElementById('incommingCall').style.display = 'none';
                audio.pause(); // stop the ring after receive
            }
            /* drop call means user did not receive the call and cancel it */
            $scope.callDrop = function(check){
                $scope.toggleBtn(false);
                $scope.busy = false;
                document.getElementById('incommingCall').style.display = 'none';
                audio.pause();
                if( $scope.reveiveGroupCall == false ){
                    socket.emit('dropCall',{callerId:$scope.callerId,type:"call"});
                }else{
                    $scope.removeconnectUser(check);
                    setTimeout(() => {
                        if( $scope.countGroupMembers == 1 ){
                            socket.emit('dropCall',{callerId:$scope.callerId,type:'group'});
                        }
                    },1000);
                    
                }
            }
            socket.on('callDroped',function(data){
                if( data.callerId == $scope.user._id ){
                    $scope.toggleBtn(false);
                    $scope.leaveRoom();
                    callCancelTimmer.stopCallTimmer();
                    if( data.type == 'call' )
                    $.toaster({ priority : 'danger', title : 'call drop', message : 'the person you call is busy he did not receive'});
                    if( data.type == 'group' )
                    $.toaster({ priority : 'danger', title : 'call drop', message : 'no one pick the call'});
                }
            })
            /* update the chat of the friend side after any action*/
            socket.on('updateChatAll',(conversation) => {

                var recevierId = conversation.length >= 0 ? conversation[0].recevierId : conversation.recevierId;
                var senderId   = conversation.length >= 0 ? conversation[0].senderId : conversation.senderId;
                $scope.$apply(function(){
                    if( $scope.user._id == recevierId && $scope.chatWith == senderId ){
                        if( conversation.length >= 0 ){
                            $scope.chats = conversation;
                        }else{
                            $scope.chats = [];
                        }
                        scrollbottom();
                    }
                });
            })

            /*update the new message friend side */
    		socket.on('remsg',function(msg){
    			$scope.$apply(function(){
    				if( $scope.user._id == msg.recevierId && $scope.chatWith == msg.senderId ){
    					$scope.chats.push(msg);
                        scrollbottom();
    				}
                    if( $scope.user._id == msg.recevierId ){
                        var audio = new Audio('audio/message.mp3');
                        audio.play();
                    }
                    if( msg.id == $scope.connectionId ){
                        $scope.chats.push(msg.data);
                        scrollbottom();
                    }
			    });
    		});
    		socket.on('getUsers',function(users){
    			$scope.$apply(function(){
    				$scope.allUsers = users;
    			});
    		})
            socket.on('groupUpdate',function(groups){
                $scope.$apply(function(){
                    $scope.allGroups = groups;
                });
            })
            socket.on('updateAllGroupChat',function(chats){
                $scope.$apply(function(){
                    $scope.chats = chats;
                });
            })
            socket.on('startTimmer',function(data){
                if( data.callerId == $scope.user._id || data.friendId == $scope.user._id ){
                    timmerObj.reset();
                    timmerObj.startCallTimmer();
                }
                if( data.callerId == $scope.user._id )
                    callCancelTimmer.stopCallTimmer();
            });

        }, function errorCallback(response) {
            $location.path('/');
        });
   
    
});