/**
 * Created by colin on 10/26/16.
 */
import { Router } from 'express';
import * as VenueController from '../controllers/venue.controller';
const router = new Router();

router.route('/nearby').get(VenueController.getNearByVenues);
export default router;
