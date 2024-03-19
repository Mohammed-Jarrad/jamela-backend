import multer from 'multer'

export const fileValidation = {
    image: ['image/png', 'image/jpeg', 'image/webp'],
    pdf: ['application/pdf'],
}

function fileUpload(customValidation = []) {
    return multer({
        storage: multer.diskStorage({}),
        fileFilter: (req, file, cb) => {
            if (customValidation.includes(file.mimetype)) {
                cb(null, true)
            } else {
                cb('invalid format', false)
            }
        },
        limits: { fileSize: 1024 * 1024 * 20 }, // 20MB
    })
}

export default fileUpload
