import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { DEPARTMENTS } from "../constants/departments.js";

const UserSchema =new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
    },

    rollNo: {
      type: String,
      required: true,
      unique: true,
    },

    registrationNo: {
      type: String,
      required: true,
      unique: true,
    },

    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },

    year: {
      type: String,
      enum: ["1", "2", "3", "4"],
      required: false,
    },

    hostel: {
      type: String,
      required: false,
    },

    password: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
    },

    // OTP Verification fields
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
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);


UserSchema.pre('save', async function(){
   if(!this.isModified('password')) return;
   this.password = await bcrypt.hash(this.password, 10);
})

UserSchema.methods.generateAccessToken = function(){
     return jwt.sign(
    {
      _id: this._id,
      id: this._id,
      rollNo: this.rollNo,
      role: "user", // Lowercase to match backend role system
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
}

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};


UserSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};


export const User = mongoose.model("User",UserSchema)