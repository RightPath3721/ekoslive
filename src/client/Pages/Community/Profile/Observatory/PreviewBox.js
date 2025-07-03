import React from "react";
import { useSelector } from "react-redux";
import Button from "@mui/material/Button";
import { selectConnectedKStarInstances } from "@redux/selectors";
import { useActiveObservatory } from "./ObservatoryContext";
import ObservatoryBox from "@components/ObservatoryBox";

const PreviewBox = ({ observatory, openMenu }) =>
{
    const { setObservatoryId } = useActiveObservatory();
    const connectedKStars = useSelector(selectConnectedKStarInstances);

    return (
        <Button
            sx={{
                border: "1px solid black",
                borderRadius: "4px",
                minWidth: "auto",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "6px",
            }}
            onClick={() =>
            {
                setObservatoryId(observatory._id);
                openMenu();
            }}
        >
            <ObservatoryBox
                name={observatory.name}
                photo={observatory.photos[0]}
                connected={connectedKStars?.some(
                    (item) => item.machineID === observatory?.machine_id
                )}
            />
        </Button>
    );
};

export default PreviewBox;
