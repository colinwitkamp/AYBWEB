/**
 * Created by colin on 10/26/16.
 */
import serverConfig from '../config';
import HttpStatus from 'http-status-codes';
import axios from 'axios';
import geolib from 'geolib';
import braintree from 'braintree';
import GeoFire from 'geofire';


const BraintreeGateway = braintree.connect(serverConfig.Braintree);

export function getClientToken(req, res, next) {
  BraintreeGateway.clientToken.generate({}, function (err, response) {
    if (err) {
      next('Invalid Token!');
    } else {
      res.json({
        status: HttpStatus.OK,
        data: response.clientToken
      });
    }
  });
}

export function markBookingAsPaid(req, res, next) {
  if (!req.booking) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      status: HttpStatus.BAD_REQUEST,
      error: 'No Booking in marking booking as paid!'
    });
  }

  const booking_id = req.booking.id;
  console.info('Mark as paid:', booking_id);

  axios.post(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/booking/${booking_id}/update`, {
    status_id: 'PAID'
  } ,{
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    const resp_data = resp.data;
    if (resp_data.request) {
      if (resp_data.request.status === 'OK') {
        const data = resp_data.request.data;
        if (!data) {
          res.json({
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid Update Result!'
          });  
        } else {
          if (data.status_id === 'PAID') {
            res.json({
              status: HttpStatus.OK,
              data: data
            });
          } else {
            res.json({
              status: HttpStatus.BAD_REQUEST,
              error: 'Invalid Paid Result!'
            });
          }
        }
      } else {
        res.json({
          status: HttpStatus.BAD_REQUEST,
          error: resp_data.request.error
        });
      }
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        error: resp.data,
        status: HttpStatus.INTERNAL_SERVER_ERROR
      });
    }
  })
  .catch((err, result) =>{
    next(err);
  });
}

export function processPayment(req, res, next) {
  if (!req.booking) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      status: HttpStatus.BAD_REQUEST,
      error: 'No Booking in processing payment!'
    });
  }
  const booking = req.booking;
  console.info('processPayment:', booking.id);

  if (booking.status_id !== 'PEND') {
    return res.status(HttpStatus.BAD_REQUEST).json({
      status: HttpStatus.BAD_REQUEST,
      error: `Booking status_id is not PEND, current status_id: ${booking.status_id}`
    });
  }
  const totalPrice = booking.total;

  if (isNaN(parseFloat(totalPrice))) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      status: HttpStatus.BAD_REQUEST,
      error: 'Price is not a valid number'
    });
  }

  BraintreeGateway.transaction.sale({
    amount: totalPrice,
    paymentMethodNonce: req.nonceFromTheClient,
    options: {
      submitForSettlement: true
    }
  }, (err, result) => {
    if (err) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: HttpStatus.BAD_REQUEST,
        error: err
      });
    } else {
      markBookingAsPaid(req, res, next);
    }
  });
}
// payBooking: -> processPayment -> markBookingAsPaid

export function payBooking(req, res, next) {
  const nonceFromTheClient = req.body.nonce;
  const booking_id = req.body.booking_id;
  req.booking_id = booking_id;

  // Get Booking
  axios.get(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/booking/${booking_id}`, {
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    const resp_data = resp.data;
    if (resp_data.request) {
      if (resp_data.request.status === 'OK') {
        const booking = resp_data.booking;
        if (booking) {
          req.booking = booking;
          req.nonceFromTheClient = nonceFromTheClient;
          processPayment(req, res, next);
        } else {
          res.status(HttpStatus.BAD_REQUEST).json({
            status: HttpStatus.BAD_REQUEST,
            error: 'No Booking Returned!'
          });  
        }
      } else {
        res.json({
          status: HttpStatus.BAD_REQUEST,
          error: resp_data.request.error
        });
      }
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        error: resp.data,
        status: HttpStatus.INTERNAL_SERVER_ERROR
      });
    }
  }).catch(err => next(err));
}

