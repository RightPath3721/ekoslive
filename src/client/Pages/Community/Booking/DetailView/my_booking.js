import React from "react";
import PageContainer from "@components/global/PageContainer";
import MyBookingDetail from "./MyBookingDetail";
import { useParams } from "react-router-dom";

const MyBookingDetailViewPage = () =>
{
	const { bookingId } = useParams();

	return (
		<PageContainer id="booking-detail-page">
			<MyBookingDetail bookingId={bookingId.split("-").pop()} />
		</PageContainer>
	);
};

export default MyBookingDetailViewPage;
