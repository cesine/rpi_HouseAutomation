// To use debug: export DEBUG=core,schedule
const debug = require('debug')('core');
const express = require('express');
const path = require('path');
const EventEmitter = require('events');

// Local Dependency
const { scheduler } = require('./scheduler.js');
const { openBlindSequence, closeBlindSequence } = require('./blindActions');
const { resizeAndValidateImg } = require('./openCVManager.js');

const app = express();
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

// Handle the Blind Open/close flow
const openAt = 7;
const closeAt = 18;
let blindStatus;
myEmitter.on('openBlind', () => {
  debug('Will Open the blind Now');
  if (blindStatus !== 'open') {
    openBlindSequence();
    blindStatus = 'open';
  }
});

myEmitter.on('closeBlind', () => {
  debug('Will Close the blind Now');
  if (blindStatus !== 'closed') {
    closeBlindSequence();
    blindStatus = 'closed';
  }
});

scheduler(`* ${openAt} * * *`, myEmitter, 'openBlind');
scheduler(`* ${closeAt} * * *`, myEmitter, 'closeBlind');

// On movement
myEmitter.on('movement', async () => {
  // Capture a image. --> ffmpg??
  // Save a image on disk
  // Upload the image Online immediately (in case Of Break in I want all image, later we can filter them.)
  const imgPath = path.join(__dirname, '../sampleData/GreatDay.jpg');
  // Resize to appropriate level
  // Do img Validation on it
  resizeAndValidateImg(imgPath); // This will run on each image that get in in paralle.
});

// Handle the Image Capture flow On Mac (testing) and (Linux real).
// FFMPG ? Or ??

// Save img/Stream on disk

// Load static Img or Stream and pipe to OpenCV.
// Problem I suspect: Capture of large image will be too fast for the Pi to actually save and process in real time? -> Need to do load Test.

// Save the "best" frame that the face get detected in (for future email or processing) and drop the rest?

// Upload all img on the server / Dropbox / G.Drive / S3.

// Clean all file older than X day for space. (32G locally).

app.get('/', (req, res) => {
  res.json('Banana');
});

module.exports = app;
