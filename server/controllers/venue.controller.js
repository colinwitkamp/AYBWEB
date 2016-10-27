/**
 * Created by colin on 10/26/16.
 */
import serverConfig from '../config';
import HttpStatus from 'http-status-codes';
import axios from 'axios';
export function getNearByVenues(req, res, next) {
  console.info('Nearby Venues!');
  axios.get(`${serverConfig.checkFrontURL}/item`, {
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
    const items = resp.items;
    for (let index in items) {
      const item = items;
      item.meta = JSON.parse(item.meta);
      aryItems.push(item);
    }
    res.json(aryItems);
  })
    .catch(err => {
      next(err);
    });
}
