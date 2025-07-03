import React from "react";
import DetailView from "@components/shared/DetailView";
import { useParams } from "react-router-dom";
import PageContainer from "@components/global/PageContainer";

const DetailViewPage = () =>
{
	const { postNameId } = useParams();
	const postID = postNameId.split("-").pop();

	return (
		<PageContainer>
			<DetailView postID={postID} />
		</PageContainer>
	);
};

export default DetailViewPage;
