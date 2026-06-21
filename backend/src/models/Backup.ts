import mongoose, { Schema, Document } from 'mongoose';

export interface IBackup extends Document {
  userId: string; // Basic identification, maybe a unique generated string for personal use
  data: any; // JSON dump of the IndexedDB data
  createdAt: Date;
}

const BackupSchema: Schema = new Schema({
  userId: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Backup = mongoose.model<IBackup>('Backup', BackupSchema);
