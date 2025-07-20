import { Cloudinary } from "@cloudinary/url-gen";

export const cld = new Cloudinary({
	cloud: {
		cloudName: "dlwv8cnzb", // should probably be hidden idk
	},
});

export const uploadToCloudinary = async (file: File) => {
	const data = new FormData();
	data.append("file", file);
	data.append("upload_preset", "consultation_media");

	const res = await fetch(
		"https://api.cloudinary.com/v1_1/dlwv8cnzb/upload",
		{
			method: "POST",
			body: data,
		}
	);

	const result = await res.json();
	return result.secure_url; // or public_id, etc.
};
