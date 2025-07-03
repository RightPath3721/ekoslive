import React from "react";
import dayjs from "dayjs";
import TableHead from "../TableHead";

export const headCells = [
    {
        id: "username",
        title: "username",
        path: "username",
        minWidth: "150px",
    },
    {
        id: "prompt",
        title: "prompt",
        path: "prompt",
        minWidth: "200px",
    },
    {
        id: "response",
        title: "response",
        path: "response",
        minWidth: "350px",
    },
    {
        id: "createdAt",
        title: "created at",
        path: "createdAt",
        minWidth: "150px",
        format: (value) => dayjs(value).format("YYYY-MM-DD HH:mm"),
    },
    {
        id: "scheduler",
        title: "scheduler",
        path: "scheduler",
        minWidth: "40px",
        action: true,
    },
    {
        id: "sequence",
        title: "sequence",
        path: "sequence",
        minWidth: "40px",
        action: true,
    },
    {
        id: "rating",
        title: "rating",
        path: "feedback.rating",
        minWidth: "30px",
    },
    {
        id: "feedback",
        title: "feedback",
        path: "feedback.feedback",
        minWidth: "150px",
    },
    {
        id: "source",
        title: "source",
        path: "source",
        minWidth: "30px",
    },
    {
        id: "liked",
        title: "liked",
        path: "feedback.liked",
        minWidth: "30px",
    },
];

const FeedbackTableHead = (props) =>
{
    return <TableHead headCells={headCells} {...props} />;
};

export default FeedbackTableHead;