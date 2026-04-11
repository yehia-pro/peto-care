import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
    userId: mongoose.Types.ObjectId;
    vetId: mongoose.Types.ObjectId;
    petId?: mongoose.Types.ObjectId;
    date: Date;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    type: string;
    price: number;
    notes?: string;
    doctorNotes?: string;
    entryNumber?: number;
    autoRejected?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vetId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    petId: { type: Schema.Types.ObjectId, ref: 'PetRecord' },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    type: { type: String, default: 'checkup' },
    price: { type: Number, default: 0 },
    notes: { type: String },
    doctorNotes: { type: String },
    entryNumber: { type: Number },
    autoRejected: { type: Boolean, default: false }
}, {
    timestamps: true
});

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
