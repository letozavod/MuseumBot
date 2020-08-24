const { Schema, model } = require('mongoose')

const winner = new Schema({
  userid: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },

  lvl: {
    type: Number,
    required: true,
    default: 1
  },
xp: {
    type: Number,
    required: true,
    default: 0
  },
    })

    winner.methods.nextLvl = function () {

      nextlvlxp=100*(2**(this.lvl-1))

    return nextlvlxp
};
module.exports = model('Winner', winner)
