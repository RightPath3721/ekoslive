import React, { useEffect } from "react";
import axios from "axios";
import IconButton from "@mui/material/IconButton";
import useActiveUser from "@hooks/useActiveUser";
import { useActiveObservatory } from "./ObservatoryContext";
import { useEquipmentContext } from "./Equipment/EquipmentContext";
import { Palette } from "@common/shared/common/styles";
import EquipmentList from "./Equipment/EquipmentList";
import Icon from "@components/Icon";

const EquipmentProfileView = ({ profileId, back }) =>
{
    const user = useActiveUser();
    const { observatoryId } = useActiveObservatory();
    const { setEquipmentList } = useEquipmentContext();

    useEffect(() =>
    {
        (async () =>
        {
            if (!user) return;
            try
            {
                const { data: equipmnets } = await axios.get(`/api/equipments?username=${encodeURIComponent(user.username)}&token=${user.token}&observatoryId=${observatoryId}&profileId=${profileId}`, { observatoryId, profileId });
                const { data: { equipmentTypes } } = await axios.get(
                    `/api/equipments/equipment-types?username=${encodeURIComponent(user.username)}&token=${user.token}`
                );
                setEquipmentList(equipmnets.equipmentList.map((equipment) => ({ ...equipment, equipment_type: equipmentTypes.find((type) => type._id === equipment.equipment_type) })));
            } catch (error)
            {
                console.error(error);
                setEquipmentList([]);
            }
        })();
    }, []);

    return (<>
        <IconButton onClick={() => back(null)} sx={{ padding: 0, width: "fit-content" }}>
            <Icon name="arrow-left" color={Palette.white} />
        </IconButton>
        <EquipmentList observatoryId={observatoryId} profileId={profileId} />
    </>)
};

export default EquipmentProfileView;
