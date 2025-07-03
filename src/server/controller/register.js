const RegisterModel = require('../models/register');

// TO record licenses offline users registeration activity
class registerController {

    log(registerInfo)
    {
        let newRegisteration = new RegisterModel(
            {
                username: registerInfo.username,
                serial: registerInfo.serial,
                license: registerInfo.license,
                ip: registerInfo.ip,
            }
        );

        return new Promise(function (resolve, reject) {
            newRegisteration
                .save( (err) => {
                    if (err)
                        reject(err);
                    resolve();
                });
        });
    }
}

module.exports = new registerController();
