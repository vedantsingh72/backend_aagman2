import mongoose from "mongoose";
import bcrypt from "bcrypt";

const GateSchema = new mongoose.Schema({
      gateId: {
      type: String,
      required: true,
      unique: true,
    },

    gateName: String,

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

GateSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

GateSchema.methods.isPasswordCorrect = function (password) {
  return bcrypt.compare(password, this.password);
};


export const Gate = mongoose.model("Gate", GateSchema);