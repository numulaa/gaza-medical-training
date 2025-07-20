import { useState } from "react";
import { uploadToCloudinary } from "../lib/cloudinary";

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imgCloudUrl, setImgCloudUrl] = useState<string | "">("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    try {
      const data = await uploadToCloudinary(file);
      setImgCloudUrl(data);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {previewUrl && <img src={previewUrl} alt="Preview" width="200" />}
      <button onClick={handleSubmit}>Upload</button>
      <p>URL: {imgCloudUrl}</p>
    </div>
  );
}
