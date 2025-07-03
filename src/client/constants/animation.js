export const headerAnimationConfig = {
	animate: { y: 0 },
	initial: { y: -100 },
	transition: { duration: 0.2, type: "spring", delay: 0.1, stiffness: 110 },
};

export const titleAnimationConfig = {
	initial: { y: 80, opacity: 0.2 },
	transition: { duration: 0.2, type: "spring", delay: 0, stiffness: 120 },
	viewport: { once: true },
	whileInView: { y: 0, opacity: 1 },
};

export const subtitleAnimationConfig = {
	initial: { x: -100, opacity: 0.1 },
	transition: { duration: 0.2, type: "spring", delay: 0.1, stiffness: 120 },
	viewport: { once: true },
	whileInView: { x: 0, opacity: 1 },
};

export const subtextAnimationConfig = {
	initial: { x: 100, opacity: 0.1 },
	transition: { duration: 0.2, type: "spring", delay: 0.1, stiffness: 120 },
	viewport: { once: true },
	whileInView: { x: 0, opacity: 1 },
};

export const listItemAnimationConfig = {
	variants: {
		initial: {
			opacity: 0,
			x: 100,
		},
		animate: (idx) => ({
			opacity: 1,
			x: 0,
			transition: {
				delay: 0.03 * idx,
				duration: 0.2,
				type: "spring",
				stiffness: 120,
			},
		}),
	},
	initial: "initial",
	whileInView: "animate",
	viewport: { once: true },
};

export const featuresListItemAnimationConfig = {
	variants: {
		initial: {
			opacity: 0,
			y: -100,
		},
		animate: (idx) => ({
			opacity: 1,
			y: 0,
			transition: {
				delay: 0.05 * idx,
				duration: 0.1,
				type: "spring",
				stiffness: 105,
			},
		}),
	},
	initial: "initial",
	whileInView: "animate",
	viewport: { once: true },
};

export const platformAnimationConfig = {
	variants: {
		initial: {
			opacity: 0,
			y: -100,
		},
		animate: ({ x, y }) => ({
			opacity: 1,
			y,
			x,
			transition: {
				delay: 0.05,
				duration: 0.1,
				type: "spring",
				stiffness: 105,
			},
		}),
	},
	initial: "initial",
	whileInView: "animate",
	viewport: { once: true },
};

export const pricingTableAnimationConfig = {
	initial: { x: 100, opacity: 0.1 },
	transition: { duration: 0.2, type: "spring", delay: 0.1, stiffness: 105 },
	viewport: { once: true },
	whileInView: { x: 0, opacity: 1 },
};
