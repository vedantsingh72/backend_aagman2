import mongoose from "mongoose";
import { DEPARTMENTS } from "../constants/departments.js";
import { PASS_TYPE_ENUM } from "../constants/passTypes.js";
import { APPROVAL_STATUS } from "../constants/status.js";
const { Schema } = mongoose;


const PassSchema = new mongoose.Schema(
    {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    passType: {
      type: String,
      enum: PASS_TYPE_ENUM,
      required: true,
    },

    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },

    year: {
      type: String,
      enum: ["1", "2", "3", "4"],
    },

    hostel: {
      type: String,
      required: false,
    },

    reason: String,
    reasonForLeave: String,
    fromDate: Date,
    toDate: Date,

    placeWhereGoing: String,
    contactNumber: String,
    guardianContactNumber: String,
    addressDuringLeave: String,
    travelMode: {
      type: String,
      enum: ["Bus", "Train", "Flight", "Personal"],
    },
    emergencyContactName: String,
    emergencyContactRelation: String,

    departmentApproval: {
      status: {
        type: String,
        enum: Object.values(APPROVAL_STATUS),
        default: "PENDING",
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "Department",
      },
      approvedAt: Date,
    },

    academicApproval: {
      status: {
        type: String,
        enum: Object.values(APPROVAL_STATUS),
        default: "PENDING",
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "Academic",
      },
      approvedAt: Date,
    },

    hostelApproval: {
      status: {
        type: String,
        enum: Object.values(APPROVAL_STATUS),
        default: "PENDING",
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "HostelOffice",
      },
      approvedAt: Date,
    },

    status: {
      type: String,
      enum: ["PENDING_DEPARTMENT", "PENDING_ACADEMIC", "PENDING_HOSTEL", "APPROVED", "REJECTED", "EXPIRED"],
      default: "PENDING_DEPARTMENT",
    },

    qrCode: String,
    qrImage: String,

    isUsed: {
      type: Boolean,
      default: false,
    },

    scannedOutAt: {
      type: Date,
    },
    scannedInAt: {
      type: Date,
    },
    exitTime: {
      type: Date,
    },
    entryTime: {
      type: Date,
    },
    scanCount: {
      type: Number,
      default: 0,
    },

    approvedByDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    approvedByAcademic: {
      type: Schema.Types.ObjectId,
      ref: "Academic",
    },
    approvedByHostel: {
      type: Schema.Types.ObjectId,
      ref: "HostelOffice",
    },
    scannedByGate: {
      type: Schema.Types.ObjectId,
      ref: "Gate",
    },
  },
  { timestamps: true }
);

export const Pass = mongoose.model("Pass", PassSchema)