const expect = require('expect.js');
const path = require('path');

const { validateImageSize } = require('../src/openCVManager');

describe('Testing the Flow with OpenCV', function nameMe() {
  this.timeout(5000);
  it('test the image resize flow', (done) => {
    const currentImg = path.join(__dirname, '../sampleData/GreatDay.jpg');

    validateImageSize(currentImg).then((info) => {
      expect(info.width).to.be(1000);
      done();
    });
  });
});
