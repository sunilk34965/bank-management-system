import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  accountNumber: { type: String, required: true, unique: true },
  userId: { type: String, ref: 'User', required: true },
  accountType: { type: String, enum: ['Savings', 'Current'], default: 'Savings' },
  balance: { type: Number, required: true, default: 0 },
  branchId: { type: String, default: 'BR001' },
  status: { type: String, enum: ['active', 'pending', 'frozen'], default: 'active' },
  openedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);
export default Account;
