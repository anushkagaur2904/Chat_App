import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    match: /.+\@.+\..+/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);