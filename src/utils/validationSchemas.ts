import { z } from 'zod';

// Common patterns
const phoneRegex = /^(\+20|0)?1[0125][0-9]{8}$/; // Egyptian phone number pattern
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const loginSchema = z.object({
    email: z.string().min(1, 'required').email('invalid_email'),
    password: z.string().min(1, 'required'),
});

export const registerSchema = z.object({
    fullName: z.string().min(2, 'required'),
    email: z.string().email('invalid_email'),
    phone: z.string().optional(),
    password: z.string().min(6, 'weak_password'),
    confirmPassword: z.string(),
    role: z.enum(['user', 'vet', 'petstore']).default('user'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "passwords_mismatch",
    path: ["confirmPassword"],
});

export const vetRegistrationSchema = z.object({
    licenseNumber: z.string().min(3, 'required'),
    specialization: z.string().min(2, 'required'),
    experience: z.coerce.number().min(0, 'invalid_number'),
    clinicName: z.string().min(2, 'required'),
    clinicAddress: z.string().min(5, 'required'),
    consultationFee: z.coerce.number().min(0, 'invalid_number'),
    availability: z.string().optional(), // Could be more complex in future
    emergencyAvailable: z.boolean().default(false),
    // File uploads are usually handled separately, but we can validate presence if string URLs
    syndicateCard: z.any().optional(),
    nationalId: z.any().optional(),
});

export const storeRegistrationSchema = z.object({
    storeName: z.string().min(2, 'required'),
    businessLicense: z.string().min(3, 'required'),
    storeType: z.enum(['pet_shop', 'veterinary_pharmacy', 'pet_supplies', 'grooming', 'boarding']),
    address: z.string().min(5, 'required'),
    city: z.string().min(2, 'required'),
    phone: z.string().regex(phoneRegex, 'invalid_phone'),
    commercialRegister: z.any().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VetRegistrationInput = z.infer<typeof vetRegistrationSchema>;
export type StoreRegistrationInput = z.infer<typeof storeRegistrationSchema>;
