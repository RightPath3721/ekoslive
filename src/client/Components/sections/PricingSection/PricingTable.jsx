import React from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { pricingTableData } from "../../../constants/pricingTableData";
import { TableCheckMark, TableX } from "../@client/";
import TableButton from "./TableButton";
import { pricingTableAnimationConfig } from "../../../constants/animation";

const PricingTable = () =>
{
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });
	const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });

	return (
		<motion.table {...pricingTableAnimationConfig} className="mt-8">
			<thead>
				<tr className="bg-white-10">
					{pricingTableData.headers.map((header) => (
						<th
							className="py-2 sm:py-3 lg:py-5 px-2 sm:px-8 lg:px-12 font-raleway text-sm sm:text-base align-middle lg:text-xl leading-4 sm:leading-6 text-center font-semibold"
							key={header}
						>
							{header}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{Object.entries(pricingTableData.body).map(([key, values], idx) => (
					<tr className="[&>td]:py-2 sm:[&>td]:py-3 lg:[&>td]:py-5" key={idx}>
						<td className="bg-white-10 pl-1 pr-2 sm:pl-3 lg:pl-5 sm:pr-6 lg:pr-8 font-raleway text-xs sm:text-sm lg:text-base leading-4 sm:leading-[1.125rem] align-middle font-normal text-left">
							{key}
						</td>
						{values.map((value, idx) => (
							<td
								className="font-manrope text-sm sm:text-lg lg:text-xl text-center font-medium align-middle"
								key={idx}
							>
								{typeof value === "string" ? (
									String(value)
								) : value ? (
									<TableCheckMark
										height={isLargeScreen ? 29 : isMediumScreen ? 24 : 18}
										width={isLargeScreen ? 29 : isMediumScreen ? 24 : 18}
										color="#FF6600"
										className="mx-auto"
									/>
								) : (
									<TableX
										height={isLargeScreen ? 29 : isMediumScreen ? 24 : 18}
										width={isLargeScreen ? 29 : isMediumScreen ? 24 : 18}
										color="#FFFFFFB3"
										className="mx-auto"
									/>
								)}
							</td>
						))}
					</tr>
				))}
			</tbody>
			<tfoot>
				<tr>
					{pricingTableData.headers.map((header, idx) => (
						<td className="pt-6 lg:pt-8" key={idx}>
							{header ? (
								<TableButton className="text-xs sm:text-base px-1 sm:px-6 lg:px-8 mx-auto block" />
							) : (
								header
							)}
						</td>
					))}
				</tr>
			</tfoot>
		</motion.table>
	);
};

export default PricingTable;
