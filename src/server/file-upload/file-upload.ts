import Storage from '@google-cloud/storage';

const storage = new Storage({
    projectId: process?.env?.GCP_PROJECT_ID
})

export interface FileResults extends File {
    [key: string]: any
}

export const uploadFileTestBucket = async (filePath: string): Promise<FileResults> => {
    const timestamp = new Date()?.getMilliseconds;
    const options = {
        destination: `image-${timestamp}`,
    }

    const result = await storage?.bucket("banana-shop-bucket-test")?.upload(filePath, options);

    return  { ...result } as unknown as FileResults;
}

