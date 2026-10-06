import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  transactionId: { type: String, required: true, unique: true },
  accountId: { type: String, ref: 'Account', required: true },
  accountNumber: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'PAYMENT'], 
    required: true 
  },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String, default: '' },
  performedBy: { type: String, ref: 'User' },
  performedByName: { type: String, default: '' },
  paymentMethod: { type: String, default: 'ONLINE' },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export default Transaction;
