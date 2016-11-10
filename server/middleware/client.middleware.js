/**
 * Created by colin on 10/26/16.
 */
import firebase from 'firebase';

export function checkFirebaseClient(req, res, next) {
  const idToken = req.headers.idtoken;
  console.info('Headers:', req.headers);

  const db = firebase.database();
  const userRef = db.ref('/Users');
  firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
    req.uid = decodedToken.uid;
    console.info('decodedToken:', decodedToken);
    
    const profileRef= userRef.child(req.uid);
    profileRef.once('value', snapshot => {
      const user = snapshot.val();
      if (user) {
        req.user = user;
        console.info('Current User:', JSON.stringify(user));
        next();
      } else {
        next('No Such User!');
      }
    }, errObj => {
      next(errObj);
    });
  }).catch(function(error) {
    // Handle error
    next(error)
  });
};
