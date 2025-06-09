const request = require('supertest');
const mongoose = require('mongoose');
const { createServer } = require('../../../app');
const { db_connect } = require('../../config/Db.config.mjs');
const { default: Admission } = require('../../Admission/Admission.model.mjs');
const courseModel = require('../../Course/course.model.mjs');

jest.setTimeout(30000); // Increase timeout to 30 seconds

describe('GET /api/v1/student/students', () => {
    let server;
    let httpServer;
    let courseId;

    beforeAll(async () => {
        // Connect to MongoDB first
        await db_connect();

        // Create test course first (required for Admission)
        const course = await courseModel.create({
            courseName: 'CSE',
            coursePrice: 50000,
            courseDuration: 4,
            description: 'Computer Science Engineering'
        });
        courseId = course._id;

        // Create and start server
        ({ app: server, httpServer } = createServer());
        await new Promise((resolve) => httpServer.listen(0, resolve));

        // Seed test data
        try {
            await Admission.create({
                uniqueId: 'CIITM_CSE_123456',
                student: {
                    firstName: 'Test',
                    lastName: 'Student',
                    fatherName: 'Father',
                    motherName: 'Mother',
                    email: ['test@student.com'],
                    dateOfBirth: new Date('2000-01-01'),
                    gender: 'Male',
                    nationality: 'Indian',
                    contactNumber: '1234567890',
                },
                guardian: { Gname: 'Guardian', Grelation: 'Father', GcontactNumber: '1234567890' },
                address: { street: 'Street', city: 'City', state: 'State', pinCode: 123456 },
                AadharCard: { AadharCardNumber: '123456789012' },
                tenth: { tenthMarks: 90, tenthBoard: 'CBSE', tenthGrade: 'A' },
                twelfth: { twelfthMarks: 85, twelfthBoard: 'cbse', twelfthGrade: 'A' },
                dateOfAdmission: new Date(),
                course_Id: courseId,
                mode: 'Online',
                university: 'Test University',
                fee: {
                    course_Fee: 50000,
                    amount_due: 50000
                },
                admited: true
            });

            // Create another student with different course for filtering test
            await Admission.create({
                uniqueId: 'CIITM_ECE_123456',
                student: {
                    firstName: 'Test',
                    lastName: 'ECE',
                    email: ['test.ece@student.com'],
                    dateOfBirth: new Date('2000-01-01'),
                    gender: 'Male',
                    nationality: 'Indian',
                    contactNumber: '1234567890',
                },
                guardian: { Gname: 'Guardian', Grelation: 'Father', GcontactNumber: '1234567890' },
                address: { street: 'Street', city: 'City', state: 'State', pinCode: 123456 },
                AadharCard: { AadharCardNumber: '123456789012' },
                tenth: { tenthMarks: 90, tenthBoard: 'CBSE', tenthGrade: 'A' },
                twelfth: { twelfthMarks: 85, twelfthBoard: 'cbse', twelfthGrade: 'A' },
                dateOfAdmission: new Date(),
                course_Id: courseId,
                mode: 'Online',
                university: 'Test University',
                fee: {
                    course_Fee: 50000,
                    amount_due: 50000
                },
                admited: true
            });
        } catch (error) {
            console.error('Failed to seed test data:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            // Clean up test data
            await Admission.deleteMany({
                uniqueId: {
                    $in: ['CIITM_CSE_123456', 'CIITM_ECE_123456']
                }
            });
            await courseModel.findByIdAndDelete(courseId);

            // Close server
            await new Promise((resolve) => httpServer.close(resolve));

            // Close database connection
            await mongoose.disconnect();
        } catch (error) {
            console.error('Cleanup failed:', error);
            throw error;
        }
    });

    // Test successful retrieval of students
    it('should fetch students from the database', async () => {
        const res = await request(httpServer).get('/api/v1/student/students?course=CSE&semester=1');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.students)).toBe(true);
        expect(res.body.data.students.length).toBeGreaterThan(0);
        expect(res.body.data.students[0].uniqueId).toMatch(/^CIITM_CSE_/);
    });

    // Test error handling for missing parameters
    it('should return error for missing parameters', async () => {
        const res = await request(httpServer).get('/api/v1/student/students');
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe(true);
        expect(res.body.message).toBe('Course and semester parameters are required');
    });

    // Test error handling for invalid course
    it('should return error for invalid course', async () => {
        const res = await request(httpServer).get('/api/v1/student/students?course=INVALID&semester=1');
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe(true);
        expect(res.body.message).toBe('Invalid course code provided');
    });

    // Test error handling for invalid semester
    it('should return error for invalid semester', async () => {
        const res = await request(httpServer).get('/api/v1/student/students?course=CSE&semester=99');
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe(true);
        expect(res.body.message).toBe('Invalid semester number provided');
    });

    // Test filtering by course
    it('should only return students from specified course', async () => {
        const res = await request(httpServer).get('/api/v1/student/students?course=CSE&semester=1');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.students.every(student => student.uniqueId.startsWith('CIITM_CSE_'))).toBe(true);
    });
});
