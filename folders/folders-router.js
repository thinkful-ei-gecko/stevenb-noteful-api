const path = require('path');
const express = require('express');
const xss = require('xss');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router();

const serializeFolders = folder => ({
  folder_name: xss(folder.folder_name),
  date_added: folder.date_added
});

foldersRouter
  .route('/')
  .get(( req, res, next ) => {
    FoldersService.getAllFolders(req.app.get('db'))
      .then( folders => res.json(folders.map(serializeFolders)))
      .catch(next);
  })
  .post(( req, res, next ) => {
    const { folder_name, date_added } = req.body;
    const newFolder = { folder_name, date_added };

    for (const [key, value] in Object.entries(newFolder)) {
      // eslint-disable-next-line eqeqeq
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing ${key} in request body.` }
        });
      }
    }

    FoldersService.insertFolder(
      req.app.get('db'),
      newFolder
    )
      .then( folder => {
        res.status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(serializeFolders(folder));
      })
      .catch(next)
  });