export function getNearByVenues(req, res, next) {
  const venueRef = serverConfig.ref.child('SampleVenues');
  venueRef.once('value', (snapshot) => {
    const venueDic = snapshot.val();
    res.json({
      status: HttpStatus.OK,
      data: venueDic
    });
  }, (err) => {
    next(err);
  })
}

// Deprecated
export function getNearByVenuesDeprecated(req, res, next) {
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

export function getActivitiesForVenue(req, res, next) {
  const category_id = req.query.category_id;
  if (category_id === undefined) {
    res.status(HttpStatus.BAD_REQUEST).send({
      status: HttpStatus.BAD_REQUEST,
      error: 'Missing "category_id"!'
    });
    return;
  }

  axios.get(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/item?category_id=${category_id}`, {
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    const resp_data = resp.data;
    if (resp_data.request) {
      if (resp_data.request.status === 'OK') {
        const items = resp_data.items;
        const aryItems = [];
        for (let index in items) {
          aryItems.push(items[index]);
        }
        res.json({
          status: HttpStatus.OK,
          activities: aryItems
        });
      } else {
        res.json({
          status: HttpStatus.BAD_REQUEST,
          error: resp_data.request.error
        });
      }
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        error: resp.data,
        status: HttpStatus.INTERNAL_SERVER_ERROR
      });
    }
    //res.json(resp.data);
  })
  .catch(err => {
    next(err);
  })
}

export function getAvailableDates(req, res, next) {
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;
  const item_id = req.query.item_id;

  axios.get(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/item/${item_id}/cal?start_date=${start_date}&end_date=${end_date}`, {
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    const resp_data = resp.data;
    if (resp_data.request) {
      if (resp_data.request.status === 'OK') {
        const item = resp_data.item;
        if (item.cal) {
          res.json({
            status: HttpStatus.OK,
            cal: item.cal
          });
        } else {
          res.json({
            status: HttpStatus.OK,
            cal: {}
          });
        }
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: HttpStatus.BAD_REQUEST,
          error: resp_data.request.error
        });
      }
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: HttpStatus.BAD_REQUEST,
        error: resp_data.request.error
      });
    }
    
  }).catch(err => {
    next(err);
  });
}

export function getTimeslots(req, res, next) {
  const item_id = req.query.item_id;
  const date = req.query.date;

  axios.get(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/item/${item_id}/?date=${date}`, {
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    const resp_data = resp.data;
    if (resp_data.request) {
      if (resp_data.request.status === 'OK') {
        const item = resp_data.item;
        if (item.rate) {
          res.json({
            status: HttpStatus.OK,
            rate: item.rate
          });
        } else {
          res.json({
            status: HttpStatus.OK,
            rate: {}
          });
        }
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: HttpStatus.BAD_REQUEST,
          error: resp_data.request.error
        });
      }
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: HttpStatus.BAD_REQUEST,
        error: resp_data.request.error
      });
    }
  }).catch(err => {
    next(err);
  });
}
// req.session_id : Session ID
function makeBooking(req, res, next) {
  const session_id = req.session_id;
  const form = req.user;
  if (!session_id) {
    return next('Invalid session_id!');
  }

  const bookingObj = {
    form,
    session_id
  };

  console.info('Booking Object', bookingObj);

  axios.post(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/booking/create`, bookingObj, {
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    const resp_data = resp.data;
    if (resp_data.request) {
      if (resp_data.request.status === 'OK') {
        res.json({
          status: HttpStatus.OK,
          data: resp_data.booking
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: HttpStatus.BAD_REQUEST,
          error: resp_data.request.error
        });
      }
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: HttpStatus.BAD_REQUEST,
        error: resp_data.request.error
      });
    }
  }).catch(err => {
    next(err);
  })
}

