import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { API, Storage } from "aws-amplify";
import {
  Card,
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
  ToggleButton,
  CheckboxField,

} from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
  updateNote as updateNoteMutation
} from "./graphql/mutations";
Storage.configure({ level: 'private' });

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);
  const [isOpen, setIsOpen] = useState({});

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    try {
      await Promise.all(
        notesFromAPI.map(async (note) => {
          if (note.image) {
            const url = await Storage.get(note.name);
            note.image = url;
          }
          return note;
        })
      );
    } catch (e) {
      console.log(e)
    }
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
      completionDate: form.get("completionDate"),
      status: "InProgress"
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  async function toggleOpen(note) {
    setIsOpen({
      ...isOpen,
      [note.id]: !isOpen[note.id],
    });
    const newNote = {
      id: note.id,
      status: "Completed"
    }
    newNote.status = "Completed"
    await API.graphql({
      query: updateNoteMutation,
      variables: { input: newNote },
    });
    fetchNotes();
  };

  return (
    <View className="App">
      <Heading level={1}>PersonalNotesApp</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <Flex direction="column" alignContent="flex-start">
            <TextField
              name="name"
              placeholder="Note Name"
              label="Note Name"
              labelHidden
              variation="quiet"
              required
            />
            <TextField
              name="description"
              placeholder="Note Description"
              label="Note Description"
              labelHidden
              variation="quiet"
              required
            />
            <TextField
              name="completionDate" label="CompleteAt" labelHidden type="date"
              variation="quiet" />
            <CheckboxField
              name="addReminder"
              label="addReminder"
              as="input"
              type="checkbox"
              style={{ alignSelf: "end" }}
            />
            <View
              name="image"
              as="input"
              type="file"
              label="addFiles"
              style={{ alignSelf: "end" }}
            />
            <Button type="submit" variation="primary">
              Create Note
            </Button>
          </Flex>

        </Flex>
      </View>
      <Heading level={
        3}>NoteList</Heading>
      <View margin="3rem 0">

        {notes.map((note) => (
          <Card>
            <Flex
              key={note.id || note.name}
              direction="row"
              justifyContent="center"
              alignItems="flex-strat"
            >
              {note.image && (
                <Image
                  src={note.image}
                  alt={`visual aid for ${notes.name}`}
                  style={{ width: 200, height: 200 }}
                />
              )}
              <Flex
                direction="column" alignItems="flex-start">
                <Text as="strong" fontWeight={700}>
                  {note.name}
                </Text>
                <Text as="span">{note.description}</Text>
                <Text as="span">{note.status}</Text>
                <Text as="span">{note.completionDate}</Text>

                <Button variation="link" onClick={() => deleteNote(note)}>
                  Delete note
                </Button>
                <ToggleButton size="small" onClick={() => toggleOpen(note)} >Complete Task</ToggleButton>
              </Flex>
            </Flex>
          </Card>
        ))}

      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);