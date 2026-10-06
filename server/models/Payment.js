import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  paymentId: { type: String, required: true, unique: true },
  userId: { type: String, ref: 'User', required: true },
  accountId: { type: String, ref: 'Account', required: true },
  accountNumber: { type: String, required: true },
  category: { type: String, required: true }, // Electricity, Water, Mobile, Internet, Education, Other
  merchantName: { type: String, required: true },
  consumerNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], default: 'SUCCESS' },
  referenceNo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
