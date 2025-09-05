import mongoose from "mongoose";
const connectDB = async () =>{
    try{
        mongoose.connection.on('connected',()=>console.log("Database connected."));
        await mongoose.connect(`${process.env.MONGODB_URI}`)

    }
    catch(err){
        console.error(err.message)
    }
}
export default connectDB;