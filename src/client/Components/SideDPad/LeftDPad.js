import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mountActions } from "@redux/actions";
import { Palette } from "@common/shared/common/styles";
import Icon from "../Icon";
import
{
    selectMountStatus,
    selectMountQClock,
} from "@redux/selectors";

const LOCAL_STYLES = {
    upArrow: {
        borderTopRightRadius: "24px",
        borderTopLeftRadius: "24px",
        borderWidth: 1,
        width: "96px",
        elevation: 9,
        borderColor: "#333",
        backgroundColor: "#000000ee"
    },
    downArrow: {
        borderBottomRightRadius: "24px",
        borderBottomLeftRadius: "24px",
        borderWidth: 1,
        width: "96px",
        elevation: 9,
        borderColor: "#333",
        backgroundColor: "#000000ee"
    },
    container: {
        width: "200px",
        height: "200px",
        borderRadius: "100px",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ffffff66",
        elevation: 9,
        zIndex: 100,
        shadowOpacity: 0.5,
        shadowColor: "black",
        shadowRadius: 10,
        shadowOffset: {height: 2, width: 2}
    },
    disabledStyle: {
        opacity: 0.5
    },
    row: {
        flex: 1,
        flexDirection: "row"
    },
    buttonContainer: {
        flex: 1
    },
    leftArrow: {
        transform: [{rotate: "45deg"}]
    },
    topArrow: {
        transform: [{rotate: "135deg"}]
    },
    rightArrow: {
        transform: [{rotate: "-45deg"}]
    },
    bottomArrow: {
        transform: [{rotate: "-135deg"}]
    },
    buttonBody: {
        backgroundColor: "#000000ee",
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    active: {backgroundColor: Palette.orange},
    circularButton: {
        backgroundColor: "#900"
    },
    button: {
        minWidth: "96px",
        paddingInline: "24px",
        paddingBlock: "46px",
        height: "72px",
        alignItems: "center",
        justifyContent: "center"
    },
};
const LeftDPad = () =>
{
    const dispatch = useDispatch();

    const status = useSelector(selectMountStatus);
    const locked = useSelector(selectMountQClock);

    const [state, setState] = useState([{
        movingUp: false,
        movingDown: false,
        movingRight: false,
        movingLeft: false,
    }]);
    const [enabled, setEnabled] = useState(true);


    const {movingDown, movingUp, movingLeft, movingRight} = state;

    useEffect(() =>
    {
        if(!status.startsWith("Moving"))
        {
            setState({...state, movingDown: false, movingUp: false, movingLeft: false, movingRight: false});
        }
        else
        {
            const direction = status.split(" ")[1];
            if(movingUp === false && direction.includes("N")) setState({movingUp: true});
            if (movingDown === false && direction.includes("S")) setState({movingDown: true});
            else if (movingRight === false && direction.includes("E")) setState({movingRight: true})
            else if (movingLeft === false && direction.includes("W")) setState({movingLeft: true})
        }
    }, [status]);

    const handleChange = (event, action = false) =>
    {
        setEnabled(!enabled);
        if (status === "Parked") return;

        let direction = "";

        switch (event)
        {
            case "movingUp":
                direction = "N";
                break;

            case "movingDown":
                direction = "S";
                break;

            case "movingRight":
                direction = "E";
                break;

            case "movingLeft":
                direction = "W";
                break;
        }

        dispatch(mountActions.setMotion(direction, action));
        setState({[event]: action});
    };

        const disabled = status === "Parked" || locked ;
        return (
            <>
                <Box
                    sx={[LOCAL_STYLES.upArrow, movingDown ? {backgroundColor: Palette.orange} : {backgroundColor: "#000000ee"}, disabled ? LOCAL_STYLES.disabledStyle : null]}>
                    <Button
                        disabled={disabled || movingLeft || movingUp || movingRight}
                        sx={LOCAL_STYLES.button}
                        onMouseDown={() => handleChange("movingDown", true)}
                        onMouseUp={() => handleChange("movingDown", false)}                                        
                    >
                        <Icon
                            name="status-arrowdown"
                            size={32}
                            color={Palette.white70}
                        />
                    </Button>
                </Box>

                <Box
                    sx={[LOCAL_STYLES.downArrow, movingLeft ? {backgroundColor: Palette.orange} : {backgroundColor: "#000000ee"}, disabled ? LOCAL_STYLES.disabledStyle : null]}>
                    <Button
                        disabled={disabled || movingDown || movingRight || movingUp }
                        sx={LOCAL_STYLES.button}
                        onMouseDown={() => handleChange("movingLeft", true)}
                        onMouseUp={() => handleChange("movingLeft", false)}
                    >
                        <Icon
                            name="status-arrowleft"
                            size={32}
                            color={Palette.white70}
                        />
                    </Button>
                </Box>
            </>
        );
    }


export default (LeftDPad);

