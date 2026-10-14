import express from 'express';
import {
  getSavedLocations,
  addSavedLocation,
  deleteSavedLocation,
  getDriversByDistrict,
} from '../controllers/locationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getSavedLocations);
router.post('/', protect, addSavedLocation);
router.delete('/:id', protect, deleteSavedLocation);
router.get('/drivers-in-district/:districtId', getDriversByDistrict);

export default router;
