import cloudinary from "../config/cloudinary";

export interface UploadedImage {
    url: string;
    publicId: string;
}

export const uploadBuffer = (
    buffer: Buffer,
    folder: string
): Promise<UploadedImage> =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error || !result) return reject(error);
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });

export const deleteImage = async (publicId: string) => {
    await cloudinary.uploader.destroy(publicId);
};

export const deleteImages = async (images: UploadedImage[]) => {
    await Promise.all(images.map((img) => deleteImage(img.publicId)));
};