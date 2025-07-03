import onlineAccesImg from "../../../assets/features/online_feat.webp";
import cloudStorageImg from "../../../assets/features/cloud_feat.webp";
import stellaImg from "../../../assets/features/stella_feat.webp";
import observatoryImg from "../../../assets/features/observatory_feat.webp";
import skymapImg from "../../../assets/features/skymap_feat.webp";
import notificationImg from "../../../assets/features/notifications_feat.webp";
import livestackingImg from "../../../assets/features/livestacking_feat.webp";
import { planType } from "@indi/enums";

export const tableData = [
    {
        title: "Basic",
        data: {
            featuresList: [
                {
                    title: "Online Access",
                    available: true,
                },
                {
                    title: "100MB Storage",
                    available: true,
                },
                {
                    title: "Stella AI(10 prompts/month)",
                    available: true,
                },
                {
                    title: "Observatory Lease",
                    available: false,
                },
                {
                    title: "Sky Map",
                    available: false,
                },
                {
                    title: "Push Notifications",
                    available: false,
                },
                {
                    title: "Live Stacking",
                    available: false,
                },
                {
                    title: "Single observatory",
                    available: true,
                },
            ],
            monthPrice: "Free",
            yearPrice: "Free",
        },
        popular: false,
        ids: [planType.DEFAULT],
    },
    {
        title: "Pro",
        data: {
            featuresList: [
                {
                    title: "Online Access",
                    available: true,
                },
                {
                    title: "10GB Storage",
                    available: true,
                },
                {
                    title: "Stella AI(100 prompts/month)",
                    available: true,
                },
                {
                    title: "Observatory Lease",
                    available: true,
                },
                {
                    title: "Sky Map",
                    available: true,
                },
                {
                    title: "Push Notifications",
                    available: true,
                },
                {
                    title: "Live Stacking",
                    available: true,
                },
                {
                    title: "Single observatory",
                    available: true,
                },
            ],
            monthPrice: "$5.99",
            yearPrice: "$59.99",
        },
        popular: true,
        ids: [planType.PRO_PLAN, planType.PRO_MONTHLY],
    },
    {
        title: "Ultimate",
        data: {
            featuresList: [
                {
                    title: "Online Access",
                    available: true,
                },
                {
                    title: "1000GB Storage",
                    available: true,
                },
                {
                    title: "Stella AI(Unlimited access)",
                    available: true,
                },
                {
                    title: "Observatory Lease",
                    available: true,
                },
                {
                    title: "Sky Map",
                    available: true,
                },
                {
                    title: "Push Notifications",
                    available: true,
                },
                {
                    title: "Live Stacking",
                    available: true,
                },
                {
                    title: "Unlimited observatories",
                    available: true,
                },
            ],
            monthPrice: "$11.50",
            yearPrice: "$119",
        },
        popular: false,
        ids: [planType.ULTIMATE, planType.ULTIMATE_MONTHLY],
    },
];

export const featuresList = [
    {
        title: "Online Access 24x7",
        description: "Control your observatory from any browser, anytime, anywhere—no software needed. Access Equipment Profiles, Ekos, Gallery, Sky, and Stella AI in an optimized, mobile-friendly view. Manage multiple observatories and assign granular controls.",
        img: { src: onlineAccesImg, alt: "EkosLive preview" },
        align: "top",
    },
    {
        title: "Cloud Storage",
        description: "Never lose your images again! Upload them to the cloud with efficient lossless compression algorithms. Each image includes detailed metadata, making searching and sorting easy with Stella-powered image search.",
        img: { src: cloudStorageImg, alt: "Gallery preview" },
        align: "top",
    },
    {
        title: "Stella AI",
        description: "Stella revolutionizes observatory control with natural language commands. Use text or voice prompts to plan, control, or retrieve data in seconds. Stella tailors imaging targets to your location, equipment, and sky conditions. Find all Orion Nebula images with a specific filter from the last two months by simply asking.",
        img: { src: stellaImg, alt: "Stella chat preview" },
        align: "top",
    },
    {
        title: "Observatory Lease",
        description: "Is your backyard observatory sitting idle? Lease it out and earn income! Advertise your observatory services, from premium locations to backyard setups, on the EkosLive marketplace. Choose plans and set availability times. Advanced access control ensures customers only use approved resources.(Available Q4 2025)",
        img: { src: observatoryImg, alt: "Observatory on the backyard" },
        align: "left",
    },
    {
        title: "Sky Map",
        description: "Plan and monitor operations visually in the Sky Map. Use the Mosaic Assistant to schedule mosaics. Command GOTOs and use the Frame Assistant for precise orientation and centering. Toggle DSS overlay for high-resolution Deep Sky Survey images to enhance planning.",
        img: { src: skymapImg, alt: "Sky Map preview" },
        align: "top",
    },
    {
        title: "Push Notifications",
        description: "No need to stay at the observatory! Get smartphone Push Notifications for operations and alerts. Know if operations fail or if the roof is closing due to weather. Customize notifications to receive only what matters to you.",
        img: { src: notificationImg, alt: "Notification menu" },
        align: "top",
    },
    {
        title: "Live Stacking",
        description: "See your images come to life with Live Stacking, featuring automated background removal and contrast adjustments. EkosLive can search your cloud library for the best calibration frames if you captured them before. It's that simple!",
        img: { src: livestackingImg, alt: "Live stacking demo" },
        align: "top",
    },
];
