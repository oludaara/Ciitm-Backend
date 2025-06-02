import { Router } from 'express';
import { getStudentsByCourseAndSemester } from './student.controller.mjs';

const router = Router();

/**
 * @route GET /api/v1/student/students
 * @desc Get students by course and semester
 * @query {string} course - Course code (CSE, ECE, ME, CE, EE, IT)
 * @query {number} semester - Semester number (1-8)
 * @access Public
 * @example /api/v1/student/students?course=CSE&semester=1
 */
router.get('/students', getStudentsByCourseAndSemester);

/**
 * Health check route for student module
 * @route GET /api/v1/student/health
 * @desc Check if student module is working
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student module is working properly',
    timestamp: new Date().toISOString(),
    module: 'student',
    version: '1.0.0'
  });
});

export function setupStudentSocket(io) {
  // Use a namespace if you want, e.g., '/students'
  const studentNamespace = io.of('/students');

  studentNamespace.on('connection', (socket) => {
    socket.emit('connected', { message: 'Connected to student service' });

    socket.on(STUDENT_EVENTS.GET_STUDENTS, ({ course, semester }) => {
      if (!course || !semester) {
        socket.emit(STUDENT_EVENTS.STUDENT_ERROR, { error: ERROR_MESSAGES.MISSING_PARAMETERS });
        return;
      }
      if (!MOCK_STUDENTS[course]) {
        socket.emit(STUDENT_EVENTS.STUDENT_ERROR, { error: ERROR_MESSAGES.INVALID_COURSE });
        return;
      }
      const students = MOCK_STUDENTS[course][semester] || [];
      if (!students.length) {
        socket.emit(STUDENT_EVENTS.STUDENT_ERROR, { error: ERROR_MESSAGES.NO_STUDENTS_FOUND });
        return;
      }
      socket.emit(STUDENT_EVENTS.STUDENTS_DATA, {
        data: students,
        meta: {
          course,
          courseName: COURSES[course],
          semester: Number(semester),
          count: students.length,
          timestamp: new Date().toISOString()
        }
      });
    });
  });
}

export default router;

export const getStudentsByCourseAndSemester = (req, res) => {
  const { course, semester } = req.query;
  if (!course || !semester) {
    return res.status(400).json({ success: false, message: ERROR_MESSAGES.MISSING_PARAMETERS });
  }
  if (!MOCK_STUDENTS[course]) {
    return res.status(400).json({ success: false, message: ERROR_MESSAGES.INVALID_COURSE });
  }
  const students = MOCK_STUDENTS[course][semester] || [];
  if (!students.length) {
    return res.status(404).json({ success: false, message: ERROR_MESSAGES.NO_STUDENTS_FOUND });
  }
  res.json({
    success: true,
    message: `Successfully retrieved ${students.length} students`,
    data: students,
    meta: {
      course,
      courseName: COURSES[course],
      semester: Number(semester),
      count: students.length,
      timestamp: new Date().toISOString()
    }
  });
};