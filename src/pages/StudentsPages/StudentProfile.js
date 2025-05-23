import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/config";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import '../../pages/StudentPagesStyle/StudentProfile.css';

// Component sections
const ProfilePictureSection = ({
    imageSrc,
    imgRef,
    crop,
    setCrop,
    handleCropComplete,
    saveCroppedImage,
    formData,
    handleImageUpload
}) => (
    <div className="sp-form-group">
        <label className="sp-form-label">Profile Picture</label>
        <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="sp-file-input"
        />
        {imageSrc && (
            <div className="sp-crop-container">
                <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={handleCropComplete}
                    aspect={1}
                >
                    <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="Crop preview"
                        onLoad={(e) => (imgRef.current = e.target)}
                        className="sp-crop-image"
                    />
                </ReactCrop>
                <button
                    type="button"
                    onClick={saveCroppedImage}
                    className="sp-crop-button"
                >
                    Crop & Save
                </button>
            </div>
        )}
        {formData.profilePicture && !imageSrc && (
            <img
                src={formData.profilePicture}
                alt="Profile Preview"
                className="sp-profile-pic-preview"
            />
        )}
    </div>
);

const ProfileForm = ({
    formData,
    handleInputChange,
    loading,
    handleSubmit,
    imageSrc,
    imgRef,
    crop,
    setCrop,
    handleCropComplete,
    saveCroppedImage,
    handleImageUpload
}) => (
    <form onSubmit={handleSubmit} className="sp-profile-form">
        <div className="sp-form-grid">
            <div className="sp-form-column">
                <div className="sp-form-group">
                    <label className="sp-form-label">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Date of Birth</label>
                    <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Gender</label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="sp-form-select"
                        required
                    >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Class</label>
                    <input
                        type="text"
                        name="class"
                        value={formData.class}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Roll Number</label>
                    <input
                        type="text"
                        name="rollNumber"
                        value={formData.rollNumber}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Blood Group</label>
                    <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        className="sp-form-select"
                        required
                    >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>
                </div>
            </div>

            <div className="sp-form-column">
                <div className="sp-form-group">
                    <label className="sp-form-label">Parent Name</label>
                    <input
                        type="text"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Parent Contact</label>
                    <input
                        type="tel"
                        name="parentContact"
                        value={formData.parentContact}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="sp-form-textarea"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Emergency Contact Name</label>
                    <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Emergency Contact Number</label>
                    <input
                        type="tel"
                        name="emergencyContactNumber"
                        value={formData.emergencyContactNumber}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <ProfilePictureSection
                    imageSrc={imageSrc}
                    imgRef={imgRef}
                    crop={crop}
                    setCrop={setCrop}
                    handleCropComplete={handleCropComplete}
                    saveCroppedImage={saveCroppedImage}
                    formData={formData}
                    handleImageUpload={handleImageUpload}
                />
            </div>
        </div>

        <div className="sp-form-actions">
            <button
                type="submit"
                disabled={loading}
                className="sp-submit-button"
            >
                {loading ? "Saving..." : "Create Profile"}
            </button>
        </div>
    </form>
);

const EditForm = ({
    formData,
    handleInputChange,
    loading,
    handleUpdate,
    setIsEditing,
    imageSrc,
    imgRef,
    crop,
    setCrop,
    handleCropComplete,
    saveCroppedImage,
    handleImageUpload
}) => (
    <form onSubmit={handleUpdate} className="sp-profile-form">
        <div className="sp-form-grid">
            <div className="sp-form-column">
                <div className="sp-form-group">
                    <label className="sp-form-label">Parent Contact</label>
                    <input
                        type="tel"
                        name="parentContact"
                        value={formData.parentContact}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="sp-form-textarea"
                        required
                    />
                </div>
            </div>

            <div className="sp-form-column">
                <div className="sp-form-group">
                    <label className="sp-form-label">Emergency Contact Name</label>
                    <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <div className="sp-form-group">
                    <label className="sp-form-label">Emergency Contact Number</label>
                    <input
                        type="tel"
                        name="emergencyContactNumber"
                        value={formData.emergencyContactNumber}
                        onChange={handleInputChange}
                        className="sp-form-input"
                        required
                    />
                </div>

                <ProfilePictureSection
                    imageSrc={imageSrc}
                    imgRef={imgRef}
                    crop={crop}
                    setCrop={setCrop}
                    handleCropComplete={handleCropComplete}
                    saveCroppedImage={saveCroppedImage}
                    formData={formData}
                    handleImageUpload={handleImageUpload}
                />
            </div>
        </div>

        <div className="sp-form-actions">
            <button
                type="submit"
                disabled={loading}
                className="sp-submit-button"
            >
                Save Changes
            </button>
            <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="sp-cancel-button"
            >
                Cancel
            </button>
        </div>
    </form>
);

