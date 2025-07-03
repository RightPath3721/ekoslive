import kstarsImg from "@client/icons/wizard_icons/kstars.webp";
import sharpCapImg from "@client/icons/wizard_icons/SharpCap.webp";
import fireCaptureImg from "@client/icons/wizard_icons/firecapture.webp";
import sequenceGeneratorImg from "@client/icons/wizard_icons/sequence_generator_pro.webp";
import maximDLImg from "@client/icons/wizard_icons/maxim_dl.webp";
import aptImg from "@client/icons/wizard_icons/apt.webp";
import ninaImg from "@client/icons/wizard_icons/nina.webp";
import skyxImg from "@client/icons/wizard_icons/skyx.webp";
import stellarmateProImg from "@client/icons/wizard_icons/stellarmate_pro.webp";
import stellarmateXImg from "@client/icons/wizard_icons/stellarmate_x.webp";
import raspberryPIImg from "@client/icons/wizard_icons/raspberry_pi.webp";
import miniPCImg from "@client/icons/wizard_icons/minipc.webp";
import zwoasiairImg from "@client/icons/wizard_icons/zwoasiair.webp";
import lunarImg from "@client/icons/wizard_icons/lunar.webp";
import deepSkyImg from "@client/icons/wizard_icons/deep_sky.webp";
import planetaryImg from "@client/icons/wizard_icons/planetary.webp";
import milkyWayImg from "@client/icons/wizard_icons/milky_way.webp";
import laptopImg from "@client/icons/wizard_icons/laptop.webp";

import HardwareTab from "./SocialWizardTabs/HardwareTab/HardwareTab";
import ObservatoryTab from "./SocialWizardTabs/ObservatoryTab/ObservatoryTab";
import SocialProfileTab from "./SocialWizardTabs/SocialProfileTab/SocialProfileTab";
import SoftwareTab from "./SocialWizardTabs/SoftwareTab/SoftwareTab";
import ImagingTab from "./SocialWizardTabs/ImagingTab/ImagingTab";
import s from "@common/shared/i18n/i18n";

const wizardSteps = [
	{
		title: s.social.social_profile,
		content: SocialProfileTab,
		formId: "social-profile-form",
	},
	{ title: s.tourGuide.title_observatory, content: ObservatoryTab, formId: "observatory-form" },
	{
		title: s.status.software,
		content: SoftwareTab,
		question: s.wizard.software_title,
		formId: "software-form",
		options: [
			{ value: "KStars", src: kstarsImg, label: "KStars" },
			{ value: "SharpCap", src: sharpCapImg, label: "SharpCap" },
			{ value: "FireCapture", src: fireCaptureImg, label: "FireCapture" },
			{
				value: "Sequence Generator Pro",
				src: sequenceGeneratorImg,
				label: "Sequence Generator Pro",
			},
			{ value: "MaximDL", src: maximDLImg, label: "MaximDL" },
			{ value: "APT", src: aptImg, label: "APT" },
			{ value: "NINA", src: ninaImg, label: "NINA" },
			{ value: "TheSkyX", src: skyxImg, label: "TheSkyX" },
		],
	},
	{
		title: s.general.hardware,
		content: HardwareTab,
		question: s.wizard.hardware_title,
		formId: "hardware-form",
		options: [
			{
				value: "StellarMate Pro",
				src: stellarmateProImg,
				label: "StellarMate Pro",
			},
			{ value: "StellarMate X", src: stellarmateXImg, label: "StellarMate X" },
			{ value: "Raspberry PI", src: raspberryPIImg, label: "Raspberry PI" },
			{ value: "MiniPC", src: miniPCImg, label: "MiniPC" },
			{ value: "Laptop", src: laptopImg, label: "Laptop" },
			{ value: "ZWO ASIAir", src: zwoasiairImg, label: "ZWO ASIAir" },
		],
	},
	{
		title: s.general.imaging,
		content: ImagingTab,
		question: s.wizard.imaging_title,
		formId: "imaging-form",
		options: [
			{
				value: "Deep Sky",
				src: deepSkyImg,
				label: "Deep Sky",
			},
			{ value: "Lunar", src: lunarImg, label: "Lunar" },
			{ value: "Planetary", src: planetaryImg, label: "Planetary" },
			{ value: "Milky Way", src: milkyWayImg, label: "Milky Way" },
		],
	},
];

export default wizardSteps;
