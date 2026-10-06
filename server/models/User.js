import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'cashier', 'manager', 'admin'], 
    default: 'customer' 
  },
  address: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['active', 'pending', 'frozen'], 
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
