// require('dotenv').config({path: './env'})  .. this is completely correct
import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import {app} from "./app.js";

dotenv.config({
    path: './.env'
})


connectDB()
.then(()=>{
    // app.on("error", (err)=>{
    //     console.log("ERROR: ", err)
    //     throw err
    // })
    app.listen(process.env.PORT || 8000, (req, res) => {
        console.log(`Server is running at port: ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO DB connection failed!! ", err);
    
})










// This is the first approach where we include the database connection in index.js
// import express from "express";
// const app = express();
// ;(async () => {
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error", (error)=>{
//         console.log("ERROR: ", error);
//         throw error
        
//        })

//        app.listen(process.env.PORT, ()=>{
//         console.log(`App is listening on port ${process.env.PORT}`);
        
//        })
    
//     } catch (error) {
//         console.error("ERROR: ", error)
//         throw error
//     }
// })()