import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const HostelOfficeSchema = new mongoose.Schema(
   {
    hostelName: String,

    officeId: {
      type: String,
      required: true,
      unique: true,
    },

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


HostelOfficeSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

HostelOfficeSchema.methods.isPasswordCorrect = function (password) {
  return bcrypt.compare(password, this.password);
};


export const HostelOffice = mongoose.model("HostelOffice",HostelOfficeSchema);