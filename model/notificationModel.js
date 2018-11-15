/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notiSchema = new Schema({
	"senderId":String,
	"recevierId":String,         
	"message":String,                 
	"isseen":{type:Boolean,default:false},
	"date": { type: Date, default: Date.now },
});
module.exports = mongoose.model('notification',notiSchema);