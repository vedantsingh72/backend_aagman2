import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import { DEPARTMENTS } from "../constants/departments.js";

const DepartmentSchema =new mongoose.Schema(
   {
    departmentName: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },

    departmentId: {
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


DepartmentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

DepartmentSchema.methods.isPasswordCorrect = function (password) {
  return bcrypt.compare(password, this.password);
};

export const Department = mongoose.model("Department",DepartmentSchema);