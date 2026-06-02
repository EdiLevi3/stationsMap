import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const connectDB = async () => {
  try {
    console.log("MONGO_URI:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Exit process with failure
  }
};

export { connectDB };