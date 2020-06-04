const { Schema, model } = require('mongoose')

const winner = new Schema({
  questid: {
    type: Schema.Types.ObjectId,
    ref: 'Quest'
  },
  userid: {
    type: String,
    required: true
  },
  coupon: {
    type: String,
    required: true
  },
  isactive: {
      type: Boolean,
      default: true
  },
    })
module.exports = model('Winner', winner)
