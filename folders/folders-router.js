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
    const { folder_name } = req.body;
    const newFolder = { folder_name };

    if (!folder_name) {
      return res.status(400).json({
        error: { message: 'Missing \'folder_name\' in request body.' }
      });
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
      .catch(next);
  });

foldersRouter
  .route('/:id')
  .all(( req, res, next ) => {
    FoldersService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then( folder => {
        if (!folder) {
          return res.status(404).json({
            error: { message: 'Folder not found'}
          });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get(( req, res ) => {
    res.json(serializeFolders(res.folder));
  })
  .delete(( req, res, next ) => {
    FoldersService.deleteFolder(
      req.app.get('db'),
      req.params.id
    )
      .then( () => res.status(204).end())
      .catch(next);
  })
  .patch((req, res, next ) => {
    const { folder_name } = req.body;
    const newFolderFields = { folder_name };

    if (!folder_name) {
      return res.status(400).json({
        error: { message: 'Request body must contain a folder_name'}
      });
    }

    FoldersService.updateFolder(
      req.app.get('db'),
      req.params.id,
      newFolderFields
    )
      .then( () => res.status(204).end() )
      .catch(next);
  });

module.exports = foldersRouter;