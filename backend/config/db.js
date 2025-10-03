import mongoose from "mongoose";

const connectDB= async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`)
        console.log(`MONGODB connected successfully ✅ !! DB_HOST : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB connection error,can't connect to database",error);
        process.exit(1);
    }
}


export default connectDB