// req.slip : slip for the current item
function makeSessionForBooking(req, res, next) {
  const slip = req.slip;
  console.info('slip', slip);
  // Create A New Session
  axios.post(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/booking/session`, {
    slip
  }, {
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    const resp_data = resp.data;
    console.info('Session Result:', resp_data);
    if (!resp_data) {
      return next('Invalid Session!');
    }

    const request = resp_data.request;
    if (!request) {
      return next('Invalid Session!');
    }

    if (request.status !== 'OK') {
      return next(request.error);
    }

    const booking = resp_data.booking;

    if (!booking) {
      return next('Invalid Booking!');
    }

    const session = booking.session;

    if (!session) {
      return next('Invalid Session of Booking!');
    }

    const id = session.id;
    if (!id) {
      return next('Invalid ID of Session!');
    }

    req.session_id = id;
    makeBooking(req, res, next);
  }).catch(err => {
    next(err);
  })
}
// bookItem: -> makeSessionForBooking -> makeBooking
export function bookItem(req, res, next) {
  const item_id = req.body.item_id;
  const date = req.body.date;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;
  const available = req.body.available;
  console.info('Item query:', `${item_id}/?date=${date}&start_time=${start_time}&end_time=${end_time}&param[qty]={available}`);
  axios.get(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/item/${item_id}/?date=${date}&start_time=${start_time}&end_time=${end_time}&param[qty]={available}`, {
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    const resp_data = resp.data;
    console.info('Query Result:', resp_data);
    if (resp_data.request) {
      if (resp_data.request.status === 'OK') {
        const item = resp_data.item;
        if (item.rate) {
          if (item.rate.status === 'AVAILABLE') {
            req.slip = item.rate.slip;
            makeSessionForBooking(req, res, next);  
          } else {
            res.status(HttpStatus.BAD_REQUEST).json({
              status: HttpStatus.BAD_REQUEST,
              error:'Sold Out!'
            });   
          }        
        } else {
          res.status(HttpStatus.BAD_REQUEST).json({
            status: HttpStatus.BAD_REQUEST,
            error:'No Item Available'
          });
        }
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: HttpStatus.BAD_REQUEST,
          error: resp_data.request.error
        });
      }
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: HttpStatus.BAD_REQUEST,
        error: resp_data.request.error
      });
    }

  }).catch(err => {
    next(err);
  });
}

export function queryItem(req, res, next) {
  const item_id = req.body.item_id;
  const date = req.body.date;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;
  const available = req.body.available;
  console.info('Item query:', `${item_id}/?date=${date}&start_time=${start_time}&end_time=${end_time}&param[qty]={available}`);
  axios.get(`${serverConfig.checkFrontURL}/${serverConfig.API_URL}/item/${item_id}/?date=${date}&start_time=${start_time}&end_time=${end_time}&param[qty]={available}`, {
    headers: {
      Authorization: serverConfig.Authorization
    }
  }).then(resp => {
    const resp_data = resp.data;
    console.info('Query Result:', resp_data);
    if (resp_data.request) {
      if (resp_data.request.status === 'OK') {
        const item = resp_data.item;
        if (item) {
          res.json({
            status: HttpStatus.OK,
            data: item
          }); 
        } else {
          res.status(HttpStatus.BAD_REQUEST).json({
            status: HttpStatus.BAD_REQUEST,
            error:'No Item Available'
          });
        }
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: HttpStatus.BAD_REQUEST,
          error: resp_data.request.error
        });
      }
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: HttpStatus.BAD_REQUEST,
        error: resp_data.request.error
      });
    }
  }).catch(err => {
    next(err);
  });
}

export function writeSampleVenues() {
  const venueRef = serverConfig.ref.child('SampleVenues');
  const geofire = new GeoFire(serverConfig.ref.child('SampleVenues'));
  const dicVenues = {};
  for(let i = 0; i < 10; i ++) {
    dicVenues['Venue:' + i] = serverConfig.sampleVenue;
  }
  venueRef.set(dicVenues);
};

