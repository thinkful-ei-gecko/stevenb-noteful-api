CREATE TABLE notes (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  note_name TEXT NOT NULL,
  note_content TEXT NOT NULL,
  folder_id INTEGER 
    REFERENCES folders(id) NOT NULL,
  date_modified TIMESTAMP DEFAULT now() ON DELETE CASCADE NOT NULL
);