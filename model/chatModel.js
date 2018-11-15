/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const chatSchema = new Schema({
	"senderId":String,
	"recevierId":String,         //{ type: Schema.Types.ObjectId, ref: 'Users' }, for populate joins
	"message":String,           //{ type: Schema.Types.ObjectId, ref: 'Users' },
	"delete":{type:String,default:''},      
	"isseen":{type:Boolean,default:false},
	"date": { type: Date, default: Date.now },
});
module.exports = mongoose.model('chat',chatSchema);