import mongoose from 'mongoose';

const diseaseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    symptoms: [{ type: String }],
    imageUrl: { type: String, default: '' },
    isRare: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Disease || mongoose.model('Disease', diseaseSchema);
