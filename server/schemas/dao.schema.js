const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DAOSchema = new Schema({
    addr: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    proposals : {
        type: Array,
        default: []
    }
})

module.exports = DAO = mongoose.model('DAO', DAOSchema)