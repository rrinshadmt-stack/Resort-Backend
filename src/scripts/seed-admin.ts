import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import { hashPassword } from "../utils/password";

const run = async (): Promise<void> => {
    const uri = process.env.MONGODB_URI;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME?.trim() || "Platform Admin";

    if (!uri || !email || !password) {
        throw new Error("Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    }
    if (password.length < 8) {
        throw new Error("ADMIN_PASSWORD must be at least 8 characters");
    }

    await mongoose.connect(uri);

    const passwordHash = await hashPassword(password);
    await User.findOneAndUpdate(
        { email },
        {
            $set: { name, passwordHash, role: "ADMIN", isVerified: true },
            $setOnInsert: { email },
        },
        { upsert: true, new: true }
    );

    console.log(`Admin ready: ${email}`);
    await mongoose.disconnect();
};

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});