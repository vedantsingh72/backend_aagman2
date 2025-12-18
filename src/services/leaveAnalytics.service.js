import { Pass } from "../models/Pass.model.js";
import { PASS_TYPES } from "../constants/passTypes.js";
import { PASS_STATUS } from "../constants/status.js";

/**
 * EXCESSIVE_LEAVE_LIMIT - Configurable threshold for flagging students
 * Students with more than this many leaves will be flagged
 */
export const EXCESSIVE_LEAVE_LIMIT = 10; // per semester

/**
 * Get student-wise leave statistics
 * Aggregates approved passes by student
 * 
 * @param {Object} options
 * @param {string} options.department - Filter by department (optional)
 * @returns {Promise<Array>} Array of student leave statistics
 */
export const getStudentLeaveStats = async ({ department = null } = {}) => {
  // Build query - only approved passes
  const query = {
    status: PASS_STATUS.APPROVED,
    passType: { $in: [PASS_TYPES.OUT_OF_STATION, PASS_TYPES.LOCAL] },
  };

  // Filter by department if provided
  if (department) {
    query.department = department;
  }

  // Aggregate passes by student
  const aggregation = await Pass.aggregate([
    // Match approved passes only
    { $match: query },

    // Group by student
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
        // Get department and year from first pass (should be same for all)
        department: { $first: "$department" },
        year: { $first: "$year" },
      }
    },

    // Lookup student details
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "studentDetails"
      }
    },

    // Unwind student details
    {
      $unwind: {
        path: "$studentDetails",
        preserveNullAndEmptyArrays: true
      }
    },

    // Project final structure
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

    // Sort by total leaves (descending)
    { $sort: { totalLeaves: -1 } }
  ]);

  return aggregation;
};

/**
 * Get department-wise leave statistics
 * Groups students by department
 * 
 * @returns {Promise<Object>} Object with department names as keys
 */
export const getDepartmentLeaveStats = async () => {
  const stats = await getStudentLeaveStats();

  // Group by department
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

