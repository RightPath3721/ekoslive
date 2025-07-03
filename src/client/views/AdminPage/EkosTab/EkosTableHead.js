import React from "react";
import TableHead from "../TableHead";

export const headCells = [
    {
        id: "username",
        title: "username",
        path: "username",
        minWidth: "150px",
    },
    {
        id: "email",
        title: "email",
        path: "email",
        minWidth: "200px",
    },
    {
        id: "machine_id",
        title: "machine id",
        path: "machine_id",
        minWidth: "80px",
    },
    {
        id: "ip",
        title: "ip",
        path: "ip",
        minWidth: "80px",
    },
    {
        id: "version",
        title: "Version",
        path: "version",
        minWidth: "40px",
    },
];

const EkosTableHead = (props) =>
{
    return <TableHead headCells={headCells} {...props} />
};

export default EkosTableHead;