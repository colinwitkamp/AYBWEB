import braintree from 'braintree';
import path from 'path';
const config = {
  mongoURL: process.env.MONGO_URL || 'mongodb://localhost:27017/mern-starter',
  port: process.env.PORT || 8000,
  checkFrontURL: process.env.CHECKFRONT_URL || 'https://areyouboredco.checkfront.com',//'https://wagnercity.checkfront.com',
  API_URL: process.env.API_URL || '/api/3.0',
  API_KEY: process.env.API_KEY || '14025b298c74c072d8290c5ff4ece38d805b1aae',//'9b4a460a8f832aa89024eec165ac00af4a8e23e6',
  API_SECRET: process.env.API_SECRET || '849a096f5c044a16de601d0ffe2c0d61d27bfbec2a79d887bda18d216b2c5dc8',//'770dc9eec800a6619da72bd9d24293d042a377fee309d14bfee53cbbefe9c99f',
  Braintree: {
  	merchantId: 'dvttk77vrgmcvpwr',
	publicKey: '6rb3t2xpfjjhmgj8',
	privateKey: '407ce2e538552d57a01bb810b84ce365'
  },
  Firebase: {
  	databaseURL: 'https://areyoubored-af965.firebaseio.com',
  	serviceAccount: path.resolve('./server/serviceAccountCredentials.json')
  }
};



if (process.env.NODE_ENV === 'production') {
  config.Braintree.environment = braintree.Environment.Production;
} else {
  config.Braintree.environment = braintree.Environment.Sandbox;
}

config.sampleVenue = {
    "CategoryID": "3",
    "Name": "Romantic Dinner",
    "Description": "Welcome to Romantic Dinner! Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
    "Location": {
        "lat": 52.3702,
        "lng": 4.8952
        },
    "Email": "a@test.com",
    "Rating": 4,
    "Website": "https://google.com",
    "Address": "Amsterdam",
    "City": "City",
    "Province": "Province",
    "Country": "Netherlands",
    "Phone": "1111",
    "Cost": 18,
    "MainPicture":"https://s16.postimg.org/9zsqjsqqd/Services.jpg",
    "Pictures": {
        "0": "https://s14.postimg.org/5banmgqi9/images_1.jpg",
        "1": "https://s21.postimg.org/sj18e532f/imgres_2.jpg",
        "2": "https://s22.postimg.org/3ultzlfsx/imgres_1.jpg"
    },
    "Status": true,
    "DateAdded": new Date(),
    "LastModified": new Date(),
    "OpenTime":{
        "From": 9,
        "To": 21,
        "Day": "Monday"
    },
    "Reviews": {
        "review1": {
            "Name": "Maria Doe",
            "Rating": 4.5,
            "Description": "Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
            "Picture": "https://s17.postimg.org/hl2sghhlb/images.jpg",
            "UserID": "User1"
        },
        "review2": {
            "Name": "David Silva",
            "Rating": 3.5,
            "Description": "Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
            "Picture": "https://s4.postimg.org/iqdteqwjx/imgres.jpg",
            "UserID": "User1"
        },
        "review3": {
            "Name": "Service Provider",
            "Rating": 5,
            "Description": "Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu",
            "Picture": "https://s16.postimg.org/9zsqjsqqd/Services.jpg",
            "UserID": "User1"
        }
    },
    "Tags": {
        "Tag1": true,
        "Tag2": true
    },
    "Categories": {
        "Cat1": true,
        "Cat2": true
    }
};

export default config;
