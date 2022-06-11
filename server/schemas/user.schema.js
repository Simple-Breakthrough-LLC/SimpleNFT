const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
    addr: {
        type: String,
        required: true,
        unique: true
    },
    contract: {
        type: Schema.ObjectId,
        required: true
    }
})

module.exports = User = mongoose.model('user', UserSchema)