import s from "../i18n/i18n";

export function isValidUsername(username)
{
	if (!username) return s.validations.username_required;

	username = username.trim();
	const regex = new RegExp(/^[a-zA-Z0-9-_.@]{2,64}$/);
	if (username.length < 3) return s.validations.username_tooshort;
	if (username.length > 64) return s.validations.username_toolong;
	if (!regex.test(username))
	{
		const emailRegex =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (!emailRegex.test(username)) return s.validations.username_invalid;
		else return null;
	}
	else return null;
}

export function isValidPassword(password)
{
	const passValidation = new RegExp(/^(?=.*[a-zA-Z\d]).{6,}$/);
	if (!password)
	{
		return s.validations.password_required;
	}
	else if (!passValidation.test(password))
	{
		return s.validations.password_invalid;
	}
	return null;
}

export function isValidConfirmPassword(confirm, password)
{
	if (!confirm) return s.validations.confirm_password_required;
	if (confirm !== password) return s.validations.confirm_password_mismatch;
	return null;
}

export function isValidEmail(email)
{
	const emailRegex =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (!email) return s.validations.email_required;
	const isValid = emailRegex.test(String(email).toLowerCase());
	return isValid ? null : s.validations.email_invalid;
}

export function isValidLicense(licenseKey)
{
	if ((licenseKey || "").trim().length === 0)
		return s.validations.license_required;
	else return null;
}

export function isValidSerial(serialKey)
{
	if ((serialKey || "").trim().length === 0)
		return s.validations.serial_required;
	else return null;
}

export function isValidDecimal(value, unsigned = true)
{
	if (unsigned) return /^(\d+)?([.]?\d{0,6})?$/.test(value);
	return /^(\-)?(\d+)?([.]?\d{0,6})?$/.test(value);
}

export function isValidNumber(value, unsigned = true)
{
	if (unsigned) return /^(\d+)?$/.test(value);
	return /^(\-)?(\d+)?$/.test(value);
}

export function isValidSpecificName(name, fieldName)
{
	if (!name)
		return (
			fieldName +
			s.validations.username_required.substring(
				8,
				s.validations.username_required.length,
			)
		);

	name = name.trim();
	let regex = new RegExp(/^[a-zA-Z][a-zA-Z0-9-_.]{2,64}$/);
	if (name.length < 3) return s.validations.username_tooshort;
	if (name.length > 64) return s.validations.username_toolong;
	if (!regex.test(name))
	{
		let emailRegex =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (!emailRegex.test(name))
			return (
				s.validations.username_invalid.substring(
					0,
					s.validations.username_invalid.length - 8,
				) + fieldName
			);
		else return null;
	}
	else return null;
}
