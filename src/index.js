import { Amplify } from "aws-amplify";
import config from "./aws-exports";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Tabs } from "@aws-amplify/ui-react";
Amplify.configure(config);
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Tabs
      defaultValue={"Tab 1"}
      items={[
        { label: "Tab 1", value: "Tab 1", content: "Tab content #1" },
        { label: "Tab 2", value: "Tab 2", content: "Tab content #2" },
        { label: "Tab 3", value: "Tab 3", content: "Tab content #3" },
      ]}
    />
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
