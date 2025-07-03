const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');

// Path to your directory containing XML files
const xmlDirPath = 'src/server/indidrivers';

// Create a new instance of the xml2js parser
const parser = new xml2js.Parser();

// Function to extract driver information from the parsed XML data
function extractDriverInfo(parsedData) {
    let indiDrivers = [];

    const driversList = parsedData.driversList;
    if (driversList && driversList.devGroup) {
        driversList.devGroup.forEach(devGroup => {
            const group = devGroup.$.group;

            if (devGroup.device) {
                devGroup.device.forEach(device => {
                    const manufacturer = device.$.manufacturer || "Others";
                    const label = device.$.label

                    if (device.driver) {
                        device.driver.forEach(driver => {
                            let indiDriver = {};
                            indiDriver.group = group;
                            indiDriver.manufacturer = manufacturer;
                            indiDriver.label = label;
                            indiDriver.name = driver.$.name;
                            indiDriver.text = driver._;
                            indiDrivers.push(indiDriver.label);
                        });
                    }
                });
            }
        });
    }

    return indiDrivers;
}
// Function to read and process each XML file
async function processXmlFile(filePath) {
    try {
        const data = await fs.readFile(filePath);
        const result = await parser.parseStringPromise(data);
        return extractDriverInfo(result);
    } catch (err) {
        console.error(`Failed to process XML file ${filePath}: ${err.message}`);
    }
}

// Function to get all INDI drivers
async function getAllIndiDrivers() {
    try {
        const files = await fs.readdir(xmlDirPath);
        const indiDrivers = [];

        for (const file of files) {
            const filePath = path.join(xmlDirPath, file);

            // Check if the file is an XML file and does not end with '_sk.xml'
            if (path.extname(file).toLowerCase() === '.xml' && !file.toLowerCase().endsWith('_sk.xml')) {
                const drivers = await processXmlFile(filePath);
                if (drivers) {
                    indiDrivers.push(...drivers);
                }
            }
        }


        return indiDrivers;
    } catch (err) {
        console.error(`Failed to read directory: ${err.message}`);
    }
}

module.exports = { getAllIndiDrivers };