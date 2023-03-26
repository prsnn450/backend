const mongoose = require('mongoose');

const loginSchema = mongoose.Schema({
    name: {
        type : String,
        unique: true,
        required:true
    },

    phone:{
        type: String,
        unique: true,
        required: true,
    },

    email: {
        type: String,
        unique: true,
        required: true,
    },

    password: {
        type: String,
        required: true
    },
    
    signupdate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Login", loginSchema);