import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const AcademicSchema = new mongoose.Schema({
    name: String,

    academicId: {
      type: String,
      required: true,
      unique: true,
    },

    designation: String,

    password: {
      type: String,
      required: true,
    },

    // OTP Verification fields
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

AcademicSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

AcademicSchema.methods.isPasswordCorrect = function (password) {
  return bcrypt.compare(password, this.password);
};

export const Academic = mongoose.model("Academic", AcademicSchema);