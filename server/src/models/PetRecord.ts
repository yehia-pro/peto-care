import mongoose, { Schema, Document } from 'mongoose'

export interface IPetRecord extends Document {
    userId: string
    petName: string
    petType: string
    breed?: string
    petImage?: string
    summary: string
    history: string
    medications: string
    createdAt: Date
}

const PetRecordSchema = new Schema({
    userId: { type: String, required: true, index: true },
    petName: { type: String, required: true },
    petType: { type: String, required: true },
    breed: { type: String, required: false },
    petImage: { type: String, required: false },
    summary: { type: String, required: true },
    history: { type: String, required: true },
    medications: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.PetRecord || mongoose.model<IPetRecord>('PetRecord', PetRecordSchema)
