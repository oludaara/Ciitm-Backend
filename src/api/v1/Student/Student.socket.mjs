import {
  STUDENT_EVENTS,
  ERROR_MESSAGES,
  COURSES
} from './Student.constant.mjs';  // Fixed capitalization
import Admission from '../Admission/Admission.model.mjs';
import SendResponse from '../../../utils/SendResponse.mjs';

/**
 * Set up WebSocket connection for student operations
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
export const setupStudentSocket = (io) => {
  // Create a namespace for student operations
  const studentNamespace = io.of('/students');

  studentNamespace.on('connection', (socket) => {
    console.log(`Student WebSocket client connected: ${socket.id}`);

    // Handle get-students event
    socket.on(STUDENT_EVENTS.GET_STUDENTS, async (data) => {
      try {
        const { course, semester, requestId } = data;
        if (!course || !semester) {
          throw new Error(ERROR_MESSAGES.MISSING_PARAMETERS);
        }
        if (!Object.keys(COURSES).includes(course.toUpperCase())) {
          throw new Error(ERROR_MESSAGES.INVALID_COURSE);
        }
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
        }
        socket.emit(STUDENT_EVENTS.STUDENTS_DATA, {
          success: true,
          data: students,
          meta: {
            course: course.toUpperCase(),
            courseName: COURSES[course.toUpperCase()],
            semester: semesterNum,
            count: students.length,
            timestamp: new Date().toISOString(),
            requestId
          }
        });
      } catch (error) {
        socket.emit(STUDENT_EVENTS.STUDENT_ERROR, {
          error: error.message,
          requestId: data?.requestId,
          timestamp: new Date().toISOString(),
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });

    // Handle real-time student updates (for future implementation)
    socket.on('subscribe-to-course', (data) => {
      const { course, semester } = data;
      const roomName = `${course}_${semester}`;
      socket.join(roomName);
      console.log(`Client ${socket.id} subscribed to ${roomName}`);

      socket.emit('subscription-confirmed', {
        room: roomName,
        message: `Successfully subscribed to ${COURSES[course]} - Semester ${semester}`,
        timestamp: new Date().toISOString()
      });
    });

    // Handle unsubscribe from course updates
    socket.on('unsubscribe-from-course', (data) => {
      const { course, semester } = data;
      const roomName = `${course}_${semester}`;
      socket.leave(roomName);
      console.log(`Client ${socket.id} unsubscribed from ${roomName}`);

      socket.emit('unsubscription-confirmed', {
        room: roomName,
        message: `Successfully unsubscribed from ${COURSES[course]} - Semester ${semester}`,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Student WebSocket client disconnected: ${socket.id}`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for client ${socket.id}:`, error);
      socket.emit(STUDENT_EVENTS.STUDENT_ERROR, {
        error: 'Socket connection error occurred',
        timestamp: new Date().toISOString()
      });
    });

    // Send initial connection confirmation
    socket.emit('connected', {
      message: 'Successfully connected to student service',
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      availableEvents: Object.values(STUDENT_EVENTS)
    });
  });

  return studentNamespace;
};

/**
 * Broadcast student updates to subscribed clients
 * @param {SocketIO.Namespace} studentNamespace - Student namespace
 * @param {string} course - Course code
 * @param {number} semester - Semester number
 * @param {Object} updateData - Update data to broadcast
 */
export const broadcastStudentUpdate = (studentNamespace, course, semester, updateData) => {
  const roomName = `${course}_${semester}`;

  studentNamespace.to(roomName).emit('student-update', {
    ...updateData,
    course,
    semester,
    timestamp: new Date().toISOString()
  });

  console.log(`Broadcasted student update to room: ${roomName}`);
};

/**
 * Get connected clients count for a specific course and semester
 * @param {SocketIO.Namespace} studentNamespace - Student namespace
 * @param {string} course - Course code
 * @param {number} semester - Semester number
 * @returns {Promise<number>} Number of connected clients
 */
export const getConnectedClientsCount = async (studentNamespace, course, semester) => {
  const roomName = `${course}_${semester}`;
  const clients = await studentNamespace.in(roomName).fetchSockets();
  return clients.length;
};

// Export default setup function
export default setupStudentSocket;