import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true  // to make any field searchable, we use index.
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloundinary url
        required: true, 
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
    }
)


// here we will use bcrypt library
// which helps us to hash the passwords. we will be encoding and decoding it using it.

// We use "pre" which is a mongoose hook which 
// performs an action just before some other action such as "save"


// the callback function in pre should be defined by keyword function
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//custom methods to check whether the password is correct (validation)
userSchema.methods.isPasswordCorrect = async function name(password) {
    return await bcrypt.compare(password, this.password)
}


// Another library we use will be jwt(jsonwebtoken)
// it helps us in generating tokens
// JWT is a bearer token

// the sign method takes 
// 1. the data, 2. the Secret or private key , 3. options: expiry
// the secret and expiry are in env variables.
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)