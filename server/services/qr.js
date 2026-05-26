const { v4: uuidv4 } = require('uuid');
const generateQR = () => uuidv4();
module.exports = { generateQR };
