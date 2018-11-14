const allowed = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif'
];

module.exports.profileUploadFileFilter = (req, file, cb) => {
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
