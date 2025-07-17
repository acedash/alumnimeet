// components/PostForm/PostForm.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import postService from '../../services/postService';
import './PostForm.css';

const PostForm = ({ type = 'event', initialData = null, isEdit = false }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state - Updated to match schema structure
    const [formData, setFormData] = useState({
        type: initialData?.type || type,
        content: initialData?.content || '',
        
        // Event specific fields (matching eventDetails schema)
        eventTitle: initialData?.eventDetails?.title || '',
        eventDate: initialData?.eventDetails?.date ? 
            new Date(initialData.eventDetails.date).toISOString().split('T')[0] : '',
        eventTime: initialData?.eventDetails?.date ? 
            new Date(initialData.eventDetails.date).toTimeString().slice(0, 5) : '',
        location: initialData?.eventDetails?.location || '',
        registrationLink: initialData?.eventDetails?.registrationLink || '',
        
        // Job specific fields (matching jobDetails schema)
        company: initialData?.jobDetails?.company || '',
        position: initialData?.jobDetails?.position || '',
        jobType: initialData?.jobDetails?.jobType || 'full-time',
        salary: initialData?.jobDetails?.salary || '',
        applyBy: initialData?.jobDetails?.applyBy ? 
            new Date(initialData.jobDetails.applyBy).toISOString().split('T')[0] : '',
        applicationLink: initialData?.jobDetails?.applicationLink || '',
        
        // Common fields
        tags: initialData?.tags?.join(', ') || '',
        contactEmail: initialData?.contactEmail || user?.email || '',
        contactPhone: initialData?.contactPhone || ''
    });

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Prepare post data according to schema structure
            const postData = {
                type: formData.type,
                content: formData.content,
                author: user._id || user.id, // Add author field
                isActive: true
            };

            // Add type-specific fields in nested structure
            if (formData.type === 'event') {
                // Combine date and time for the Date field
                let eventDateTime = null;
                if (formData.eventDate) {
                    eventDateTime = new Date(formData.eventDate);
                    if (formData.eventTime) {
                        const [hours, minutes] = formData.eventTime.split(':');
                        eventDateTime.setHours(parseInt(hours), parseInt(minutes));
                    }
                }

                postData.eventDetails = {
                    title: formData.eventTitle,
                    date: eventDateTime,
                    location: formData.location,
                    registrationLink: formData.registrationLink || undefined
                };
            } else if (formData.type === 'job') {
                postData.jobDetails = {
                    company: formData.company,
                    position: formData.position,
                    jobType: formData.jobType,
                    salary: formData.salary || undefined,
                    applyBy: formData.applyBy ? new Date(formData.applyBy) : undefined,
                    applicationLink: formData.applicationLink || undefined
                };
            }

            // Create or update post
            let result;
            if (isEdit && initialData?._id) {
                result = await postService.updatePost(initialData._id, postData);
                setSuccess('Post updated successfully!');
            } else {
                result = await postService.createPost(postData);
                setSuccess('Post created successfully!');
            }

            // Redirect after successful creation/update
            setTimeout(() => {
                if (formData.type === 'event') {
                    navigate('/events');
                } else if (formData.type === 'job') {
                    navigate('/jobs');
                } else {
                    navigate('/posts');
                }
            }, 2000);

        } catch (error) {
            console.error('Error saving post:', error);
            setError(error.message || 'Failed to save post');
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const handleReset = () => {
        setFormData({
            type: type,
            content: '',
            eventTitle: '',
            eventDate: '',
            eventTime: '',
            location: '',
            registrationLink: '',
            company: '',
            position: '',
            jobType: 'full-time',
            salary: '',
            applyBy: '',
            applicationLink: '',
            tags: '',
            contactEmail: user?.email || '',
            contactPhone: ''
        });
        setError('');
        setSuccess('');
    };

    return (
        <div className="post-form-container">
            <div className="post-form-header">
                <h2>
                    {isEdit ? 'Edit' : 'Create'} {formData.type === 'event' ? 'Event' : formData.type === 'job' ? 'Job Opportunity' : 'Post'}
                </h2>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="post-form">
                {/* Post Type Selection */}
                <div className="form-group">
                    <label htmlFor="type">Post Type</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        disabled={isEdit} // Don't allow changing type during edit
                    >
                        <option value="normal">Normal Post</option>
                        <option value="event">Event</option>
                        <option value="job">Job Opportunity</option>
                    </select>
                </div>

                {/* Content/Description */}
                <div className="form-group">
                    <label htmlFor="content">
                        {formData.type === 'event' ? 'Event Description' : 
                         formData.type === 'job' ? 'Job Description' : 'Content'} *
                    </label>
                    <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        rows="4"
                        maxLength="2000"
                        placeholder={
                            formData.type === 'event' ? 
                                'Describe the event details, agenda, and what attendees can expect...' :
                            formData.type === 'job' ?
                                'Describe the job role, responsibilities, and what you\'re looking for...' :
                                'Write your post content...'
                        }
                    />
                    <small className="form-help">
                        {2000 - formData.content.length} characters remaining
                    </small>
                </div>

                {/* Event-specific fields */}
                {formData.type === 'event' && (
                    <>
                        <div className="form-group">
                            <label htmlFor="eventTitle">Event Title *</label>
                            <input
                                type="text"
                                id="eventTitle"
                                name="eventTitle"
                                value={formData.eventTitle}
                                onChange={handleChange}
                                required
                                placeholder="Enter event title"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="eventDate">Event Date *</label>
                                <input
                                    type="date"
                                    id="eventDate"
                                    name="eventDate"
                                    value={formData.eventDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="eventTime">Event Time</label>
                                <input
                                    type="time"
                                    id="eventTime"
                                    name="eventTime"
                                    value={formData.eventTime}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="location">Location *</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder="Event location or online meeting link"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="registrationLink">Registration Link</label>
                            <input
                                type="url"
                                id="registrationLink"
                                name="registrationLink"
                                value={formData.registrationLink}
                                onChange={handleChange}
                                placeholder="https://example.com/register"
                            />
                        </div>
                    </>
                )}

                {/* Job-specific fields */}
                {formData.type === 'job' && (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="company">Company *</label>
                                <input
                                    type="text"
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    required
                                    placeholder="Company name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="position">Position *</label>
                                <input
                                    type="text"
                                    id="position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    required
                                    placeholder="Job position/title"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="jobType">Job Type</label>
                                <select
                                    id="jobType"
                                    name="jobType"
                                    value={formData.jobType}
                                    onChange={handleChange}
                                >
                                    <option value="full-time">Full Time</option>
                                    <option value="part-time">Part Time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="salary">Salary</label>
                                <input
                                    type="text"
                                    id="salary"
                                    name="salary"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    placeholder="e.g., $50,000 - $70,000 per year"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="applyBy">Application Deadline</label>
                            <input
                                type="date"
                                id="applyBy"
                                name="applyBy"
                                value={formData.applyBy}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="applicationLink">Application Link</label>
                            <input
                                type="url"
                                id="applicationLink"
                                name="applicationLink"
                                value={formData.applicationLink}
                                onChange={handleChange}
                                placeholder="https://company.com/apply"
                            />
                        </div>
                    </>
                )}

                {/* Contact Information - Only for events/jobs */}
                {(formData.type === 'event' || formData.type === 'job') && (
                    <div className="form-section">
                        <h3>Contact Information</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="contactEmail">Contact Email</label>
                                <input
                                    type="email"
                                    id="contactEmail"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="contactPhone">Contact Phone</label>
                                <input
                                    type="tel"
                                    id="contactPhone"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tags */}
                <div className="form-group">
                    <label htmlFor="tags">Tags</label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="Enter tags separated by commas (e.g., networking, tech, career)"
                    />
                    <small className="form-help">
                        Add relevant tags to help people find your post
                    </small>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                {isEdit ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                {isEdit ? 'Update' : 'Create'} {
                                    formData.type === 'event' ? 'Event' : 
                                    formData.type === 'job' ? 'Job' : 'Post'
                                }
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostForm;