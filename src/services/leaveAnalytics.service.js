import { Pass } from "../models/Pass.model.js";
import { PASS_TYPES } from "../constants/passTypes.js";
import { PASS_STATUS } from "../constants/status.js";

export const EXCESSIVE_LEAVE_LIMIT = 10;
export const getStudentLeaveStats = async ({ department = null, passTypeFilter = null } = {}) => {
  const query = {
    status: PASS_STATUS.APPROVED,
    passType: { $in: [PASS_TYPES.OUT_OF_STATION, PASS_TYPES.LOCAL] },
  };

  if (department) {
    query.department = department;
  }

  if (passTypeFilter) {
    query.passType = passTypeFilter;
  }

  const aggregation = await Pass.aggregate([
    { $match: query },

    {
      $group: {
        _id: "$student",
        totalLeaves: { $sum: 1 },
        outOfStation: {
          $sum: { $cond: [{ $eq: ["$passType", PASS_TYPES.OUT_OF_STATION] }, 1, 0] }
        },
        local: {
          $sum: { $cond: [{ $eq: ["$passType", PASS_TYPES.LOCAL] }, 1, 0] }
        },
        department: { $first: "$department" },
        year: { $first: "$year" },
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "studentDetails"
      }
    },

    {
      $unwind: {
        path: "$studentDetails",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $project: {
        studentId: "$_id",
        name: "$studentDetails.name",
        rollNo: "$studentDetails.rollNo",
        year: "$year",
        department: "$department",
        totalLeaves: 1,
        outOfStation: 1,
        local: 1,
        isFlagged: {
          $cond: [{ $gt: ["$totalLeaves", EXCESSIVE_LEAVE_LIMIT] }, true, false]
        }
      }
    },

    { $sort: { totalLeaves: -1 } }
  ]);

  return aggregation;
};

export const getDepartmentLeaveStats = async () => {
  const stats = await getStudentLeaveStats();

  const departmentStats = {};
  
  stats.forEach((student) => {
    const dept = student.department || "Unknown";
    if (!departmentStats[dept]) {
      departmentStats[dept] = [];
    }
    departmentStats[dept].push(student);
  });

  return departmentStats;
};

