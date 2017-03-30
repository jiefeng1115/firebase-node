// You can run these unit tests by running "npm test" inside the uppercase/functions directory.

// Chai is a commonly used library for creating unit test suites. It is easily extended with plugins.
const chai = require('chai');
const assert = chai.assert;

// Chai As Promised extends Chai so that a test function can be asynchronous with promises instead
// of using callbacks. It is recommended when testing Cloud Functions for Firebase due to its heavy
// use of Promises.
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// Sinon is a library used for mocking or verifying function calls in JavaScript.
const sinon = require('sinon');


describe('Cloud Functions', () => {
  // [START stubConfig]
  var myFunctions, configStub, adminInitStub, functions, admin;

  before(() => {
    // Since index.js makes calls to functions.config and admin.initializeApp at the top of the file,
    // we need to stub both of these functions before requiring index.js. This is because the
    // functions will be executed as a part of the require process.
    // Here we stub admin.initializeApp to be a dummy function that doesn't do anything.
    admin =  require('firebase-admin');
    adminInitStub = sinon.stub(admin, 'initializeApp');
    // Next we stub functions.config(). Normally config values are loaded from Cloud Runtime Config;
    // here we'll just provide some fake values for firebase.databaseURL and firebase.storageBucket
    // so that an error is not thrown during admin.initializeApp's parameter check
    functions = require('firebase-functions');
    configStub = sinon.stub(functions, 'config').returns({
        firebase: {
          databaseURL: 'https://not-a-project.firebaseio.com',
          storageBucket: 'not-a-project.appspot.com',
        }
        // You can stub any other config values needed by your functions here, for example:
        // foo: 'bar'
      });
    // Now we can require index.js and save the exports inside a namespace called myFunctions.
    // This includes our cloud functions, which can now be accessed at myFunctions.makeUppercase
    // and myFunctions.addMessage
    myFunctions = require('../index');
  });

  after(() => {
    // Restoring our stubs to the original methods.
    configStub.restore();
    adminInitStub.restore();
  });
  // [END stubConfig]

  describe('onLocalSessionStarted', () => {
    // Test Case: 
    it('simply logging the event for now', () => {

      // [START fakeEvent]
      const fakeEvent = {
        // The DeltaSnapshot constructor is used by the Functions SDK to transform a raw event from
        // your database into an object with utility functions such as .val().
        // Its signature is: DeltaSnapshot(app: firebase.app.App, adminApp: firebase.app.App,
        // data: any, delta: any, path?: string);
        // We can pass null for the first 2 parameters. The data parameter represents the state of
        // the database item before the event, while the delta parameter represents the change that
        // occured to cause the event to fire. The last parameter is the database path, which we are
        // not making use of in this test. So we will omit it.
        data: new functions.database.DeltaSnapshot(null, null, null, '2017-03-28T19:15:26.387Z', 'projects/_/instances/peeq-b81e7/refs/localSessions/-KgLL16nyOS2YsgHe9fV/startDate'),
        // To mock a database delete event:
        // data: new functions.database.DeltaSnapshot(null, null, 'old_data', null)
      };
      // [END fakeEvent]

      // [START test]
      return assert.eventually.equal(myFunctions.onLocalSessionStarted(fakeEvent), null);
      // [END test]
    })
  });
})

/*
onLocalSessionStarted event { eventType: 'providers/google.firebase.database/eventTypes/ref.write',
  timestamp: '2017-03-28T19:15:26.507Z',
  auth: 
   { admin: false,
     variable: 
      { email_verified: false,
        provider: 'password',
        email: 'admin@peeqdata.com',
        user_id: 'W4FoiXe2KcYwu7swdxDR67NHFcj2',
        token: [Object],
        uid: 'W4FoiXe2KcYwu7swdxDR67NHFcj2' } },
  data: 
   DeltaSnapshot {
     app: 
      FirebaseApp {
        firebaseInternals_: [Object],
        services_: [Object],
        isDeleted_: false,
        name_: '0f8829bdb86959e14b2387192ead799011f32c68',
        options_: [Object],
        database: [Function: bound ],
        auth: [Function: bound ],
        messaging: [Function: bound ],
        INTERNAL: [Object] },
     adminApp: 
      FirebaseApp {
        firebaseInternals_: [Object],
        services_: [Object],
        isDeleted_: false,
        name_: '__admin__',
        options_: [Object],
        database: [Function: bound ],
        auth: [Function: bound ],
        messaging: [Function: bound ],
        INTERNAL: [Object] },
     _path: '/localSessions/-KgLL16nyOS2YsgHe9fV/startDate',
     _data: null,
     _delta: '2017-03-28T19:15:26.387Z',
     _newData: '2017-03-28T19:15:26.387Z' },
  params: { localSessionId: '-KgLL16nyOS2YsgHe9fV' },
  eventId: 'dlo3G6ZHscpZLhCPvi2IdI/XsOE=',
  resource: 'projects/_/instances/peeq-b81e7/refs/localSessions/-KgLL16nyOS2YsgHe9fV/startDate' }
*/

