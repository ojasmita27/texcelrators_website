const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      required: true
    },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'removed'],
      default: 'active'
    },
    active: { type: Boolean, default: true },
    phone: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] },
    certificates: { type: [String], default: [] },
    profilePic: { type: String, default: '' },
    sopAcceptedAt: { type: Date, default: null },
    sopAcceptedVersion: { type: String, default: '' },
    mustChangePassword: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function comparePassword(plainText) {
  return bcrypt.compare(plainText, this.passwordHash);
};

UserSchema.methods.setPassword = async function setPassword(plainText) {
  const saltRounds = 10;
  this.passwordHash = await bcrypt.hash(plainText, saltRounds);
  this.passwordChangedAt = new Date();
};

UserSchema.pre('save', function syncStatusAndActive(next) {
  if (this.isModified('status')) {
    this.active = this.status === 'active';
  } else if (this.isModified('active')) {
    this.status = this.active ? 'active' : 'inactive';
  } else if (!this.status) {
    this.status = this.active ? 'active' : 'inactive';
  }

  next();
});

UserSchema.methods.toSafeJSON = function toSafeJSON() {
  const status = this.status || (this.active ? 'active' : 'inactive');
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    status,
    active: status === 'active',
    phone: this.phone || '',
    skills: Array.isArray(this.skills) ? this.skills : [],
    certificates: Array.isArray(this.certificates) ? this.certificates : [],
    profilePic: this.profilePic || '',
    sopAcceptedAt: this.sopAcceptedAt || null,
    sopAcceptedVersion: this.sopAcceptedVersion || '',
    mustChangePassword: this.mustChangePassword,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const User = mongoose.model('User', UserSchema);

module.exports = { User };
