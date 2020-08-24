const { Schema, model } = require('mongoose')

const coupon = new Schema({
  userid: {
     type: Schema.Types.ObjectId,
     ref: 'Winner'
   },
isactive: {
    type: Boolean,
    default: true
},
coupon: {
  type: String,
  required: true
},
discount: {
  type: Number,
  required: true,
  default: 5
},
})

coupon.methods.generate = function (lvl) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < 6; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
  this.coupon = result;
  if (lvl > 20){
    this.discount = 20
  } else {
    this.discount = lvl
  }
}

module.exports = model('Coupon', coupon)
