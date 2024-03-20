import mongoose from 'mongoose'

const connectDB = async () => {
	return await mongoose
		.connect(process.env.DB || 'mongodb://localhost:27017/jamela')
		.then(() => {
			console.log('connected successfull.')
		})
		.catch(e => {
			console.log('error to connect db', e)
		})
}

export default connectDB
