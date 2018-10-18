'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var messagePersonalSchema = new Schema({
    message_personal_room: {
        type: Schema.ObjectId,
        ref: 'MessagePersonalRoom'
    },
    created_by: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    message: {
        type: String,
        required: 'Message required'
    },
    status: {
        type: Boolean,
        required: 'Status required'
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    modified_date: {
        type: Date
    }
})
mongoose.model('MessagePersonal', messagePersonalSchema);