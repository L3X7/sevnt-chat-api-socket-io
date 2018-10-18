'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var userSchema = new Schema({
    username: {
        type: String,
        trim: true,
        require: 'Username required'
    },
    password: {
        type: String,
        require: 'Password required'
    },
    email: {
        type: String,
        require: 'Email required'
    },
    first_name: {
        type: String,
        required: 'First name required'
    },
    surname: {
        type: String,
        required: 'Surname required'
    },
    user_image: {
        type: String
    },
    created_date: {
        type: Date,
        default: Date.now
    }
});
mongoose.model('User', userSchema);