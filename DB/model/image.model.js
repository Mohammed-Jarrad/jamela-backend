import mongoose, { Schema, model } from 'mongoose'

const imageSchema = new Schema(
    {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
        link: { type: String, default: null },
        imageType: { type: String, enum: ['main', 'banner'], required: true },
    },
    {
        timestamps: true,
    }
)

const Image = mongoose.models.Image || model('Image', imageSchema)

export default Image
