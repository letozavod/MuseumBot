const { Schema, model } = require('mongoose')

const quest = new Schema({
    quest_name: {
        type: String,
        required: true
    },
    quest_desc: {
        type: String,
        required: false
    },
    isactive: {
        type: Boolean,
        default: true
    },
    islinear: {
        type: Boolean,
        default: false
    },
    quest_end: {
        type: String,
        required: false,
    }
})
module.exports = model('Quest', quest)
