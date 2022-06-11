const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ContractSchema = new Schema({
    addr: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    }
})

module.exports = Contract = mongoose.model('contract', ContractSchema)