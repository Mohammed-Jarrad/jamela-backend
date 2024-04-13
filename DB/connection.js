import mongoose from 'mongoose'

const connectDB = async () => {
    return await mongoose
        .connect(process.env.DB)
        .then(() => {
            console.log('connected successfull.')
        })
        .catch((e) => {
            console.log('error to connect db', e.message)
        })
}

export default connectDB
