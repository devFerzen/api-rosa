import multer from "multer";
import Datauri from "datauri";
import path from "path";


//Setting multer storage
const storage = multer.memoryStorage();
const multerUpload = multer({ storage }).single("image");
const dUri = new Datauri();

const dataUri = (req) =>
console.log('req')
console.dir(req);
  dUri.format(path.extname(req.file.originalname).toString(), req.file.buffer);
export { multerUpload, dataUri };
