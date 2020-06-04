const { Schema, model } = require('mongoose')

const question = new Schema({
    question_text: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    answer_output: {
        type: String,
        required: true
    },
    order_num: {
      type: Number,
      required: false
    },
    questid: {
      type: Schema.Types.ObjectId,
      ref: 'Quest'
    },
    hint: {
        type: String,
        required: false
    },
    question_pic: {
        type: String,
        required: false
    },
    answer_pic: {
        type: String,
        required: false
    }
    })
module.exports = model('Question', question)