const ProfileView = ({ formData, setIsEditing, navigate }) => (
    <div className="sp-profile-view">
        <div className="sp-profile-header">
            <div className="sp-profile-pic-container">
                {formData.profilePicture && (
                    <img
                        src={formData.profilePicture}
                        alt="Profile"
                        className="sp-profile-pic"
                    />
                )}
            </div>
            <div className="sp-profile-title">
                <h3 className="sp-profile-name">{formData.name}</h3>
                <span className="sp-profile-role">Student</span>
            </div>
        </div>

        <div className="sp-profile-body">
            <div className="sp-profile-section">
                <h4 className="sp-section-title">Personal Information</h4>
                <div className="sp-profile-details">
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Date of Birth</span>
                        <span className="sp-detail-value">{formData.dob}</span>
                    </div>
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Gender</span>
                        <span className="sp-detail-value">{formData.gender}</span>
                    </div>
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Blood Group</span>
                        <span className="sp-detail-value">{formData.bloodGroup}</span>
                    </div>
                </div>
            </div>

            <div className="sp-profile-section">
                <h4 className="sp-section-title">Academic Information</h4>
                <div className="sp-profile-details">
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Class</span>
                        <span className="sp-detail-value">{formData.class}</span>
                    </div>
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Roll Number</span>
                        <span className="sp-detail-value">{formData.rollNumber}</span>
                    </div>
                </div>
            </div>

            <div className="sp-profile-section">
                <h4 className="sp-section-title">Contact Information</h4>
                <div className="sp-profile-details">
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Parent Name</span>
                        <span className="sp-detail-value">{formData.parentName}</span>
                    </div>
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Parent Contact</span>
                        <span className="sp-detail-value">{formData.parentContact}</span>
                    </div>
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Address</span>
                        <span className="sp-detail-value">{formData.address}</span>
                    </div>
                </div>
            </div>

            <div className="sp-profile-section">
                <h4 className="sp-section-title">Emergency Contact</h4>
                <div className="sp-profile-details">
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Name</span>
                        <span className="sp-detail-value">{formData.emergencyContactName}</span>
                    </div>
                    <div className="sp-detail-item">
                        <span className="sp-detail-label">Number</span>
                        <span className="sp-detail-value">{formData.emergencyContactNumber}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="sp-profile-actions">
            <button onClick={() => setIsEditing(true)} className="sp-edit-button">
                Edit Profile
            </button>
            <button onClick={() => navigate('/student/id-card')} className="sp-view-button">
                View ID Card
            </button>
        </div>
    </div>
);

