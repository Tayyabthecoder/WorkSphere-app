import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseCategory = 'Labor' | 'Tools' | 'Travel' | 'Other';

export interface IExpense extends Document {
  expenseId: string;
  tenantId: string;
  projectId: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  baseCurrency: string;
  date: Date;
  vendor: string;
  category: ExpenseCategory;
  description?: string;
  receiptFileId?: string;
  fxRateAtEntry?: number;
  fxRateDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expenseId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    convertedAmount: { type: Number, required: true, min: 0 },
    baseCurrency: { type: String, default: 'USD' },
    fxRateAtEntry: { type: Number },
    fxRateDate: { type: Date },
    date: { type: Date, required: true, default: Date.now },
    vendor: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Labor', 'Tools', 'Travel', 'Other'],
      default: 'Other',
      index: true,
    },
    description: { type: String, default: '' },
    receiptFileId: { type: String },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ tenantId: 1, projectId: 1, date: -1 });

export const ExpenseModel =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default ExpenseModel;
