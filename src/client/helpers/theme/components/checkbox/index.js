import { Palette } from "@common/shared/common/styles";

const checkbox = {
    styleOverrides: {
        root: {
            padding: 0, color: Palette.white, "&.Mui-checked": {
                color: Palette.white,
            }
        },
    },
};

export default checkbox;
