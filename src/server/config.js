const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../../.env") });

module.exports = {
	secret: process.env.secret,
	database: process.env.database,
	token: process.env.token,
	server: process.env.server,
	cipher: process.env.cipher,
	s3AccessKey: process.env.s3AccessKey,
	s3SecretKey: process.env.s3SecretKey,
	s3Instance: process.env.s3Instance,
	openAIKey: process.env.OPENAI_KEY,
	openAIModel: process.env.OPENAI_MODEL,
	astrometryKey: process.env.ASTOMETRY_API_KEY,
	joomlaApiKey: process.env.JOOMLA_API_KEY,
	assistantId: process.env.ASSISTANT_ID,
	paypalClientId: process.env.PAYPAL_CLIENT_ID,
	paypalClienSecret: process.env.PAYPAL_CLIENT_SECRET,
	paypalBaseURL: process.env.PAYPAL_BASE_URL,
	paypalRedirectURL: process.env.PAYPAL_REDIRECT_URL,
	ekoslive_non: process.env.EKOSLIVE_NON,
	stellarmateWebsiteUrl: process.env.STELLARMATE_WEBSITE_URL,
	recaptcha_secret_key: process.env.RECAPTCHA_SECRET_KEY,
	cleantalk_api_key: process.env.CLEANTALK_API_KEY,
	smtp_host: process.env.SMTP_HOST,
	smtp_port: process.env.SMTP_PORT,
	smtp_user: process.env.SMTP_USER,
	smtp_pass: process.env.SMTP_PASS,
	smtp_from_name: process.env.SMTP_FROM_NAME,
	smtp_from_email: process.env.SMTP_FROM_EMAIL,
	app_url: process.env.APP_URL,
	acl_version: process.env.ACL_VERSION,
	reminder_delay_hours: process.env.REMINDER_DELAY_HOURS,
	home: process.env.HOME,
	ekoslive_key: process.env.EKOSLIVE_KEY
};
