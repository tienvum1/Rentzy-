const User = require('../models/User');
const mongoose = require('mongoose'); // Import mongoose if needed in these controllers

// Get all pending owner requests
exports.getPendingOwnerRequests = async (req, res) => {
    try {
        // Assuming admin check middleware is applied to this route
        // Only fetch users with pending owner requests and select relevant fields
        const pendingRequests = await User.find({ owner_request_status: 'pending' }).select('name email phone cccd_number cccd_front_url cccd_back_url owner_request_submitted_at'); // Corrected select fields

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
