import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./v1/modules/auth/auth.route";
import resortRoutes from "./v1/modules/resorts/resorts.routes";
import roomRoutes from "./v1/modules/rooms/rooms.route";
import { notFoundMiddleware } from "./middleware/notFound.middleware";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    })
);

app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Resort Booking API is running",
    });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/resorts", resortRoutes);
app.use("/api/v1", roomRoutes); // /resorts/:resortId/rooms and /rooms/:id

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;