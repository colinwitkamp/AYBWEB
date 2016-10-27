/**
 * Created by colin on 10/26/16.
 */
import firebase from 'firebase';

export function checkFirebaseClient(req, res, next) {
  const idToken = req.headers.idtoken;
  console.info('Headers:', req.headers);
  firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
    req.uid = decodedToken.uid;
    console.info('decodedToken:', decodedToken);
    next();
    // ...
  }).catch(function(error) {
    // Handle error
    next(error)
  });
};
