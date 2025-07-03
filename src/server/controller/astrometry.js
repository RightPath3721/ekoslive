const logger = require('../logger');
const axios = require('axios');
const config = require('../config');
const { readFile } = require('fs/promises');

class AstrometryController
{
    api_key = config.astrometryKey;
    session_key;
    URL = 'http://nova.astrometry.net/api';

    async login()
    {
        try
        {
            const jsonObject = {
                apikey: this.api_key,
            };

            const formData = new FormData();
            formData.append('request-json', JSON.stringify(jsonObject));
            const { data } = await axios.post(`${this.URL}/login`, formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            this.session_key = data.session;
            return this.session_key;
        } catch (error)
        {
            logger.error("Astrometry API login error", error, { 
                apiUrl: `${this.URL}/login` 
            });
            throw new Error(error);
        }
    }

    async uploadImage(file, username)
    {
        try
        {
            const jsonObject = {
                session: this.session_key,
                publicly_visible: "y",
                allow_modifications: "d",
                allow_commercial_use: "d",
            };

            const formData = new FormData();
            formData.append('request-json', JSON.stringify(jsonObject));
            const fileFromFs = await readFile(file.path);
            formData.append('file', new File([fileFromFs], username));
            const { data } = await axios.post(`${this.URL}/upload`, formData);

            await this.getSubmitStatus(data.subid);

            const objectInfo = await this.getObjectsInfo(data.subid);

            return objectInfo;
        } catch (error)
        {
            logger.error("Error uploading image to astrometry", error, { 
                username,
                apiUrl: `${this.URL}/upload`,
                filePath: file.path 
            });
            throw new Error(error);
        }
    }

    async getSubmitStatus(id)
    {
        return new Promise((resolve, reject) =>
        {
            const intervalId = setInterval(async () =>
            {
                try
                {
                    const { data } = await axios.get(`${this.URL}/submissions/${id}`);
                    if (data.processing_finished === "None") return;

                    clearInterval(intervalId);
                    resolve();
                } catch (error)
                {
                    clearInterval(intervalId);
                    logger.error("Error getting submission status", error, { 
                        submissionId: id,
                        apiUrl: `${this.URL}/submissions/${id}` 
                    });
                    reject(error);
                }
            }, 1500);
        });
    }

    async getObjectsInfo(id)
    {
        const { data } = await axios.get(`${this.URL}/jobs/${id}/info`);
        return data;
    }
}

module.exports = new AstrometryController();