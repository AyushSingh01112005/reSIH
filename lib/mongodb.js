import mongoose from "mongoose";

const connectDb = async () => {
  try {
    console.log("Connecting to MongoDB...");
    console.log("mongo_uri -" ,process.env.MONGODB_URI )

    const mongodbUri = process.env.MONGODB_URI;

    if (!mongodbUri) {
      throw new Error("MONGODB_URI is missing in .env.local");
    }

    if (mongoose.connection.readyState === 1) {
      console.log("Already connected to MongoDB");
      return mongoose.connection;
    }

    await mongoose.connect(mongodbUri);

    console.log("Connected to MongoDB successfully");

    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error);

    // VERY IMPORTANT
    throw error;
  }
};

export default connectDb;