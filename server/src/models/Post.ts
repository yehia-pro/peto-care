import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
    author: mongoose.Types.ObjectId; // User ID
    authorType: 'user' | 'vet' | 'petstore';
    content: string;
    image?: string;
    isEdited?: boolean;
    likes: string[]; // Array of User IDs
    comments: {
        user: mongoose.Types.ObjectId;
        userType: 'user' | 'vet' | 'petstore' | 'admin';
        text: string;
        likes: string[]; // Array of User IDs
        createdAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        authorType: { type: String, enum: ['user', 'vet', 'petstore', 'admin'], default: 'user' },
        content: { type: String, required: true },
        image: { type: String },
        isEdited: { type: Boolean, default: false },
        likes: [{ type: String }],
        comments: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                userType: { type: String, enum: ['user', 'vet', 'petstore', 'admin'], default: 'user' },
                text: { type: String, required: true },
                likes: [{ type: String }],
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
