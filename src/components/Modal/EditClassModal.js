import React, { useState, useEffect } from "react";
import '../Modal/EditClassModal.css'
const EditClassModal = ({ show, onClose, onSubmit, classData, teachers, students }) => {
    const [formData, setFormData] = useState({
        id: "",
        className: "",
        teacherId: "",
        teacherEmail: "",
        students: [],
    });

    useEffect(() => {
        if (classData) {
            setFormData({
                id: classData.id || "",
                className: classData.className || "",
                teacherId: classData.teacherId || "",
                teacherEmail: classData.teacherEmail || "",
                students: classData.students || [],
            });
        }
    }, [classData]);

    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.className || !formData.teacherId) {
            alert("Please fill in all required fields");
            return;
        }
        onSubmit(formData);
    };

    const handleTeacherChange = (e) => {
        const selectedTeacher = teachers.find((teacher) => teacher.id === e.target.value);
        if (selectedTeacher) {
            setFormData((prev) => ({
                ...prev,
                teacherId: selectedTeacher.id,
                teacherEmail: selectedTeacher.email,
            }));
        }
    };

    const handleStudentChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selectedStudents = selectedOptions.map((option) => {
            const student = students.find((s) => s.id === option.value);
            return {
                studentId: student.id,
                studentEmail: student.email
            };
        });

        setFormData((prev) => ({
            ...prev,
            students: selectedStudents,
        }));
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">Edit Class</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Class Name</label>
                        <select
                            className="form-select"
                            value={formData.className}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    className: e.target.value
                                }))
                            }
                            required
                        >
                            <option value="">Select Class</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={`${i + 1}th`}>
                                    {i + 1}{i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Select Teacher</label>
                        <select
                            className="form-select"
                            value={formData.teacherId}
                            onChange={handleTeacherChange}
                            required
                        >
                            <option value="">Choose a teacher</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Select Students</label>
                        <select
                            multiple
                            className="form-select"
                            onChange={handleStudentChange}
                            size="5"
                            value={formData.students.map(s => s.studentId)}
                        >
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.email}
                                </option>
                            ))}
                        </select>
                        <p className="hint-text">Hold Ctrl/Cmd to select multiple students</p>
                    </div>

                    <div className="button-group">
                        <button type="button" onClick={onClose} className="cancel-button">
                            Cancel
                        </button>
                        <button type="submit" className="submit-button">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditClassModal;