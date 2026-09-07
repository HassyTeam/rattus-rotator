import express from "express";
import userRouter from "./routes/user";
import adminRouter from "./routes/admin";

const rottaRouter = express.Router();

rottaRouter.use("/admin", adminRouter)

rottaRouter.use("/user", userRouter)

export default rottaRouter;