import * as fs from 'fs';
import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';

dotenv.config();

const {
  AZURE_STORAGE_ACCOUNT_NAME = '',
  AZURE_STORAGE_ACCOUNT_KEY = '',
  AZURE_STORAGE_CONTAINER_NAME = '',
  BLOB_LINKS_FILE_PATH = '',
} = process.env;

if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY || !AZURE_STORAGE_CONTAINER_NAME || !BLOB_LINKS_FILE_PATH) {
  console.error('Certifique-se de configurar corretamente as variáveis de ambiente.');
  process.exit(1);
}

async function deleteUnusedBlobs(blobServiceClient: BlobServiceClient, containerName: string, links: string[]) {
	const containerClient = blobServiceClient.getContainerClient(containerName);

	for await (const blob of containerClient.listBlobsFlat()) {
		console.log(`Blob encontrado: ${blob.name}`);

		const blobLink = containerClient.getBlobClient(blob.name).url;
	
		if (!links.includes(blobLink)) {
			console.log(`Deletando blob: ${blobLink}`);
			await containerClient.getBlobClient(blob.name).delete();
		}
	}
}

async function main() {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    `DefaultEndpointsProtocol=https;AccountName=${AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`
  );

  const links = fs.readFileSync(BLOB_LINKS_FILE_PATH, 'utf-8').split('\n').filter(Boolean);
	console.log('Links a serem mantidos: ', links);
  await deleteUnusedBlobs(blobServiceClient, AZURE_STORAGE_CONTAINER_NAME, links);
}

main().catch((error) => console.error(error));
