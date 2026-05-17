const express = require("express");
const router = express.Router();
const {
  getSavedLocations,
  addSavedLocation,
  deleteSavedLocation,
  getDriversByDistrict,
} = require("../controllers/locationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getSavedLocations);
router.post("/", protect, addSavedLocation);
router.delete("/:id", protect, deleteSavedLocation);
router.get("/drivers-in-district/:districtId", getDriversByDistrict);

module.exports = router;
