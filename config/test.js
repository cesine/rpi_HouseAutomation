module.exports = {
  disk: {
    eventLogPath: '/tmp/rpi_HouseAutomation_event.log',
    requestLogPath: '/tmp/rpi_HouseAutomation_app.log',
    tempImgPath: '/tmp',
    saveImgPath: './video',
  },
  hardware: {
    cpu: {
      temperature: {
        filepath: '/tmp/mock-temp',
      },
    },
  },
};
