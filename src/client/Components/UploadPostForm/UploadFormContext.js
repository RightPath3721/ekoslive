import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import axios from "axios";
import get from "lodash/get";
import { captureException } from "@sentry/browser";
import useActiveUser from "@hooks/useActiveUser";
import usePostAPI from "@hooks/usePostAPI";
import { PublishStatus, SubmissionStatus, AccessLevel } from "@utils/status";
import { useCurrentProfileContext } from "@client/Pages/Community/CurrentProfileContext";

const UploadFormContext = createContext({
	image: null,
	setImage: () =>
	{},
	observatory: null,
	setObservatory: () =>
	{},
	equipmentProfile: null,
	setEquipmentProfile: () =>
	{},
	title: "",
	setTitle: () =>
	{},
	description: "",
	setDescription: () =>
	{},
	astrobinLink: "",
	setAstrobinLink: () =>
	{},
	filters: [],
	setFilters: () =>
	{},
	uploadPost: () =>
	{},
	mode: "add",
	updatePost: () =>
	{},
	additionalMetadata: {},
	setAdditionalMetadata: () =>
	{},
	submissionStatus: "",
	setSubmissionStatus: () =>
	{},
	tags: [],
	setTags: () =>
	{},
	note: "",
	setNote: () =>
	{},
	isOwner: false,
	owner: "",
});

export const useUploadFormContext = () => useContext(UploadFormContext);

const UploadFormContextProvider = ({ children, mode, id, submit }) =>
{
	const user = useActiveUser();
	const { profile } = useCurrentProfileContext();
	const { getPostById } = usePostAPI();
	const [image, setImage] = useState(null);
	const [observatory, setObservatory] = useState(null);
	const [equipmentProfile, setEquipmentProfile] = useState(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [astrobinLink, setAstrobinLink] = useState("");
	const [filters, setFilters] = useState([]);
	const [additionalMetadata, setAdditionalMetadata] = useState({});
	const [isOwner, setIsOwner] = useState(false);
	const [owner, setOwner] = useState("");

	const [submissionStatus, setSubmissionStatus] = useState(SubmissionStatus[1]);
	const [tags, setTags] = useState([]);
	const [note, setNote] = useState("");

	const uploadPost = useCallback(async () =>
	{
		if (!user) return null;
		const url = `/api/posts/?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		try
		{
			const metadata = { equipment_profile: equipmentProfile, filters };
			const blobImage = await (await fetch(image)).blob();
			const postData = new FormData();
			postData.append("title", title);
			postData.append("description", description);
			postData.append("astrobinLink", astrobinLink);
			postData.append("image", blobImage);
			postData.append("metadata", JSON.stringify(metadata));
			postData.append("submissionStatus", submissionStatus);
			postData.append("tags", tags);
			postData.append("note", note);
			postData.append("additionalMetadata", JSON.stringify(additionalMetadata));

			const { data } = await axios.post(url, postData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			if (data && submit)
			{
				submit?.(data);
			}
			return data;
		}
		catch (error)
		{
			captureException(error);
		}
	}, [
		user,
		title,
		description,
		astrobinLink,
		image,
		equipmentProfile,
		filters,
		submit,
		submissionStatus,
		tags,
		note,
		additionalMetadata,
	]);

	const updatePost = useCallback(async () =>
	{
		if (!user) return null;
		
		const url = `/api/posts/${id}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		try
		{
			const { data } = await axios.patch(url, {
				title,
				description,
				astrobinLink,
				metadata: { equipment_profile: equipmentProfile, filters },
				equipmentProfile,
				filters,
				submissionStatus,
				tags,
				note,
				additionalMetadata: JSON.stringify(additionalMetadata),
			});
			if (data && submit)
			{
				submit?.(data);
			}
			return data;
		}
		catch (error)
		{
			captureException(error);
		}
	}, [
		user,
		title,
		description,
		astrobinLink,
		equipmentProfile,
		filters,
		submit,
		submissionStatus,
		tags,
		note,
		additionalMetadata,
	]);

	useEffect(() =>
	{
		if (mode === "add" || !id) return;

		(async () =>
		{
			try
			{
				const {
					title,
					description,
					astrobinLink,
					image,
					moderation_report,
					resource_metadata,
					posted_by,
				} = await getPostById(id);

				if (posted_by?._id && profile && posted_by?._id === profile?._id)
				{
					setIsOwner(true);
				}

				setOwner(posted_by.full_name);
				setTitle(title);
				setDescription(description);
				setAstrobinLink(astrobinLink);
				const equipmentProfile = get(image, "metadata.equipment_profile", null);
				setEquipmentProfile(equipmentProfile);
				const submissionStatus = get(moderation_report, "status", null);
				const tags = get(resource_metadata, "tags", []);
				const note = get(resource_metadata, "note", null);
				setSubmissionStatus(submissionStatus);
				setTags(tags);
				setNote(note);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [mode, id]);

	return (
		<UploadFormContext.Provider
			value={{
				description,
				astrobinLink,
				equipmentProfile,
				filters,
				image,
				observatory,
				setDescription,
				setAstrobinLink,
				setEquipmentProfile,
				setFilters,
				setImage,
				setObservatory,
				setTitle,
				title,
				uploadPost,
				mode,
				updatePost,
				additionalMetadata,
				setAdditionalMetadata,
				submissionStatus,
				setSubmissionStatus,
				tags,
				setTags,
				note,
				setNote,
				isOwner,
				owner,
			}}
		>
			{children}
		</UploadFormContext.Provider>
	);
};

export default UploadFormContextProvider;
