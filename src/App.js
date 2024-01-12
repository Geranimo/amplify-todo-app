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
  TextField,
  View,
  withAuthenticator,
  ToggleButton,
  CheckboxField,
  Collection,
  Badge,
  Divider,
} from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
  updateNote as updateNoteMutation,
} from "./graphql/mutations";
Storage.configure({ level: "private" });

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);
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
      console.log(e);
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
      status: "InProgress",
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

  async function toggleStatus(note) {
    const currentNote = notes.filter((item) => item.id === note.id)[0];
    console.log("SelectedNote", currentNote);
    const newState =
      currentNote.status === "Completed" ? "InProgress" : "Completed";
    await API.graphql({
      query: updateNoteMutation,
      variables: {
        input: {
          id: note.id,
          status: newState,
        },
      },
    });
    fetchNotes();
  }

  return (
    <View className="App" marginTop={20}>
      <Button
        onClick={signOut}
        variation="primary"
        size="large"
        alignSelf="end"
      >
        Sign Out
      </Button>

      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="left">
          <Flex direction="column" alignContent="flex-start">
            <Heading level={2}>Add a Note</Heading>
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
              name="completionDate"
              label="CompleteAt"
              labelHidden
              type="date"
              variation="quiet"
            />
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
          <Flex direction="column" alignContent="flex-start">
            <Heading level={3}>You got things to do !</Heading>
            <Collection
              items={notes}
              type="list"
              direction="row"
              gap="20px"
              wrap="nowrap"
            >
              {(item, index) => (
                <Card
                  key={index}
                  borderRadius="medium"
                  maxWidth="20rem"
                  variation="outlined"
                >
                  <Image
                    src={item.image}
                    alt="You task would be awesome with an picture"
                    sizes="medium"
                  />
                  <View padding="xs">
                    <Flex>
                      <Badge
                        backgroundColor={
                          item.status === "Completed" ? "green.40" : "yellow.20"
                        }
                      >
                        {item.status}
                      </Badge>
                    </Flex>
                    <Divider padding="xs" />
                    <Heading padding="medium">{item.name}</Heading>
                    <ToggleButton
                      size="small"
                      onClick={() => toggleStatus(item)}
                    >
                      {item.status === "InProgress"
                        ? "Mark Complete"
                        : "ReOpen Task"}
                    </ToggleButton>
                    <Button
                      variation="link"
                      onClick={() => deleteNote(item)}
                      color="red.40"
                      size="small"
                      colorTheme=""
                    >
                      Delete note
                    </Button>
                  </View>
                </Card>
              )}
            </Collection>
          </Flex>
        </Flex>
      </View>
    </View>
  );
};

export default withAuthenticator(App);
