import React from "react";
import Grid from "@mui/material/Grid";
import PostPreview from "./PostPreview";

const PostsList = ({ posts }) =>
{
    return (
        <Grid
            display="grid"
            gridRow="2 / 4"
            gridTemplateRows="minmax(200px, 1fr)"
            spacing={2}
            container
            justifyContent="center"
        >
            {posts.map((post) => (
                <PostPreview post={post} key={post._id} />
            ))}
        </Grid>
    );
};

export default PostsList;
