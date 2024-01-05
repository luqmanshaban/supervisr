import mongoose from "mongoose";

const { Schema } = mongoose

const UserSchema = new Schema({
    username: String,
    email: String,
    password: String,
    verified: {
        type: Boolean,
        default: false
    }
})

const User = mongoose.model('User', UserSchema)

export default User