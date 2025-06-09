import Admission from '../Admission/Admission.model.mjs';
import SendResponse from '../../../utils/SendResponse.mjs';
import {
  COURSES,
  SEMESTERS,
  HTTP_STATUS,
  ERROR_MESSAGES
} from './Student.constant.mjs'; // Fixed capitalization from './student.constant.mjs'

/**
 * Get students based on course and semester
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getStudents = async (req, res) => {
  try {
    const { course, semester } = req.query;

    // Validate required parameters
    if (!course || !semester) {
      throw new Error(ERROR_MESSAGES.MISSING_PARAMETERS);
    }

    // Validate course
    if (!Object.keys(COURSES).includes(course.toUpperCase())) {
      throw new Error(ERROR_MESSAGES.INVALID_COURSE);
    }

    // Validate semester
    const semesterNum = parseInt(semester);
    if (!SEMESTERS.includes(semesterNum)) {
      throw new Error(ERROR_MESSAGES.INVALID_SEMESTER);
    }

    // Fetch students from database
    const students = await Admission.find({
      'uniqueId': { $regex: `^CIITM_${course.toUpperCase()}_` },
      'student': { $exists: true },
      'admited': true,
    }).lean();

    if (!students || students.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_STUDENTS_FOUND);
    }    // Return successful response
    SendResponse.success(res, HTTP_STATUS.OK, `Successfully retrieved ${students.length} students`, {
      students: students.map(s => ({
        uniqueId: s.uniqueId,
        student: s.student,
        course: course.toUpperCase(),
        semester: semesterNum,
        fee: s.fee,
        admited: s.admited
      })),
      meta: {
        course: course.toUpperCase(),
        courseName: COURSES[course.toUpperCase()],
        semester: semesterNum,
        count: students.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in getStudents controller:', error);
    SendResponse.error(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Get all available courses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCourses = async (req, res) => {
  try {
    const courses = Object.entries(COURSES).map(([code, name]) => ({
      code,
      name
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Successfully retrieved courses',
      data: courses,
      meta: {
        count: courses.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in getCourses controller:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error occurred while fetching courses',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all available semesters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getSemesters = async (req, res) => {
  try {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Successfully retrieved semesters',
      data: SEMESTERS,
      meta: {
        count: SEMESTERS.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in getSemesters controller:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error occurred while fetching semesters',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get student by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Student ID is required',
        data: null
      });
    }

    // Search for student across all courses and semesters
    let foundStudent = null;

    for (const course of Object.keys(MOCK_STUDENTS)) {
      for (const semester of Object.keys(MOCK_STUDENTS[course])) {
        const student = MOCK_STUDENTS[course][semester].find(s => s.id === id);
        if (student) {
          foundStudent = student;
          break;
        }
      }
      if (foundStudent) break;
    }

    if (!foundStudent) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Student not found',
        data: null
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Successfully retrieved student',
      data: foundStudent,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in getStudentById controller:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error occurred while fetching student',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};