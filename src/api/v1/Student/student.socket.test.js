import { Server } from 'socket.io';
import { createServer } from 'http';
import Client from 'socket.io-client';
import Admission from '../../Admission/Admission.model.mjs';
import { setupStudentSocket } from '../Student.socket.mjs';

const PORT = 4001;
let io, serverSocket, clientSocket;

describe('Student WebSocket', () => {
    beforeAll((done) => {
        const httpServer = createServer();
        io = new Server(httpServer);
        setupStudentSocket(io);
        httpServer.listen(PORT, () => {
            clientSocket = Client(`http://localhost:${PORT}/students`);
            clientSocket.on('connect', done);
        });
    });

    afterAll((done) => {
        if (clientSocket.connected) clientSocket.disconnect();
        io.close();
        done();
    });

    beforeEach(async () => {
        await Admission.create({
            uniqueId: 'CIITM_CSE_654321',
            student: {
                firstName: 'Web',
                lastName: 'Socket',
                fatherName: 'Father',
                motherName: 'Mother',
                email: ['websocket@student.com'],
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
            course_Id: '507f1f77bcf86cd799439011',
            mode: 'Online',
            university: 'Test University',
            fee: {},
            admited: true
        });
    });

    afterEach(async () => {
        await Admission.deleteMany({ 'student.email': 'websocket@student.com' });
    });

    it('should fetch students via WebSocket', (done) => {
        clientSocket.emit('get-students', { course: 'CSE', semester: 1, requestId: 'test1' });
        clientSocket.on('students-data', (data) => {
            expect(data.success).toBe(true);
            expect(Array.isArray(data.data)).toBe(true);
            expect(data.data.length).toBeGreaterThan(0);
            done();
        });
    });

    it('should return error for missing parameters', (done) => {
        clientSocket.emit('get-students', { requestId: 'test2' });
        clientSocket.on('student-error', (data) => {
            expect(data.error).toBeDefined();
            done();
        });
    });
});
