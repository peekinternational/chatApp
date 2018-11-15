/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
	"name":String,
	"email":String,
	"phone":Number,
	"country":String,
	"password":String,
	"chat":[{senderId:String,recevierId:String,date:{type:Date,default:Date.now},message:String,unreadMsg:{type:Number,default:0},isseen:{type:Boolean,default:false}}],
	"status":{ type: String, default:"online" },
	"date": { type: Date, default: Date.now },
	"updatedAt": {type: Date, default: Date.now}
});

userSchema.pre('save', function (next){
  this.updatedAt = Date.now();
  next();
});
userSchema.pre('update', function() {
  this.update({},{ $set: { updatedAt: new Date() } });
});

module.exports = mongoose.model('Users',userSchema);