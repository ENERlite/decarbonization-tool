import React from "react";
import { FontLoader } from "./theme.jsx";
import { useRoute } from "./router.js";
import MainTool from "./MainTool.jsx";
import Admin from "./Admin.jsx";

export default function App() {
  const route = useRoute();
  return (
    <>
      <FontLoader />
      {route === "admin" ? <Admin /> : <MainTool />}
    </>
  );
}
