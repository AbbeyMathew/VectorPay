const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // Stored as a string: phone numbers are identifiers, not quantities (and can start with 0).
    phone: { type: String, required: true, unique: true, match: /^\d{10}$/ },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    isAdmin: { type: Boolean, default: false },
    // Sessions issued before this moment are rejected (see middleware/auth.js).
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    email: this.email,
    isAdmin: this.isAdmin,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
