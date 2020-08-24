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
    vr_link: {
        type: String,
        required: false
    },
    correct_score: {
        type: Number,
        required: false,
        default: 0
    },
    wrong_score: {
        type: Number,
        required: false,
        default: 0
    },
    hint_score: {
        type: Number,
        required: false,
        default: 0
    },
    image: {
        type: Buffer,
        required: false
    },
    image_name: {
        type: String,
        required: false
    },
    ans_image: {
        type: Buffer,
        required: false
    },
    ans_image_name: {
        type: String,
        required: false
    }
    })
module.exports = model('Question', question)
