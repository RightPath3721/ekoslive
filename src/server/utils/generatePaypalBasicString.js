const { paypalClienSecret, paypalClientId } = require('../config');

const generateBasicAuthString = () =>
{
    return Buffer.from(
        paypalClientId + ':' + paypalClienSecret
    ).toString('base64');
};

module.exports = generateBasicAuthString