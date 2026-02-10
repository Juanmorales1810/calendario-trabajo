import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IUserSettings extends Document {
    userId: string;
    salarioMensual?: number;
    horasJornada: number; // 8 or 9
    moneda: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
    {
        userId: { type: String, required: true, unique: true },
        salarioMensual: { type: Number, default: 0 },
        horasJornada: { type: Number, required: true, default: 9 },
        moneda: { type: String, default: 'USD' },
    },
    { timestamps: true }
);

export const UserSettings: Model<IUserSettings> =
    mongoose.models.UserSettings ||
    mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
