import mongoose from 'mongoose';

const chequebookSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  chequeBookId: { type: String, required: true, unique: true },
  userId: { type: String, ref: 'User', required: true },
  accountId: { type: String, ref: 'Account', required: true },
  accountNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  totalLeaves: { type: Number, default: 25 },
  usedLeaves: { type: Number, default: 0 },
  remainingLeaves: { type: Number, default: 25 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date }
});

const Chequebook = mongoose.models.Chequebook || mongoose.model('Chequebook', chequebookSchema);
export default Chequebook;
