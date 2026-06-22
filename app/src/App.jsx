import React, { useState } from "react";
import Onboarding from "./components/Onboarding";
// Locked "blend" reading flow (topic → draw one card → grounded reveal).
// The old free-text/spread chat (Chat.jsx, Composer.jsx, readingBuilder.js,
// ginniClient.js, demoReading.js) was removed in this build — restore from git
// history if ever needed.
import ReadingFlow from "./components/ReadingFlow";
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

  return <ReadingFlow key={name} name={name} onChangeIdentity={changeIdentity} />;
}
