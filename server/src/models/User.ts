import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'user' | 'vet' | 'admin' | 'petstore';
  phone?: string;
  contact?: string;
  birthDate?: string;
  avatarUrl?: string;
  syndicateCardImageUrl?: string; // vet only
  commercialRegImageUrl?: string; // petstore only
  idFrontUrl?: string;   // vet only
  idBackUrl?: string;    // vet only
  isApproved: boolean;
  failedLoginCount: number;
  rating: number;
  reviewCount: number;
  lockUntil?: Date;
  lastFailedAt?: Date;
  favorites: {
    itemId: string;
    itemType: 'product' | 'service' | 'disease';
  }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['user', 'vet', 'admin', 'petstore'], default: 'user' },
    phone: String,
    contact: String,
    birthDate: String,
    avatarUrl: String,
    syndicateCardImageUrl: { type: String, required: function (this: any) { return this.role === 'vet' } },
    commercialRegImageUrl: { type: String, required: function (this: any) { return this.role === 'petstore' } },
    idFrontUrl: { type: String, required: function (this: any) { return this.role === 'vet' || this.role === 'petstore' } },
    idBackUrl: { type: String, required: function (this: any) { return this.role === 'vet' || this.role === 'petstore' } },
    isApproved: { type: Boolean, default: false },
    failedLoginCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    lockUntil: Date,
    lastFailedAt: Date,
    favorites: {
      type: [{
        itemId: { type: String, required: true },
        itemType: { type: String, enum: ['product', 'service', 'disease'], required: true }
      }],
      default: []
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  // If passwordHash is already hashed (starts with $2), skip
  if (this.passwordHash.startsWith('$2')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (1 hour)
  this.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return resetToken;
};

// Add index for faster lookups
userSchema.index({ email: 1 });

// Prevent recompilation in case of hot reloading
export default mongoose.models?.User || mongoose.model<IUser>('User', userSchema);
