import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

export default function deleteFile(fileName: string, folder : string) {
    try {
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads', folder);
        const filePath = path.join(uploadsDir, fileName);

        if (!fs.existsSync(filePath)) {
            return
        }

        fs.unlinkSync(filePath);
    } catch (err) {
        console.log(err);
    }
}