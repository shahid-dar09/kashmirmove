#!/usr/bin/env node

// Quick setup script to add test drivers with GPS coordinates for BookRide testing
const mysql = require("mysql2/promise");

const testDrivers = [
  {
    user_id: 2,
    status: "approved",
    is_online: true,
    is_verified: true,
    area: "Srinagar",
    current_lat: 34.085,
    current_lng: 74.796,
    rating: 4.8,
    total_trips: 150,
    name: "Ahmed Khan",
    phone: "9876543210",
    vehicle_type: "rickshaw",
  },
  {
    user_id: 3,
    status: "approved",
    is_online: true,
    is_verified: true,
    area: "Srinagar",
    current_lat: 34.09,
    current_lng: 74.8,
    rating: 4.9,
    total_trips: 200,
    name: "Farooq Ali",
    phone: "9876543211",
    vehicle_type: "cab",
  },
  {
    user_id: 4,
    status: "approved",
    is_online: true,
    is_verified: true,
    area: "Srinagar",
    current_lat: 34.082,
    current_lng: 74.79,
    rating: 4.7,
    total_trips: 120,
    name: "Ghulam Nabi",
    phone: "9876543212",
    vehicle_type: "truck",
  },
];

async function setupTestDrivers() {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "kashmirmove",
    });

    console.log("✅ Connected to database");

    // Check if users exist, if not create them
    for (let i = 0; i < testDrivers.length; i++) {
      const driver = testDrivers[i];

      // Check if user exists
      const [users] = await connection.query(
        "SELECT id FROM users WHERE id = ?",
        [driver.user_id],
      );

      if (users.length === 0) {
        // Create user
        await connection.query(
          "INSERT INTO users (id, name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            driver.user_id,
            driver.name,
            `driver${driver.user_id}@test.com`,
            driver.phone,
            "hashed_password",
            "driver",
            "active",
          ],
        );
        console.log(`✅ Created user: ${driver.name}`);
      }

      // Check if driver exists
      const [drivers] = await connection.query(
        "SELECT id FROM drivers WHERE user_id = ?",
        [driver.user_id],
      );

      if (drivers.length === 0) {
        // Create driver
        await connection.query(
          "INSERT INTO drivers (user_id, status, is_online, is_verified, area, current_lat, current_lng, rating, total_trips) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            driver.user_id,
            driver.status,
            driver.is_online,
            driver.is_verified,
            driver.area,
            driver.current_lat,
            driver.current_lng,
            driver.rating,
            driver.total_trips,
          ],
        );
        console.log(
          `✅ Created driver: ${driver.name} (Lat: ${driver.current_lat}, Lng: ${driver.current_lng})`,
        );
      } else {
        // Update driver location
        await connection.query(
          "UPDATE drivers SET current_lat = ?, current_lng = ?, is_online = ?, rating = ? WHERE user_id = ?",
          [
            driver.current_lat,
            driver.current_lng,
            driver.is_online,
            driver.rating,
            driver.user_id,
          ],
        );
        console.log(
          `✅ Updated driver: ${driver.name} (Lat: ${driver.current_lat}, Lng: ${driver.current_lng})`,
        );
      }

      // Check if vehicle exists
      const [vehicles] = await connection.query(
        "SELECT id FROM vehicles WHERE driver_id = (SELECT id FROM drivers WHERE user_id = ?)",
        [driver.user_id],
      );

      if (vehicles.length === 0) {
        // Get driver_id
        const [driverData] = await connection.query(
          "SELECT id FROM drivers WHERE user_id = ?",
          [driver.user_id],
        );
        const driverId = driverData[0].id;

        // Create vehicle
        await connection.query(
          "INSERT INTO vehicles (driver_id, type, number, model, capacity) VALUES (?, ?, ?, ?, ?)",
          [
            driverId,
            driver.vehicle_type,
            `KA01AB${1000 + driverId}`,
            `Vehicle ${driverId}`,
            "4 Seats",
          ],
        );
        console.log(`✅ Created vehicle for: ${driver.name}`);
      }
    }

    await connection.end();
    console.log("\n✅ All test drivers setup successfully!");
    console.log(
      "\nTest drivers created near Srinagar (within 2km of city center):",
    );
    testDrivers.forEach((d) => {
      console.log(`  • ${d.name} - ${d.vehicle_type} - Rating: ⭐${d.rating}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

setupTestDrivers();
