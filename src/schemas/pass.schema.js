import { z } from "zod";
import { PASS_TYPES } from "../constants/passTypes.js";

export const createPassSchema = z.object({
  passType: z.enum(Object.values(PASS_TYPES), {
    errorMap: () => ({ message: `Pass type must be one of: ${Object.values(PASS_TYPES).join(", ")}` }),
  }),

  // Common fields
  reason: z.string().min(3, "Reason is required").optional(),
  reasonForLeave: z.string().min(3, "Reason for leave is required").optional(),
  fromDate: z.string().or(z.date()),
  toDate: z.string().or(z.date()),

  // Out of Station specific fields
  placeWhereGoing: z.string().optional(),
  contactNumber: z.string().regex(/^\d{10}$/, "Contact number must be 10 digits").optional(),
  guardianContactNumber: z.string().regex(/^\d{10}$/, "Guardian contact number must be 10 digits").optional(),
  addressDuringLeave: z.string().optional(),
  travelMode: z.enum(["Bus", "Train", "Flight", "Personal"]).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
}).refine((data) => {
  // For OUT_OF_STATION, require Out of Station specific fields
  if (data.passType === PASS_TYPES.OUT_OF_STATION) {
    return data.reasonForLeave && data.placeWhereGoing && data.contactNumber && 
           data.guardianContactNumber && data.addressDuringLeave;
  }
  // For others, require reason
  if (data.passType !== PASS_TYPES.OUT_OF_STATION) {
    return data.reason;
  }
  return true;
}, {
  message: "Required fields missing for selected pass type",
});
