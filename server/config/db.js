import mongoose from 'mongoose'
async function connectDB() {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB Connected successfully')
    }catch(error){
  console.error('mongoDB Connection Failed',error.message)
  process.exit(1)
    }
}
export default connectDB;