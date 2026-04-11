import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const JsonDb = {
    read: <T>(filename: string, defaultValue: T): T => {
        try {
            const filePath = path.join(DATA_DIR, filename);
            if (!fs.existsSync(filePath)) {
                return defaultValue;
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data) as T;
        } catch (error) {
            console.error(`Error reading ${filename}:`, error);
            return defaultValue;
        }
    },

    write: <T>(filename: string, data: T): void => {
        try {
            const filePath = path.join(DATA_DIR, filename);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error(`Error writing ${filename}:`, error);
        }
    }
};
