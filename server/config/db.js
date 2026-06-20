import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        // console.log(uri);
        console.log("URI RAW:", JSON.stringify(uri));
        if (!uri) {
            throw new Error("MONGO_URI is not defined");
        }
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    }
    catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}

export default connectDB;