const StudentProfile = () => {
    // State declarations
    const [profileExists, setProfileExists] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        dob: "",
        gender: "",
        class: "",
        rollNumber: "",
        parentName: "",
        parentContact: "",
        address: "",
        profilePicture: "",
        bloodGroup: "",
        emergencyContactName: "",
        emergencyContactNumber: "",
        activityLog: []
    });
    const [loading, setLoading] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 / 1 });
    const [completedCrop, setCompletedCrop] = useState(null);

    // Refs and hooks
    const imgRef = useRef(null);
    const navigate = useNavigate();
    const user = auth.currentUser;

    // Check if user is authenticated and profile exists
    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }
        checkProfileExists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, navigate]);

    // Check if profile exists in database
    const checkProfileExists = async () => {
        try {
            const profileRef = doc(db, "students-profile", user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                setProfileExists(true);
                setFormData(profileSnap.data());
                onSnapshot(profileRef, (doc) => {
                    setFormData(doc.data());
                });
            } else {
                setProfileExists(false);
            }
        } catch (error) {
            toast.error("Error checking profile: " + error.message);
        }
    };

    // Form input change handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Image upload handler
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Get cropped image from canvas
    const getCroppedImg = (image, crop) => {
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY
        );

        return canvas.toDataURL("image/jpeg");
    };

    // Handle crop complete
    const handleCropComplete = (crop) => {
        setCompletedCrop(crop);
    };

    // Save cropped image
    const saveCroppedImage = () => {
        if (imgRef.current && completedCrop) {
            const croppedImageUrl = getCroppedImg(imgRef.current, completedCrop);
            setFormData(prev => ({ ...prev, profilePicture: croppedImageUrl }));
            setImageSrc(null);
            setCompletedCrop(null);
        }
    };

    // Form validation
    const validateForm = () => {
        const requiredFields = [
            "name", "dob", "gender", "class", "rollNumber",
            "parentName", "parentContact", "address", "bloodGroup",
            "emergencyContactName", "emergencyContactNumber"
        ];
        for (let field of requiredFields) {
            if (!formData[field]) {
                toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        if (!/^\d{10}$/.test(formData.parentContact)) {
            toast.error("Parent contact must be a 10-digit number");
            return false;
        }
        if (!/^\d{10}$/.test(formData.emergencyContactNumber)) {
            toast.error("Emergency contact number must be a 10-digit number");
            return false;
        }
        return true;
    };

    // Create new profile
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const profileRef = doc(db, "students-profile", user.uid);
            await setDoc(profileRef, {
                ...formData,
                userId: user.uid,
                email: user.email,
                createdAt: new Date().toISOString(),
                activityLog: []
            });

            await updateDoc(doc(db, "studentLog", user.uid), {
                profileComplete: true
            });

            // Generate ID Card
            const idCardRef = doc(db, 'student-id-cards', user.uid);
            const uniqueID = `SID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const issueDate = new Date().toISOString().split('T')[0];
            const expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString()
                .split('T')[0];

            await setDoc(idCardRef, {
                studentName: formData.name,
                profilePicture: formData.profilePicture,
                rollNumber: formData.rollNumber,
                class: formData.class,
                schoolName: "Education School",
                qrCodeData: `https://yourdomain.com/student-profile/${user.uid}`,
                dob: formData.dob,
                gender: formData.gender,
                parentName: formData.parentName,
                parentContact: formData.parentContact,
                emergencyContactNumber: formData.emergencyContactNumber,
                issueDate,
                expiryDate,
                uniqueID,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });

            toast.success("Profile and ID card created successfully!");
            setProfileExists(true);
            navigate("/student/id-card");
        } catch (error) {
            toast.error("Error creating profile: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Update existing profile
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const profileRef = doc(db, "students-profile", user.uid);
            const profileSnap = await getDoc(profileRef);
            const oldData = profileSnap.data();

            const changes = [];
            const fieldsToCheck = ["parentContact", "address", "profilePicture", "emergencyContactName", "emergencyContactNumber"];
            fieldsToCheck.forEach(field => {
                if (oldData[field] !== formData[field]) {
                    changes.push(`Updated ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                }
            });

            const updateTime = new Date().toLocaleString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
            });
            const logEntry = changes.length > 0 ? `${changes.join(", ")} on ${updateTime}` : `No changes made on ${updateTime}`;

            await updateDoc(profileRef, {
                parentContact: formData.parentContact,
                address: formData.address,
                profilePicture: formData.profilePicture,
                emergencyContactName: formData.emergencyContactName,
                emergencyContactNumber: formData.emergencyContactNumber,
                updatedAt: new Date().toISOString(),
                activityLog: arrayUnion(logEntry)
            });

            // Update ID Card if profile picture or name changed
            if (oldData.profilePicture !== formData.profilePicture || oldData.name !== formData.name) {
                const idCardRef = doc(db, 'student-id-cards', user.uid);
                await updateDoc(idCardRef, {
                    studentName: formData.name,
                    profilePicture: formData.profilePicture,
                    rollNumber: formData.rollNumber,
                    class: formData.class,
                    dob: formData.dob, // Sync missing field
                    gender: formData.gender, // Sync missing field
                    parentName: formData.parentName, // Sync missing field
                    parentContact: formData.parentContact, // Sync missing field
                    emergencyContactNumber: formData.emergencyContactNumber, // Sync missing field
                    updatedAt: new Date().toISOString(),
                    status: 'pending' // Reset status to pending for admin approval
                });
            }

            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            toast.error("Error updating profile: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (profileExists === null) {
        return (
            <div className="sp-loading-container">
                <div className="sp-loading-spinner"></div>
                <p className="sp-loading-text">Loading profile information...</p>
            </div>
        );
    }

    // Render create profile form if profile doesn't exist
    if (!profileExists) {
        return (
            <div className="sp-profile-container">
                <div className="sp-profile-card">
                    <h2 className="sp-profile-header-title">Create Your Profile</h2>
                    <ProfileForm
                        formData={formData}
                        handleInputChange={handleInputChange}
                        loading={loading}
                        handleSubmit={handleSubmit}
                        imageSrc={imageSrc}
                        imgRef={imgRef}
                        crop={crop}
                        setCrop={setCrop}
                        handleCropComplete={handleCropComplete}
                        saveCroppedImage={saveCroppedImage}
                        handleImageUpload={handleImageUpload}
                    />
                </div>
            </div>
        );
    }

    // Render profile view or edit form based on isEditing state
    return (
        <div className="sp-profile-container">
            <div className="sp-profile-card">
                <h2 className="sp-profile-header-title">Your Profile</h2>
                {isEditing ? (
                    <EditForm
                        formData={formData}
                        handleInputChange={handleInputChange}
                        loading={loading}
                        handleUpdate={handleUpdate}
                        setIsEditing={setIsEditing}
                        imageSrc={imageSrc}
                        imgRef={imgRef}
                        crop={crop}
                        setCrop={setCrop}
                        handleCropComplete={handleCropComplete}
                        saveCroppedImage={saveCroppedImage}
                        handleImageUpload={handleImageUpload}
                    />
                ) : (
                    <ProfileView
                        formData={formData}
                        setIsEditing={setIsEditing}
                        navigate={navigate}
                    />
                )}
            </div>
        </div>
    );
};

export default StudentProfile;