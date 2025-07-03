import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Message from "./Message";
import useActiveUser from "../../hooks/useActiveUser";
import { styles } from "../../shared/styles";

const Chat = ({
	history,
	setHistory,
	getPrompts,
	promptsLeft,
	setPromptsLeft,
	executedPrompt,
	setExecutedPrompt,
    isExecuting,
    setIsExecuting,
	editPrompt
}) =>
{
	const chatContainerRef = useRef();
	const observeRef = useRef();
	const user = useActiveUser();
	const [isLoading, setIsLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(0);
	const [itemsRemaining, setItemsRemaining] = useState(5);
	const [previousScrollTop, setPreviousScrollTop] = useState(0);
	const [observer, setObserver] = useState(false);

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				await getPrompts(currentPage);
				setItemsRemaining(itemsRemaining);
			}
			catch (error)
			{
				console.error(error);
			}
		})();
	}, []);

	useEffect(() =>
	{
		const intersectionObserver = new IntersectionObserver(
			async (entries) =>
			{
				const entry = entries[0];
				if (entry.isIntersecting && !isLoading && itemsRemaining >= 5)
				{
					setIsLoading(true);
					const itemsRemaining = await getPrompts(currentPage + 1);
					setItemsRemaining(itemsRemaining);
					setCurrentPage((prevPage) => prevPage + 1);
					setTimeout(() => setIsLoading(false), 1000);
					if (chatContainerRef.current)
					{
						const container = chatContainerRef.current;
						setPreviousScrollTop(
							container.scrollHeight - container.clientHeight,
						);
						container.scrollBy({
							top:
								container.scrollHeight -
								container.clientHeight -
								previousScrollTop,
						});
					}
				}
			},
			{ threshold: 0.01 },
		);

		if (observer && itemsRemaining >= 5 && observeRef.current)
		{
			intersectionObserver.observe(observeRef.current);
		}

		if (itemsRemaining < 5)
		{
			if (observeRef.current)
			{
				intersectionObserver.unobserve(observeRef.current);
			}
		}

		return () =>
		{
			if (observeRef.current)
			{
				intersectionObserver.unobserve(observeRef.current);
			}
		};
	}, [isLoading, currentPage, itemsRemaining, observer]);

	useEffect(() =>
	{
		(async () =>
		{
			if (!user) return;
			
			try
			{
				const { data } = await axios.post(
					`/api/stella/refresh-user-prompts?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					{ planId: user.plan_id },
				);
				setPromptsLeft(data.promptsLeft);
			}
			catch (error)
			{
				console.error(error);
			}
		})();
		if (!chatContainerRef.current) return;

		if (history.length % 5 !== 0 || currentPage === 0)
		{
			chatContainerRef.current.scrollTo(
				0,
				chatContainerRef.current.scrollHeight,
			);
			setTimeout(() => setObserver(true), 1500);
		}
	}, [history]);

	return (
		<Grid
			id="stellaChat"
			container
			sx={[
				styles.verticalScrollBar,
				{
					position: "relative",
					gap: "40px",
					overflowY: "scroll",
					flexWrap: "nowrap",
					flexDirection: "column",
					scrollBehavior: "smooth",
				},
			]}
			ref={chatContainerRef}
		>
			<div ref={observeRef} style={{ height: "400px", margin: "0 auto" }}>
				{isLoading && (
					<CircularProgress
						style={{ width: "20px", height: "20px" }}
						color="info"
					/>
				)}
			</div>
			{history.map((prompt, idx) =>
				idx === history.length - 1 ? (
					<Message
						key={prompt._id}
						prompt={prompt}
						setHistory={setHistory}
						lastMessage
						promptsLeft={promptsLeft}
						executedPrompt={executedPrompt}
						setExecutedPrompt={setExecutedPrompt}
                        isExecuting={isExecuting}
                        setIsExecuting={setIsExecuting}
                        editPrompt={editPrompt}
					/>

				) : (
					<Message
						key={prompt._id}
						prompt={prompt}
						setHistory={setHistory}
						executedPrompt={executedPrompt}
						setExecutedPrompt={setExecutedPrompt}
                        isExecuting={isExecuting}
                        setIsExecuting={setIsExecuting}
						editPrompt={editPrompt}
					/>
				),
			)}
		</Grid>
	);
};

export default Chat;
