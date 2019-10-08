const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router();

const serializeNotes = note => ({
  id: note.id,
  note_name: xss(note.note_name),
  note_content: xss(note.note_content),
  folder_id: note.folder_id,
  date_added: note.date_modified
});

notesRouter
  .route('/')
  .get(( req, res, next ) => {
    NotesService.getAllNotes(req.app.get('db'))
      .then( notes => res.json(notes.map(serializeNotes)))
      .catch(next);
  })
  .post(( req, res, next ) => {
    const { note_name, note_content, folder_id } = req.body;
    const newNote = { note_name, note_content, folder_id };

    for (const [key, value] of Object.entries(newNote)) {
      if (!value) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body.`}
        });
      }
    }

    NotesService.insertNote(req.app.get('db'), newNote)
      .then( note => {
        res.status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(serializeNotes(note));
      })
      .catch(next);
  });

notesRouter
  .route('/:id')
  .all(( req, res, next ) => {
    NotesService.getById(req.app.get('db'), req.params.id)
      .then( note => {
        if (!note) {
          return res.status(400).json({
            error: { message: 'Note not found.'}
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get(( req, res ) => {
    res.json(serializeNotes(res.note));
  })
  .delete(( req, res, next ) => {
    NotesService.deleteNote(req.app.get('db'), req.params.id)
      .then( () => res.status(204).end())
      .catch(next);
  })
  .patch(( req, res, next ) => {
    const { note_name, note_content } = req.body;
    const newNoteFields = { note_name, note_content };

    const numberOfValues = Object.values(newNoteFields).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: { message : 'Request body must contain either \'note_name\' or \' note_content\''}
      });
    }

    NotesService.updateNote(req.app.get('db'), req.params.id, newNoteFields)
      .then( () => res.status(204).end())
      .catch(next);
  });

module.exports = notesRouter;