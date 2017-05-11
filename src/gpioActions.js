// NOTE: use the -i instead of -g to use the physical pin instead of GPIO. see drogon.net/

const debug = require('debug')('gpio');
const { exec, execSync } = require('child_process');

const config = require('../config.json');
const { addErrorCode } = require('./sqlightHandler');

const mode = process.env.mode;
let movementDetected = 0;
let movementFront = 0;

const loadtimeSetup = (nbr, inOut) => {
  if (mode !== 'production') { return; } // Not on the Pi.
  try {
    execSync(`gpio export ${nbr} ${inOut}`);
    if (inOut === 'out') { execSync(`gpio -g write ${nbr} 0`); } // Initialise everything at 0. So there is no unknown state.
  } catch (e) {
    addErrorCode('WriteError', JSON.stringify({ nbr }), 'WARNING');
  }
};

// Some pins need to be setup at load time for Out and In and the default value.
function init() {
  loadtimeSetup(config.doorMovementDetectionPin, 'in');
  loadtimeSetup(config.frontMovementDetectionPin, 'in');
  loadtimeSetup(config.aliveLight, 'out');
  loadtimeSetup(config.lightOpenSSR, 'out');
  loadtimeSetup(config.processorFanPin, 'out');
  for (let i = 0; i < config.blindMotorControl.length; i++) {
    const blind = config.blindMotorControl[i];
    loadtimeSetup(blind.motorOpen, 'out');
    loadtimeSetup(blind.motorClose, 'out');
    loadtimeSetup(blind.openLimitSwitch, 'in');
    loadtimeSetup(blind.closeLimitSwitch, 'in');
  }
}
init();

const read1Pin = (nbr) => {
  if (mode !== 'production') { return Promise.resolve(0); } // Not on the Pi.
  debug(`Read Pin ${nbr}`);
  return new Promise((resolve, reject) => {
    exec(`gpio -g read ${nbr}`, (error, stdout, stderr) => {
      if (error || stderr) {
        addErrorCode('ReadError', JSON.stringify({ nbr }), 'WARNING');
        return reject();
      }
      return resolve(parseInt(stdout, 10));
    });
  });
};

const write1Pin = (nbr, value) => {
  if (mode !== 'production') { return Promise.resolve(0); } // Not on the Pi.
  debug(`Write Pin ${nbr} at ${value}`);
  return new Promise((resolve, reject) => {
    exec(`gpio -g write ${nbr} ${value}`, (error, stdout, stderr) => {
      if (error || stderr) {
        addErrorCode('WriteError', JSON.stringify({ nbr, value }), 'WARNING');
        return reject();
      }
      return resolve(stdout);
    });
  });
};

const validateMotorActions = (obj) => {
  // {"motorOpen":3, "motorClose":3, "openLimitSwitch": 5, "closeLimitSwitch": 5}
  read1Pin(obj.openLimitSwitch)
  .then((value) => {
    if (value === 1) {
      debug('Limit reached, Stop motor');
      write1Pin(obj.motorOpen, 0);
    } // Stop Motor
  })
  .then(() => read1Pin(obj.openLimitSwitch))
  .then((value) => {
    if (value === 1) {
      debug('Limit reached, Stop motor');
      write1Pin(obj.motorClose, 0);
    } // stop motor
  });
};

const monitorFront = (event) => {
  // currently it does nothing.
  setInterval(() => {
    read1Pin(config.doorMovementDetectionPin)
    .then((value) => {
      if (value === 1) {
        if (movementFront < Date.now()) { // Buffer so we dont call every second, and so the lignt Off dosent trigger the sensor.
          movementFront = Date.now() + config.lightOpen_ms;
          event.emit('movementFront');
        }
      }
    });
  }, 200);
};
monitorFront();

const monitorDoor = (event) => {
  // TODO: Should be in a Event Detector instead but I cannot make pi-gpio or rpi-gpio work.
  setInterval(() => {
    read1Pin(config.doorMovementDetectionPin)
    .then((value) => {
      // adding the front movement detection will block the false alarm (cheep sensor) since the person Absolutely Need to pass on the front door first.
      if (value === 1 && movementFront > Date.now()) {
        // Opent he light / Start Camera flow
        debug('Door Movement detected');
        if (movementDetected < Date.now() + 2000) { // Buffer so we dont call every second, and so the lignt Off dosent trigger the sensor.
          movementDetected = Date.now() + config.lightOpen_ms;
          event.emit('movement');
        }
      }
    });
  }, 200);
};

const monitorMotorsPins = () => {
  setInterval(() => {
    for (let i = 0; i < config.blindMotorControl.length; i++) {
      validateMotorActions(config.blindMotorControl[i]); // TODO Improve this to not write every time but work with a Event Listener.
    }
  }, 1000);
};

const startProcessorFan = () => {
  // This could be a move to the app section, but in case we have a more complex Start-Stop fan setup we have the flexibility.
  write1Pin(config.processorFanPin, 1);
};

const stopProcessorFan = () => {
  write1Pin(config.processorFanPin, 0);
};

// TODO: Put motor on a Promise.All with a timeout that close everything.
// Movement detector should be monitored better.

module.exports.read1Pin = read1Pin;
module.exports.write1Pin = write1Pin;
module.exports.monitorDoor = monitorDoor;
module.exports.monitorMotorsPins = monitorMotorsPins;
module.exports.startProcessorFan = startProcessorFan;
module.exports.stopProcessorFan = stopProcessorFan;
