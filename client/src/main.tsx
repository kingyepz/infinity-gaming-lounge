import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/global.css"; // Added global stylesheet import

createRoot(document.getElementById("root")!).render(<App />);