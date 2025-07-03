const DriverModel = require('../models/driver');

class driverController
{
    add(driver)
    {
        let newDriver = new DriverModel(driver);
        return new Promise(function (resolve, reject) {
            newDriver
                .save((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve("Driver sync successful");
                });
        });
    }
}

module.exports = new driverController();
