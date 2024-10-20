import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type: mongoose.Schema.Types.ObjectId, // One who is subscribing
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,  // one to whom subscriber is subscribing
        ref: "User"
    }
}, {timestamps: true})


// we only have to count the docs to count the 
// no of subscribers for a channel

// a new doc is created every time a user subscribes a channel

export const Subscription = mongoose.model("Subscription", subscriptionSchema)