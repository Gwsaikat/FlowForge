import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    velocityDrift: { type: Number, default: 1.0 },
    taskHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    refreshTokenHash: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash') || this.passwordHash.startsWith('$2')) {
    return next();
  }
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);
export default User;
