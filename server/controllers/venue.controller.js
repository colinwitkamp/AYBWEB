/**
 * Created by colin on 10/26/16.
 */
import serverConfig from '../config';
import HttpStatus from 'http-status-codes';
import axios from 'axios';
import geolib from 'geolib';
export function getNearByVenues(req, res, next) {
  console.info('Nearby Venues!');
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat)) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      Error: 'Invalid "lat"!'
    });
  }

  if (isNaN(lng)) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      Error: 'Invalid "lng"!'
    });
  }

  axios.get(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/item`, {
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    console.info('CheckFront Items:', resp.data);
    const respVenues = resp.data;
    if(!respVenues) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        Error: 'Unable to get the menu'
      })
    }

    // Parse meta of items - meta contains info about the locations
    const aryItems = [];
    const items = respVenues.items;
    for (let index in items) {
      const item = items[index];
      item.meta = JSON.parse(item.meta);
      if (item.meta) {
        const location = item.meta.location;
        if (location) {
          const venue_lat = location.lat;
          const venue_lng = location.lng;
          if (!(isNaN(venue_lat) || isNaN(venue_lng))) { // lat and lng are valid

            item.distance = geolib.getDistance({
              latitude: lat,
              longitude: lng
            }, {
              latitude: venue_lat,
              longitude: venue_lng
            });
          }
        } else {
          item.distance = 40000000 + index; //
        }
      }
      
      aryItems.push(item);
    }

    aryItems.sort((A, B) => {
      return A.distance < B.distance;
    });
    res.json(aryItems);
  })
    .catch(err => {
      next(err);
    });
}
