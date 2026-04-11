import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultationForm extends Document {
    userId: mongoose.Types.ObjectId;
    petType: string;
    petName: string;
    age: string;
    gender: string;
    symptoms: string;
    duration: string;
    severity: string;
    previousTreatment?: string;
    medications?: string;
    urgency: string;
    contactMethod: string;
    additionalInfo?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ConsultationFormSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    petType: { type: String, required: true },
    petName: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, required: true },
    symptoms: { type: String, required: true },
    duration: { type: String },           // optional — ممكن ميتبعتش
    severity: { type: String },           // optional — تم مسحه من الفورم
    previousTreatment: { type: String },
    medications: { type: String },
    urgency: { type: String },            // optional — تم مسحه من الفورم
    contactMethod: { type: String },      // optional — ممكن ميتبعتش
    additionalInfo: { type: String },
    phone: { type: String },              // رقم الهاتف الجديد
    alternatePhone: { type: String },     // رقم بديل اختياري
}, {
    timestamps: true
});

export default mongoose.model<IConsultationForm>('ConsultationForm', ConsultationFormSchema);
