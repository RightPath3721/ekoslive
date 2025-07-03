import axios from "axios";

export const ekosliveServer = axios.create({ baseURL: window.location.origin });

const EKOSLIVE_URL = process.env.EKOSLIVE_URL;
export default {
	EKOSLIVE_URL,
};
