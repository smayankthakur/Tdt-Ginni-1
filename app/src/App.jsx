import React, { useState } from "react";
import Onboarding from "./components/Onboarding";
import Chat from "./components/Chat";
import { getName, setName as persistName, getDeviceId } from "./lib/rateLimit";

export default function App() {
  getDeviceId(); // ensure a device id exists
  const [name, setName] = useState(getName());

  const enter = (n) => {
    persistName(n);
    setName(n);
  };

  const changeIdentity = () => {
    setName("");
  };

  if (!name) {
    return <Onboarding onEnter={enter} initialName={getName()} />;
  }

  return <Chat key={name} name={name} onChangeIdentity={changeIdentity} />;
}
