import React from "react";
import PageContainer from "@components/global/PageContainer";
import MyObservatoryDetail from "./MyObservatoryDetail";
import { useParams } from "react-router-dom";

const BookingDetailViewPage = () =>
{
	const { bookingId } = useParams();

	return (
		<PageContainer id="booking-detail-page">
			<MyObservatoryDetail bookingId={bookingId.split("-").pop()} />
		</PageContainer>
	);
};

export default BookingDetailViewPage;
