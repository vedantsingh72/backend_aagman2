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

    // Department - auto-assigned from student profile
    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },

    // Year - auto-assigned from student profile
    year: {
      type: String,
      enum: ["1", "2", "3", "4"],
    },

    // Common fields
    reason: String,
    reasonForLeave: String, // For Out of Station
    fromDate: Date,
    toDate: Date,

    // Out of Station specific fields
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

    // Department Approval (first step for OUT_OF_STATION)
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

    // Academic Approval (second step for OUT_OF_STATION)
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

    // Hostel Approval (for LOCAL passes)
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

    // Overall status
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

    // QR Scan tracking
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

    // Approval tracking fields (for history/logs)
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