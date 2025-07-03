import React from "react";
import SectionTitle from "../../shared/SectionTitle";
import CheckBoxListItem from "../../shared/CheckBoxListItem";
import { observatoryLeaseList } from "../../../constants/observatoryLeaseList";
import observatoryCometImg from "../../../assets/observatory-bg-comet.png";
import observatoryBgImg from "../../../assets/observatory-bg.png";

const ObservatorySection = () =>
{
	return (
		<section
			className="flex-center flex-col items-start px-[9.375rem] pt-60 pb-[23.5rem] bg-no-repeat bg-[position:top_219px_right_72px,_center] bg-[length:314px_340px,cover]"
			style={{
				backgroundImage: `url(${observatoryCometImg}), url(${observatoryBgImg})`,
			}}
		>
			<SectionTitle title="Lease Observatory" />
			<ul className="flex-center flex-col gap-3 items-start mt-5">
				{observatoryLeaseList.map((item, idx) => (
					<CheckBoxListItem text={item} index={idx} key={idx} />
				))}
			</ul>
		</section>
	);
};

export default ObservatorySection;
