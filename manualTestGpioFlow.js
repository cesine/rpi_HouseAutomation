const { openBlindSequence, closeBlindSequence } = require('./src/blindActions');
const { listenOnPinChange } = require('./src/gpioActions');
const { openLight } = require('./src/lightAction');
const config = require('config');

const openBlindX = (motorIndex) => {
  openBlindSequence(config.blindMotorControl[motorIndex]);
};

const closeBlindX = (motorIndex) => {
  closeBlindSequence(config.blindMotorControl[motorIndex]);
};

const pinEventEmitter = () => {
  listenOnPinChange();
};

pinEventEmitter();
// openBlindX(1);
openLight();

module.exports.openBlindX = openBlindX;
module.exports.closeBlindX = closeBlindX;
module.exports.openLight = openLight;
