const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router();

const serializeNotes = note => ({
  note_name: xss(note.note_name),
  note_content: xss(note.note_content),
  folder_id: note.folder_id
});

notesRouter
  .route('/')
  .get(( req, res, next ) => {
    NotesService(req.app.get('db'))
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