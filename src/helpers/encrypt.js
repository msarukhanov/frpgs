const crypto = require('crypto');
const secret_key = 'abc', secret_iv = '123';
const key = crypto
    .createHash('sha512').update(secret_key).digest('hex').substring(0, 32);
const encryptionIV = crypto.createHash('sha512').update(secret_iv).digest('hex').substring(0, 16);

// Encrypt data
function encryptData(data) {
    const cipher = crypto.createCipheriv("aes-256-cbc", key, encryptionIV);
    return Buffer.from(
        cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
    ).toString('base64') // Encrypts data and converts to hex and base64
}

// Decrypt data
function decryptData(encryptedData) {
    const buff = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, encryptionIV);
    return (decipher.update(buff.toString('utf8'), 'hex', 'utf8') + decipher.final('utf8')) // Decrypts data and converts to utf8
}

// app.use(function (req, res, next) {
//     console.log(req.hostname);
//     console.log(res.hostname);
//     const originalSend = res.send;
//     res.send = function () {
//         arguments[0] = encryptData(arguments[0]);
//         originalSend.apply(res, arguments);
//     };
//     next();
//     // next();
// });