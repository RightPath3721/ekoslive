import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from "@redux/selectors";
import { captureActions } from "@redux/actions";
import { styles } from '../shared/styles';
import { ekosliveServer } from '../config';

const CloudSequenceList = ({ files }) =>
{
    const dispatch = useDispatch();
    const [sequences, setSequences] = useState([]);
    const user = useSelector(selectUser);

    useEffect(() =>
    {
        (async () =>
        {
            try
            {
                if (!user) return null;
                
                const url = `/api/cloud/${files === ".esq" ? "sequences" : "schedules"}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
                const { data } = await ekosliveServer.get(url);
                setSequences(data.sequences);
            } catch (error)
            {
                console.log(error);
            }
        })()
    }, [])

    if (sequences.length === 0) return null;
    return (
        <Box sx={[styles.verticalScrollBar, LOCAL_STYLES.container]}>
            {sequences.length > 0 && sequences.map((sequence, idx) =>
            {
                return (
                    <a onClick={() =>
                    {
                        if (sequence.filepath)
                        {
                            try
                            {
                                dispatch(captureActions.loadSequenceFile(sequence.filepath));
                            } catch (err)
                            {
                                console.log(err);
                            }
                        };
                    }} style={LOCAL_STYLES.link} href={sequence?.url} key={idx}>
                        {sequence.filename}
                    </a>
                )
            })}
        </Box>
    )
};

const LOCAL_STYLES = {
    container: {
        display: "grid",
        gridTemplateColumns: "100px",
        gap: "12px",
        maxHeight: "200px",
        overflowY: "scroll",
    },
    link: {
        display: "block",
        cursor: "pointer",
        textDecoration: "none",
        color: "white",
        backgroundColor: "#2a2a2a",
        padding: "12px 4px",
        borderRadius: "4px",
    },
}

export default CloudSequenceList