import React from "react";
import Modal from "@mui/material/Modal";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Paper from "@mui/material/Paper";

const tableHeaders = [
    "",
    "EkosLive Basic",
    "EkosLive Pro",
    "EkosLive Ultimate",
];

const tableBodyData = {
    "Online Access": [true, true, true],
    "Cloud Storage": ["100 MB", "10 GB", "1000 GB"],
    "Observatory Lease": [false, true, true],
    Spectators: [false, true, true],
    "Push Notifications": [false, true, true],
    "Stella AI(prompts/month)": ["10", "100", "Unlimited"],
    Price: ["Free", "$4.99", "$9.99"],
};

const PricingTableModal = ({ open, close }) =>
{
    return (
        <Modal
            open={open}
            sx={{ display: "grid", placeItems: "center" }}
            onClose={close}
            aria-labelledby="modal-offer-to-buy-subscription"
            aria-describedby="modal-offer-to-buy-subscription"
        >
            <TableContainer
                component={Paper}
                sx={{
                    color: "white",
                    width: "fit-content",
                }}
            >
                <Table sx={{ width: "fit-content" }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#FFFFFF1A" }}>
                            {tableHeaders.map((header, idx) => (
                                <TableCell
                                    sx={{
                                        paddingBlock: "16px",
                                        paddingInline: "20px",
                                        fontSize: "16px",
                                        lineHeight: "28px",
                                        fontWeight: 500,
                                        color: "white",
                                    }}
                                    key={idx}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(tableBodyData).map(([key, values]) => (
                            <TableRow key={key}>
                                <TableCell
                                    sx={{
                                        paddingLeft: "12px",
                                        fontSize: "16px",
                                        verticalAlign: "middle",
                                        textAlign: "left",
                                        color: "white",
                                    }}
                                >
                                    {key}
                                </TableCell>
                                {values.map((value, idx) => (
                                    <TableCell
                                        sx={{
                                            fontSize: "16px",
                                            lineHeight: "28px",
                                            textAlign: "center",
                                            verticalAlign: "middle",
                                            color: "white",
                                            padding: "12px",
                                        }}
                                        key={idx}
                                    >
                                        {typeof value === "string" ? (
                                            String(value)
                                        ) : value ? (
                                            <svg
                                                width="29"
                                                height="29"
                                                viewBox="0 0 29 29"
                                                fill="#FF6600"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{ margin: "0 auto" }}
                                            >
                                                <path d="M12.8663 16.7178L10.3288 14.1803C10.115 13.9664 9.85245 13.8595 9.54134 13.8595C9.23023 13.8595 8.95801 13.9762 8.72467 14.2095C8.51079 14.4234 8.40384 14.6956 8.40384 15.0262C8.40384 15.3567 8.51079 15.6289 8.72467 15.8428L12.0497 19.1678C12.2636 19.3817 12.5358 19.4887 12.8663 19.4887C13.1969 19.4887 13.4691 19.3817 13.683 19.1678L20.3038 12.547C20.5177 12.3331 20.6247 12.0706 20.6247 11.7595C20.6247 11.4484 20.508 11.1762 20.2747 10.9428C20.0608 10.729 19.7886 10.622 19.458 10.622C19.1275 10.622 18.8552 10.729 18.6413 10.9428L12.8663 16.7178ZM14.4997 26.2845C12.8858 26.2845 11.3691 25.9781 9.94967 25.3652C8.53023 24.7531 7.29551 23.922 6.24551 22.872C5.19551 21.822 4.36445 20.5873 3.75234 19.1678C3.13945 17.7484 2.83301 16.2317 2.83301 14.6178C2.83301 13.0039 3.13945 11.4873 3.75234 10.0678C4.36445 8.64839 5.19551 7.41367 6.24551 6.36367C7.29551 5.31367 8.53023 4.48223 9.94967 3.86934C11.3691 3.25723 12.8858 2.95117 14.4997 2.95117C16.1136 2.95117 17.6302 3.25723 19.0497 3.86934C20.4691 4.48223 21.7038 5.31367 22.7538 6.36367C23.8038 7.41367 24.6349 8.64839 25.247 10.0678C25.8599 11.4873 26.1663 13.0039 26.1663 14.6178C26.1663 16.2317 25.8599 17.7484 25.247 19.1678C24.6349 20.5873 23.8038 21.822 22.7538 22.872C21.7038 23.922 20.4691 24.7531 19.0497 25.3652C17.6302 25.9781 16.1136 26.2845 14.4997 26.2845Z"></path>
                                            </svg>
                                        ) : (
                                            <svg
                                                width="29"
                                                height="29"
                                                viewBox="0 0 29 29"
                                                fill="#FFFFFFB3"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{ margin: "0 auto" }}
                                            >
                                                <path d="M22.7829 6.33438C18.2329 1.78438 10.7662 1.78438 6.21621 6.33438C1.66621 10.8844 1.66621 18.351 6.21621 22.901C10.7662 27.451 18.1162 27.451 22.6662 22.901C27.2162 18.351 27.3329 10.8844 22.7829 6.33438ZM17.7662 19.5177L14.4995 16.251L11.2329 19.5177L9.59955 17.8844L12.8662 14.6177L9.59955 11.351L11.2329 9.71771L14.4995 12.9844L17.7662 9.71771L19.3995 11.351L16.1329 14.6177L19.3995 17.8844L17.7662 19.5177Z"></path>
                                            </svg>
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Modal>
    );
};

export default PricingTableModal;
