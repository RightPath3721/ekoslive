import { Box, Checkbox, Grid, Typography } from "@mui/material";
import { isEmpty, isEqual } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { alignActions } from "@redux/actions";
import NumericControl from "../../Components/NumericControl";
import s from "@common/shared/i18n/i18n";
import { selectAlignSettings } from "@redux/selectors";

const RotatorControl = () => 
{
    const dispatch = useDispatch();
    const alignSettings = useSelector(selectAlignSettings, isEqual);

    const [state, setState] = useState(
        {
            isRotatorControl: isEmpty(alignSettings) ? false : alignSettings.kcfg_AstrometryUseRotator,
            threshold: isEmpty(alignSettings) ? 0 : alignSettings.kcfg_AstrometryRotatorThreshold,
        });

    const { isRotatorControl, threshold } = state;

    useEffect(() =>
    {
        const payload = {
            kcfg_AstrometryRotatorThreshold: threshold,
            kcfg_AstrometryUseRotator: isRotatorControl,
        }
        dispatch(alignActions.setAllSettings(payload));
    }, [state])

    return (
        <Grid container sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            justifyContent: "start",
            rowGap: "16px",
            columnGap: "32px",
            padding: "12px 0px"
        }}>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
                <Checkbox
                    style={{ color: "white", padding: 0 }}
                    checked={isRotatorControl}
                    onChange={() =>
                    {
                        setState({ ...state, isRotatorControl: !isRotatorControl });
                    }}
                />
                <Typography sx={{ color: "white", width: "max-content" }}>{s.ekos.collapse_align.align_settings.rotator_control}</Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
                <Typography sx={{ color: "white" }}>{s.ekos.collapse_focus.process.threshold}</Typography>
                <NumericControl
                    initialValue={threshold}
                    onChange={(value) =>
                    {
                        setState({ ...state, threshold: value });
                    }}
                    customLimit={[0, 120]}
                    steps={[10, 10]}
                />
                <Typography sx={{ color: "white" }}>{s.general.arcmin}</Typography>
            </Box>

        </Grid>
    )
}

export default RotatorControl;