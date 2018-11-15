/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/

module.exports = function(){
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
}