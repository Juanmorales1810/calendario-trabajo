import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IWorkEntry extends Document {
    userId: string;
    fecha: Date;
    dia: string;
    entrada: string;
    salida: string;
    horasTurno: number; // in minutes
    horasLaborales: number; // in minutes
    horasExtras: number; // in minutes
    ubicacion: string;
    entrada2?: string;
    salida2?: string;
    horasTurno2: number; // in minutes
    observaciones?: string;
    createdAt: Date;
    updatedAt: Date;
}

const WorkEntrySchema = new Schema<IWorkEntry>(
    {
        userId: { type: String, required: true, index: true },
        fecha: { type: Date, required: true },
        dia: { type: String, required: true },
        entrada: { type: String, required: true },
        salida: { type: String, default: '' },
        horasTurno: { type: Number, required: true, default: 0 },
        horasLaborales: { type: Number, required: true, default: 0 },
        horasExtras: { type: Number, required: true, default: 0 },
        ubicacion: { type: String, default: '' },
        entrada2: { type: String, default: '' },
        salida2: { type: String, default: '' },
        horasTurno2: { type: Number, default: 0 },
        observaciones: { type: String, default: '' },
    },
    { timestamps: true }
);

WorkEntrySchema.index({ userId: 1, fecha: 1 });

// Delete cached model to pick up schema changes during dev hot-reload
if (mongoose.models.WorkEntry) {
    delete mongoose.models.WorkEntry;
}

export const WorkEntry: Model<IWorkEntry> = mongoose.model<IWorkEntry>(
    'WorkEntry',
    WorkEntrySchema
);
