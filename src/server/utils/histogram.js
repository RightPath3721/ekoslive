const jpeg = require("jpeg-js");

/**
 * Generates a histogram image from image data
 * @param {Buffer} data - The image data buffer
 * @param {number} channels - Number of color channels (1 for grayscale, 3 for RGB)
 * @returns {string} Base64 encoded JPEG data URL
 */
const generateHistogram = (data, channels) =>
{
	// Decode image
	const pixels = jpeg.decode(data, { useTArray: true });
	const total_samples = pixels.data.length;

	// Calculate histogram with integer downsampling
	const downsample = total_samples > 2000000 ? 4 : 1;
	const histo = { r: new Uint32Array(256) };

	if (channels === 1)
	{
		for (let i = 0; i < total_samples; i += 4 * downsample)
		{
			const val =
				((pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3) | 0;
			histo.r[val]++;
		}
	}
	else
	{
		histo.g = new Uint32Array(256);
		histo.b = new Uint32Array(256);
		for (let i = 0; i < total_samples; i += 4 * downsample)
		{
			histo.r[pixels.data[i]]++;
			histo.g[pixels.data[i + 1]]++;
			histo.b[pixels.data[i + 2]]++;
		}
	}

	// Create image buffer
	const width = 800;
	const height = 100;
	const imageData = new Uint8Array(width * height * 4);

	// Pre-calculate drawing constants with proper padding
	const padding = {
		top: 15, // Safe margin for peaks
		bottom: 15, // Safe margin for baseline and markers
		left: 0, // Space for markers
		right: 0, // Keep symmetric
	};
	const xScale = (width - padding.left - padding.right) / 255;
	const drawHeight = height - padding.top - padding.bottom;
	const drawArea = {
		left: padding.left,
		right: width - padding.right,
		top: padding.top,
		bottom: height - padding.bottom,
	};

	// Draw background grid
	function drawGrid()
	{
		const gridColor = { r: 80, g: 80, b: 80, a: 32 }; // Light gray for grid
		const markerColor = { r: 140, g: 140, b: 140, a: 80 }; // Subtle gray for markers

		// Helper to draw a single pixel
		function drawPixel(x, y)
		{
			const idx = (y * width + x) * 4;
			imageData[idx] = gridColor.r;
			imageData[idx + 1] = gridColor.g;
			imageData[idx + 2] = gridColor.b;
			imageData[idx + 3] = gridColor.a;
		}

		// Helper to draw with specific color
		function drawPixelWithColor(x, y, color)
		{
			const idx = (y * width + x) * 4;
			imageData[idx] = color.r;
			imageData[idx + 1] = color.g;
			imageData[idx + 2] = color.b;
			imageData[idx + 3] = color.a;
		}

		// Draw prominent markers at quartiles
		const markers = [25, 50, 75];
		markers.forEach((percent) =>
		{
			const x =
				drawArea.left + (percent / 100) * (drawArea.right - drawArea.left);
			const xPos = Math.round(x);

			// Draw single pixel vertical line for full height
			for (let y = drawArea.top - 3; y <= drawArea.bottom + 3; y++)
			{
				drawPixelWithColor(xPos, y, markerColor);
			}
		});

		// Draw horizontal grid lines
		const yStep = drawHeight / 4;
		for (let y = drawArea.top; y <= drawArea.bottom; y += yStep)
		{
			const yPos = Math.round(y);
			for (let x = drawArea.left; x <= drawArea.right; x++)
			{
				drawPixelWithColor(x, yPos, gridColor);
			}
		}
	}

	// Draw initial grid
	drawGrid();

	// Find max value for scaling (avoiding spread operator for performance)
	let maxVal = 0;
	if (channels === 1)
	{
		for (let i = 0; i < 256; i++)
		{
			if (histo.r[i] > maxVal) maxVal = histo.r[i];
		}
	}
	else
	{
		for (let i = 0; i < 256; i++)
		{
			if (histo.r[i] > maxVal) maxVal = histo.r[i];
			if (histo.g[i] > maxVal) maxVal = histo.g[i];
			if (histo.b[i] > maxVal) maxVal = histo.b[i];
		}
	}
	const logMax = Math.log(maxVal + 1);

	// Pre-compute normalized and scaled values for better performance
	const valueLookup = new Float32Array(maxVal + 1);
	for (let i = 0; i <= maxVal; i++)
	{
		// Apply log scale then normalize to 0-1 range
		const logValue = i === 0 ? 0 : Math.log(i + 1);
		// Scale to use full available height
		valueLookup[i] = logValue / logMax;
	}

	// Safe line drawing function with anti-aliasing and thickness
	function drawLine(x1, y1, x2, y2, r, g, b, alpha = 255, thickness = 2)
	{
		// Ensure coordinates are within bounds
		x1 = Math.max(0, Math.min(width - 1, x1));
		y1 = Math.max(0, Math.min(height - 1, y1));
		x2 = Math.max(0, Math.min(width - 1, x2));
		y2 = Math.max(0, Math.min(height - 1, y2));

		const dx = x2 - x1;
		const dy = y2 - y1;
		const steps = Math.max(Math.abs(dx), Math.abs(dy)) + 1;

		// Draw thicker line without anti-aliasing
		for (let i = 0; i <= steps; i++)
		{
			const t = i / steps;
			const x = Math.round(x1 + dx * t);
			const y = Math.round(y1 + dy * t);

			// Draw main line pixel
			const idx = (y * width + x) * 4;
			imageData[idx] = r;
			imageData[idx + 1] = g;
			imageData[idx + 2] = b;
			imageData[idx + 3] = 255;

			// Draw additional pixels for thickness
			if (y + 1 < height)
			{
				const upperIdx = ((y + 1) * width + x) * 4;
				imageData[upperIdx] = r;
				imageData[upperIdx + 1] = g;
				imageData[upperIdx + 2] = b;
				imageData[upperIdx + 3] = 255;
			}
			if (y - 1 >= 0)
			{
				const lowerIdx = ((y - 1) * width + x) * 4;
				imageData[lowerIdx] = r;
				imageData[lowerIdx + 1] = g;
				imageData[lowerIdx + 2] = b;
				imageData[lowerIdx + 3] = 255;
			}
		}
	}

	// Function to fill area under the line
	function fillArea(points, r, g, b)
	{
		const baselineY = drawArea.bottom;

		// For each x coordinate
		for (let x = points[0].x; x <= points[points.length - 1].x; x++)
		{
			// Find the y value on the line for this x
			let y = baselineY;
			for (let i = 0; i < points.length - 1; i++)
			{
				if (x >= points[i].x && x <= points[i + 1].x)
				{
					const t = (x - points[i].x) / (points[i + 1].x - points[i].x);
					y = points[i].y + t * (points[i + 1].y - points[i].y);
					break;
				}
			}

			// Fill from y to baseline with more transparent gray
			for (let fillY = Math.round(y); fillY <= baselineY; fillY++)
			{
				const idx = (fillY * width + x) * 4;
				imageData[idx] = 64; // Darker gray fill
				imageData[idx + 1] = 64;
				imageData[idx + 2] = 64;
				imageData[idx + 3] = 200; // More transparent
			}
		}
	}

	// Draw histogram lines with proper scaling
	function plotData(data, r, g, b)
	{
		const baselineY = drawArea.bottom;
		const points = [];

		// Collect all points first
		points.push({ x: padding.left, y: baselineY });
		for (let i = 0; i < 256; i++)
		{
			const x = Math.round(i * xScale + padding.left);
			const val = valueLookup[data[i]];
			const y = Math.round(drawArea.bottom - val * drawHeight);
			points.push({ x, y });
		}
		points.push({ x: points[points.length - 1].x, y: baselineY });

		// Fill area under the curve
		fillArea(points, r, g, b);

		// Plot histogram lines
		for (let i = 1; i < points.length; i++)
		{
			drawLine(
				points[i - 1].x,
				points[i - 1].y,
				points[i].x,
				points[i].y,
				r,
				g,
				b,
			);
		}
	}

	// Plot the data
	if (channels === 1)
	{
		plotData(histo.r, 211, 92, 18); // #d35c12
	}
	else
	{
		plotData(histo.r, 204, 0, 0); // #cc0000
		plotData(histo.g, 0, 204, 0); // #00cc00
		plotData(histo.b, 0, 0, 204); // #0000cc
	}

	// Create JPEG
	const jpegImageData = jpeg.encode({ data: imageData, width, height }, 90);
	return "data:image/jpeg;base64," + jpegImageData.data.toString("base64");
};

module.exports = { generateHistogram };
