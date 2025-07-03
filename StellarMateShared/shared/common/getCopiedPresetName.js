const getCopiedPresetName = (presetName) =>
{
    if (!presetName) return "(1)";
    // check if the name already contain a duplicate sign - (${number})
    const prevNameCounter = presetName.match(/\(\d+\)/);
    if (prevNameCounter?.[0])
    {
        // if there is a valid number increase it value by 1, otherwise returning previous name concatenated with (1)
        const prevCounter = +prevNameCounter[0]?.replaceAll(/\(|\)/gi, "");
        if (isNaN(prevCounter))
        {
            return presetName + " (1)";
        }
        else
        {
            return presetName.replace(/\(\d+\)/, `(${prevCounter + 1})`);
        }
    }
    else
    {
        return presetName + " (1)";
    }
};

export default getCopiedPresetName;
