import * as multer from 'multer';
import * as fs from 'fs';

const accepted_extensions = ['jpg', 'jpeg', 'png', 'heic', 'JPG', 'JPEG', 'PNG', 'HEIC'];

// Enum to specify image type
export enum ImageType {"ORIGINAL"="original", "COMPRESSED"="compressed", "MINIATURE"="miniature"}

export function getStorage(folder: string, filePrefix:string) {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, folder)
        },
        filename: function (req, file, cb) {
          let ext = file.originalname.split('.').pop().toLowerCase();
          cb(null, filePrefix + '-' + Date.now() + "." + ext)
        }
      })
    return storage
}

export function uploadFile(storage, req, res, callback){
  multer({
      storage: storage,
      limits: {
        fileSize: 5 * 1024 * 1024,
        file: 1,
      },
      fileFilter: (req, file, cb) => {
        // if the file extension is in our accepted list
        if (accepted_extensions.some(ext => file.originalname.endsWith("." + ext))) {
          return cb(null, true);
        }
    
        // otherwise, return error
        return cb({ message: 'Only ' + accepted_extensions.join(", ") + ' files are allowed!' })
      }
  }).single('image')(req, res, callback)
}

export function processFormDataNoFile(req, res, callback) {
  multer().none()(req, res, callback);
}

export function removeFile(path){
  if (path) {
    try {
    fs.unlinkSync(path);
    } catch (error) {
      console.error("Could not remove file: ", path)
      console.error(error)
    }
  }
};

export function removeAllFiles(originalPath) {
  if (originalPath) {
    removeFile(originalPath);
    removeFile(originalPath.replace("original", "compressed"));
    removeFile(originalPath.replace("original", "miniature"));
  }
}

export function getDataUrl(imageUrl, imageType?: ImageType) {
  if(imageUrl){
    if (imageType) {
      imageUrl = imageUrl.replace(ImageType.ORIGINAL, imageType);
    }
    let encoding = 'base64';
    let [mimeType, imagePath] = imageUrl.split(':');
    let imageString = fs.readFileSync(imagePath, encoding);
    return "data:" + mimeType + ";"+encoding+"," + imageString;
  }
  return imageUrl;
}

export async function compressAndResizeImage(filePath) {
  // This does not work properly for png, the image size is larger in the resized and compressed version.
  compressImage(filePath, 50, "public/compressed")
    .then(compressedPath => {
      const outputPath = filePath.replace(ImageType.ORIGINAL, ImageType.MINIATURE)
      resizeImage(compressedPath, outputPath, 200);
    })
    .catch(error => {
      console.error("Error during compression and resizing of image: ", error);
    });  
}

export async function resizeAndCompress(filePath, compressQuality) {
  const outputPath = filePath.replace(ImageType.ORIGINAL, ImageType.MINIATURE)
  resizeImage(filePath, outputPath, 200).then(data => {
    compressImage(outputPath, 60, "public/"+ImageType.MINIATURE)
  });
  // Need to wait here, otherwhise the file won't have time to be saved before trying to get fetched.
  return await compressImage(filePath, compressQuality, "public/"+ImageType.COMPRESSED)

}

export async function compressImage(filePath, quality, outputPath?) {
  const imagemin = require('imagemin');
  const imageminMozjpeg = require('imagemin-mozjpeg');
  const imageminPngquant = require('imagemin-pngquant');
  
  const regEx = new RegExp("\\\\", "g"); // Need four \ to escape two \
  const newFilePath = filePath.replace(regEx, "/");

  const imageminConfig = {};
  if (outputPath) {
    imageminConfig["destination"] = outputPath
  }

  imageminConfig["plugins"] =  [
      imageminMozjpeg({quality: quality}),
      imageminPngquant({
        quality: [0.5, 0.6]
      })
    ]

  return imagemin([newFilePath], imageminConfig).then(files => {
    if (outputPath) {
      return outputPath;
    }
    return files[0].data;
  });

}

export async function resizeImage(filePath, outputPath, size) {
  const sharp = require('sharp');
  return sharp(filePath)
    .resize(size)
    .toFile(outputPath)
    .then(data => {
      return outputPath;
    })
    .catch(error => {
      console.error("Error while resizing image: ", error);
    })
}
