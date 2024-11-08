import { InternalServerErrorException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import * as sharp from "sharp";
import { whitelist } from "validator";

export default async function handleFile(file: Express.Multer.File, folder : string) {
    try {
        const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads', folder);
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        // Sanitize the file name
        const sanitizedFileName = whitelist(file.originalname, 'a-zA-Z0-9_.-');
        const fileNameWithoutExt = path.basename(sanitizedFileName, path.extname(sanitizedFileName));
        let imgPath = path.join(uploadsDir, `${fileNameWithoutExt}.webp`);

        // Check if file already exists and generate a unique filename if it does
        let counter = 1;
        while (fs.existsSync(imgPath)) {
            imgPath = path.join(uploadsDir, `${fileNameWithoutExt}-${counter}.webp`);
            counter++;
        }

        // Convert the image to WebP format
        const webpBuffer = await sharp(file.buffer).webp().toBuffer();
        fs.writeFileSync(imgPath, webpBuffer);

        return path.basename(imgPath);
    } catch (err) {
        console.log(err);
        throw new InternalServerErrorException("Error When Handling Upload File");
    }
}