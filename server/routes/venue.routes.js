/**
 * Created by colin on 10/26/16.
 */
import { Router } from 'express';
import * as VenueController from '../controllers/venue.controller';
const router = new Router();

router.route('/nearby').get(VenueController.getNearByVenues);
router.route('/activities').get(VenueController.getActivitiesForVenue);
router.route('/dates').get(VenueController.getAvailableDates);
router.route('/time').get(VenueController.getTimeslots);
router.route('/booking').post(VenueController.bookItem);
router.route('/clientToken').get(VenueController.getClientToken);
router.route('/pay').post(VenueController.payBooking);
router.route('/query').post(VenueController.queryItem);

export default router;
