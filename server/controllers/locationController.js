const pool = require("../config/db");

const getSavedLocations = async (req, res) => {
  try {
    const userId = req.user.id;
    const [locations] = await pool.query(
      "SELECT * FROM saved_locations WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
    res.status(200).json({ success: true, locations });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching locations",
      });
  }
};

const addSavedLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, name, address, lat, lng } = req.body;

    if (!type || !name || !address || !lat || !lng) {
      return res
        .status(400)
        .json({ success: false, message: "All location fields are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO saved_locations (user_id, type, name, address, lat, lng) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, type, name, address, lat, lng],
    );

    const [newLocation] = await pool.query(
      "SELECT * FROM saved_locations WHERE id = ?",
      [result.insertId],
    );

    res
      .status(201)
      .json({
        success: true,
        message: "Location saved successfully",
        location: newLocation[0],
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error while saving location" });
  }
};

const deleteSavedLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [location] = await pool.query(
      "SELECT * FROM saved_locations WHERE id = ? AND user_id = ?",
      [id, userId],
    );
    if (location.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Location not found or unauthorized",
        });
    }

    await pool.query("DELETE FROM saved_locations WHERE id = ?", [id]);

    res
      .status(200)
      .json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error while deleting location",
      });
  }
};

const DISTRICT_COORDINATES = {
  1: { name: "Srinagar", lat: 34.0837, lng: 74.7973 },
  2: { name: "Anantnag", lat: 33.7298, lng: 75.1467 },
  3: { name: "Ganderbal", lat: 34.3133, lng: 75.5667 },
  4: { name: "Badgam", lat: 34.2044, lng: 75.0044 },
  5: { name: "Pulwama", lat: 33.9244, lng: 75.3244 },
  6: { name: "Kulgam", lat: 33.6133, lng: 75.5333 },
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getDriversByDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;
    const district = DISTRICT_COORDINATES[districtId];

    if (!district) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid district ID" });
    }

    // Fetch approved and online drivers from the database
    const [drivers] = await pool.query(`
            SELECT 
                d.id,
                d.user_id,
                u.name,
                u.phone,
                u.avatar_url,
                d.area,
                d.current_lat,
                d.current_lng,
                d.rating,
                d.total_trips,
                v.type as vehicle_type,
                v.model as vehicle_model,
                v.number as vehicle_number
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN vehicles v ON v.driver_id = d.id
            WHERE d.status = 'approved' AND d.is_online = TRUE
            ORDER BY d.rating DESC
        `);

    // Filter drivers by distance from district center (within 50km radius)
    const driversWithDistance = drivers
      .filter((driver) => {
        if (!driver.current_lat || !driver.current_lng) return false;
        const distance = calculateDistance(
          district.lat,
          district.lng,
          driver.current_lat,
          driver.current_lng,
        );
        return distance <= 100; // Within 100km radius
      })
      .map((driver) => ({
        ...driver,
        distance: calculateDistance(
          district.lat,
          district.lng,
          driver.current_lat,
          driver.current_lng,
        ),
      }))
      .sort((a, b) => a.distance - b.distance); // Sort by distance ascending

    res.status(200).json({ success: true, drivers: driversWithDistance });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching drivers" });
  }
};

module.exports = {
  getSavedLocations,
  addSavedLocation,
  deleteSavedLocation,
  getDriversByDistrict,
};
