const User = require('../models/User');

const mongoose = require('mongoose'); // Import mongoose
const cloudinary = require('../utils/cloudinary');

const uploadToCloudinary = async (file) => {
    // In a real app, implement proper error handling, folder structure, etc.
    if (!file) return null;

    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'rentzy/owner_verification', // Optional: specify a folder
        });
        // Remove the local file after upload if Multer stored it
        // require('fs').unlinkSync(file.path); // Uncomment if using diskStorage
        return result.secure_url; // Return the secure URL
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image to Cloudinary.');
    }
};


exports.becomeOwner = async (req, res) => {
    try {
        // Assuming user is authenticated and attached to req.user
        const userId = req.user._id; // Get user ID from authenticated user

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Check if user already has a pending/approved request
        // You might want to allow resubmission if rejected, based on your logic
        if (user.owner_request_status === 'pending' || user.owner_request_status === 'approved') {
             return res.status(400).json({ success: false, message: 'Bạn đã gửi yêu cầu hoặc đã là chủ xe.' });
        }


        // Multer processed files are in req.files or req.file
        // If using upload.fields([{ name: 'cccd_front_image', maxCount: 1 }, { name: 'cccd_back_image', maxCount: 1 }])
        const cccdFrontImage = req.files['cccd_front_image'] ? req.files['cccd_front_image'][0] : null;
        const cccdBackImage = req.files['cccd_back_image'] ? req.files['cccd_back_image'][0] : null;

        // Upload images to Cloudinary
        const cccdFrontUrl = await uploadToCloudinary(cccdFrontImage);
        const cccdBackUrl = await uploadToCloudinary(cccdBackImage);


        // Update user document with form data, Cloudinary URLs, and set status
        user.name = req.body.name || user.name; // Update name if provided, keep old if not
        user.phone = req.body.phone || user.phone; // Update phone if provided
        user.cccd_number = req.body.cccd_number; // Assuming CCCD is required in form
        user.cccd_front_url = cccdFrontUrl;
        user.cccd_back_url = cccdBackUrl;

        // Set initial request status
        user.owner_request_status = 'pending';
        user.owner_request_submitted_at = new Date();
        user.owner_request_reviewed_by = null; // Reset review info
        user.owner_request_reviewed_at = null;
        user.owner_request_rejection_reason = null;


        await user.save();

        res.status(200).json({ success: true, message: 'Yêu cầu đăng ký chủ xe đã được gửi thành công, chờ duyệt.' });

    } catch (error) {
        console.error('Error in becomeOwner controller:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
    }
};

// --- Admin Endpoints (Example) ---

// Get all pending owner requests
exports.getPendingOwnerRequests = async (req, res) => {
    try {
        // Assuming admin check middleware is applied to this route
        // Only fetch users with pending owner requests and select relevant fields
        const pendingRequests = await User.find({ owner_request_status: 'pending' }).select('name email phone cccd_number cccd_front_url cccd_back_url owner_request_submitted_at');

        res.status(200).json({ success: true, data: pendingRequests });
    } catch (error) {
         console.error('Error in getPendingOwnerRequests:', error);
         res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// Review (Approve/Reject) an owner request
exports.reviewOwnerRequest = async (req, res) => {
    try {
        // Assuming admin check middleware is applied to this route
        const { userId } = req.params;
        const { status, rejectionReason } = req.body; // status should be 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Prevent reviewing already reviewed requests (optional, depends on flow)
        if (user.owner_request_status !== 'pending') {
             return res.status(400).json({ success: false, message: 'Yêu cầu này đã được xử lý.' });
        }

        user.owner_request_status = status;
        user.owner_request_reviewed_by = req.user._id; // Assuming admin user is in req.user
        user.owner_request_reviewed_at = new Date();
        user.owner_request_rejection_reason = status === 'rejected' ? rejectionReason : null;


        if (status === 'approved') {
            // Set identity verified for owner
            user.is_identity_verified_for_owner = true;
            // Add 'owner' role if not already present
            if (!user.role.includes('owner')) {
                user.role.push('owner');
            }
        } else if (status === 'rejected') {
             // Optionally reset verified status if rejected
            user.is_identity_verified_for_owner = false;
            // Optionally remove 'owner' role if it was somehow added before final approval (less likely with this flow)
            // user.role = user.role.filter(role => role !== 'owner');
        }

        await user.save();

        res.status(200).json({ success: true, message: `Yêu cầu đã được ${status === 'approved' ? 'chấp nhận' : 'từ chối'}.` });

    } catch (error) {
         console.error('Error in reviewOwnerRequest:', error);
         res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};