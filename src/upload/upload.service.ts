import { BadRequestException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { fileTypeFromBuffer } from 'file-type'

@Injectable()
export class UploadService {
    private drive;

    private readonly ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID;
    keyJson = JSON.parse(process.env.SA_KEY_JSON as string);

    constructor() {
        const auth = new google.auth.GoogleAuth({
            credentials: this.keyJson,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        this.drive = google.drive({ version: 'v3', auth });
    }

    private async createFolderIfNotExists(name: string, parentId?: string): Promise<string> {
        const query =
            `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed = false` +
            (parentId ? ` and '${parentId}' in parents` : '');

        const res = await this.drive.files.list({
            q: query,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        if (res.data.files.length > 0) return res.data.files[0].id;

        const folder = await this.drive.files.create({
            requestBody: {
                name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentId ? [parentId] : [],
            },
            fields: 'id',
            supportsAllDrives: true,         
        });

        return folder.data.id;
    }

    async uploadFiles(
        files: Express.Multer.File[],
        eventData: { type: string; date: string; city: string; clubCity: string },
    ) {

const allowedPrefixes=['image/', 'video/'];
for (const file of files) {
    const type = await fileTypeFromBuffer(file.buffer);
    const mimeToCheck = type?.mime || file.mimetype;

    const isAllowed = allowedPrefixes.some(prefix => mimeToCheck.startsWith(prefix));
    if(!isAllowed) {
        throw new BadRequestException(`Niedozwolony typ pliku: ${file.originalname}`)
    }
}

        const dateCityName = `${eventData.date}_${eventData.city}`;

        const eventsFolderId = await this.createFolderIfNotExists("Events", this.ROOT_FOLDER_ID)
        const typeFolderId = await this.createFolderIfNotExists(eventData.type, eventsFolderId);
        const dateCityFolderId = await this.createFolderIfNotExists(dateCityName, typeFolderId);
        const clubFolderId = await this.createFolderIfNotExists(eventData.clubCity, dateCityFolderId);

        const uploadedFiles: { id: string; name: string }[] = [];

        for (const file of files) {
            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);

            const res = await this.drive.files.create({
                requestBody: {
                    name: file.originalname,
                    parents: [clubFolderId],
                },
                media: {
                    mimeType: file.mimetype,
                    body: bufferStream,
                },
                fields: 'id, name',
                supportsAllDrives: true,   
            });

            uploadedFiles.push(res.data);
        }

        return {
            message: 'Foldery i pliki utworzone pomyślnie',
            folders: {
                typeFolderId,
                dateCityFolderId,
                clubFolderId,
            },
            files: uploadedFiles,
        };
    }
}
