import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  branchId: { type: String, required: true, unique: true },
  branchName: { type: String, required: true },
  branchCode: { type: String, required: true, unique: true },
  IFSCcode: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
});

const Branch = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
export default Branch;
