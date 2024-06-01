import axios from "axios";
import archiver, { Archiver } from "archiver";
import type { Readable, Writable } from "node:stream";
import path from "node:path";

const token = `Bearer ${process.env.TOKEN}`;

const accountId = process.env.ACCOUNT_ID;

export type ListImagesResponse = {
  result: Result;
};

export type Result = {
  images: Image[];
  continuation_token: null;
};

export type Image = {
  id: string;
  filename: string;
  uploaded: Date;
  requireSignedURLs: boolean;
  variants: string[];
};

const listImages = async () => {
  const response = await axios.get<ListImagesResponse>(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  return response.data;
};

const downloadImage = async (
  archiverInstance: Archiver,
  imageId: string,
  filename: string
) => {
  const imageUrl = `https://imagedelivery.net/DnKUqTjrmqfvonSskl9WBQ/${imageId}/raw`;

  const response = await axios.get(imageUrl, {
    headers: {
      Authorization: token,
    },
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    response.data.on("end", resolve);
    response.data.on("error", reject);
    archiverInstance.append(response.data, { name: filename });
  });
};

/**
 * Retrieves a list of images from an API, downloads them in batches, and archives them into a zip file.
 * Logs the progress and measures the time taken for the entire process.
 */
export const main = async (writable: Writable) => {
  // Retrieve the list of images
  const { result } = await listImages();

  console.log("Started Process...");

  // Initialize the archiver
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level.
  });
  archive.pipe(writable);
  archive.on("error", (err) => {
    throw err;
  });

  const totalItems = result.images.length;
  const batchElements = 50;

  // Download images in batches
  for (let index = 0; index < totalItems; index += batchElements) {
    const batchImages = result.images.slice(index, index + batchElements);

    console.log(`Index ${index + batchElements} of ${totalItems}`);
    await Promise.all(
      batchImages.map((img) => downloadImage(archive, img.id, img.filename))
    );
  }
  // // Finalize the archive
  archive.on("finish", () => {
    console.log("Finish");
    writable.end();
  });
  archive.on("progress", ({ entries }) => console.log(entries));
  await archive.finalize();
};
