// pages/AdminPages/AdminStudentBusAssign.js
import React, { useState, useEffect } from 'react';
import { assignBusToStudent, removeStudentBusAssignment, subscribeToTransportData } from '../AdminPages/transportFunctions';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminStudentBusAssign.css';

const AdminStudentBusAssign = () => {
    const [students, setStudents] = useState([]);
    const [buses, setBuses] = useState([]);
    const [assignment, setAssignment] = useState({ studentId: '', busId: '' });

    useEffect(() => {
        const unsubscribers = [];
        unsubscribers.push(subscribeToTransportData('studentLog', setStudents));
        unsubscribers.push(subscribeToTransportData('buses', setBuses));
        return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }, []);

    const handleAssignment = async (e) => {
        e.preventDefault();
        try {
            await assignBusToStudent(assignment.studentId, assignment.busId);
            toast.success('Bus assigned successfully!');
            setAssignment({ studentId: '', busId: '' });
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleRemoveAssignment = async (studentId) => {
        if (window.confirm('Are you sure you want to remove this assignment?')) {
            try {
                await removeStudentBusAssignment(studentId);
                toast.success('Assignment removed successfully!');
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    return (
        <div className="admin-student-bus-assign">
            <h2>Student Bus Assignment</h2>
            <form onSubmit={handleAssignment}>
                <select
                    value={assignment.studentId}
                    onChange={(e) => setAssignment({ ...assignment, studentId: e.target.value })}
                    required
                >
                    <option value="">Select Student</option>
                    {students.map(student => (
                        <option key={student.id} value={student.id}>{student.email}</option>
                    ))}
                </select>
                <select
                    value={assignment.busId}
                    onChange={(e) => setAssignment({ ...assignment, busId: e.target.value })}
                    required
                >
                    <option value="">Select Bus</option>
                    {buses.map(bus => (
                        <option key={bus.id} value={bus.id}>{bus.busNumber}</option>
                    ))}
                </select>
                <button type="submit">Assign Bus</button>
            </form>

            <div className="assignment-list">
                {students.filter(s => s.transport?.busId).map(student => (
                    <div key={student.id} className="assignment-item">
                        <p>Student: {student.email}</p>
                        <p>Bus: {buses.find(b => b.id === student.transport?.busId)?.busNumber || 'N/A'}</p>
                        <button className="remove" onClick={() => handleRemoveAssignment(student.id)}>Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminStudentBusAssign;