const express = require("express");
const { getSuggestCarBaseOnUserNeed, checkRudeWords } = require("../controller/chatBoxController");
const router = express.Router();
const Vehicle = require("../models/Vehicle");

router.post("/suggestCar", getSuggestCarBaseOnUserNeed);

// route to check if add filter history contains rude words : 
router.get('/checkRudeWords', checkRudeWords );

// Route to get suggested cars based on user filter history
router.post('/suggestedCar-base-on-filter-history', async (req, res) => {
    try {
        const { filterHistories } = req.body;

        if (!filterHistories || !Array.isArray(filterHistories) || filterHistories.length === 0) {
            return res.status(400).json({ error: "filterHistories must be a non-empty array" });
        }

        // Prepare a MongoDB $or query from filterHistories
        const orConditions = filterHistories.map(filter => {
            const query = { approvalStatus: 'approved', status: 'available' };
            if (filter.brand) query.brand = filter.brand;
            if (filter.location) query.location = filter.location;
            if (filter.pricePerDay) query.pricePerDay = filter.pricePerDay;
            if (filter.seatCount) query.seatCount = filter.seatCount;
            if (filter.fuelType) query.fuelType = filter.fuelType;
            return query;
        });

        const suggestedVehicles = await Vehicle.find(
            { $or: orConditions }
        ).lean();

        return res.status(200).json(suggestedVehicles);
    } catch (error) {
        console.error("Error in getting suggested cars:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;
