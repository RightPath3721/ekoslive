const fs = require("fs");
const path = require("path");

/**
 * Calculates a simple similarity score between two strings
 * @param {string} str1 First string to compare
 * @param {string} str2 Second string to compare
 * @returns {number} Similarity score between 0 and 1
 */
const calculateSimilarity = (str1, str2) =>
{
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1)
        .fill()
        .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++)
    {
        for (let j = 1; j <= len2; j++)
        {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            );
        }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
}

const containsName = (list, name) =>
{
	return list.some((str) => str.toLowerCase() === name);
};

const getObjectPrimaryName = async (objectName) =>
{
    if (!objectName) return null;
    try
    {
        const data = fs.readFileSync(
            path.resolve(__dirname, "../controller/astro_designations.json"),
            "utf8",
        );
        const designations = JSON.parse(data);
        let name = objectName;

        const smallName = name.toLowerCase();
        let foundExactMatch = false;

        // Try to get primary object name if possible to align with KStars
        designations.forEach((oneDesignation) =>
        {
            if (containsName(oneDesignation.designations, smallName))
            {
                name = oneDesignation.primary;
                foundExactMatch = true;
            }
        });

        // Only try fuzzy matching if no exact match was found
        if (!foundExactMatch)
        {
            let bestMatch = null;
            let highestSimilarity = 0;

            designations.forEach((oneDesignation) =>
            {
                oneDesignation.designations.forEach((designation) =>
                {
                    // Simple similarity score based on character matching
                    const similarity = calculateSimilarity(
                        smallName,
                        designation.toLowerCase(),
                    );
                    if (similarity > highestSimilarity && similarity > 0.8)
                    {
                        // 80% similarity threshold
                        highestSimilarity = similarity;
                        bestMatch = oneDesignation.primary;
                    }
                });
            });

            if (bestMatch)
            {
                name = bestMatch;
            }
        }

        return name;

    }
    catch (error)
    {
        return null;
    }
}

module.exports = getObjectPrimaryName;
