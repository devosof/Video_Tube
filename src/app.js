import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


const app = express();

// cors configuration (production level configuration)
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// bodyparser is not usually used now  because its work is already done in express.

// data will come from different sources such as json, body, form , url etc.
app.use(express.json({limit: "16kb"})) // to config that we are accepting json.
// to handle data from URL
app.use(express.urlencoded({extended: true, limit: "16kb"}))
// to use static files usually from public folder
app.use(express.static("public"))

// cookieparser is to perform crud operation on cookies;
app.use(cookieParser())


// the callback (req, res) is competely described as:
// (err, req, res, next); 


//routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

// http://localhost:8000/api/v1/users/register

export { app }