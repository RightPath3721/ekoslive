import React from "react";
import { get } from "lodash";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import { headCells } from "./EkosTableHead";
import { Palette } from "@common/shared/common/styles";

const filters = ["machine_id", "username", "email"];

const EkosRow = ({ ekos, changeTab }) =>
{
    return (
        <TableRow
            sx={{ background: ekos.connected ? Palette.darkGreen : Palette.red }}
            role="cell"
            tabIndex={-1}
        >
            {headCells.map((header, idx) =>
            {
                let value = get(ekos, header.path, "");
                if (typeof value === "boolean") value = value.toString();

                return (
                    <TableCell
                        sx={{
                            padding: "8px",
                            border: "1px solid #FFFCFA1F",
                            color: Palette.white,
                            cursor: filters.includes(header.id) ? "pointer" : "default",
                        }}
                        key={idx}
                        align="right"
                        onClick={
                            filters.includes(header.id) ? () => changeTab(value) : undefined
                        }
                    >
                        {value ? (header.format ? header.format(value) : value) : "N/A"}
                    </TableCell>
                );
            })}
        </TableRow>
    );
};

export default EkosRow;
