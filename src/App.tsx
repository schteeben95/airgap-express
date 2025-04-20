import {
  faArrowLeft,
  faDownload,
  faInfoCircle,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./App.css";

import QREncoder from "./QREncoder";
import QRReader from "./QRReader";

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(true);

  const [shadow, setShadow] = useState(
    "0px 8px 32px 0 rgba(31, 38, 135, 0.37)"
  );

  const [action, setAction] = useState<"Neither" | "Send" | "Receive">(
    "Neither"
  );

  useEffect(() => {
    // Track mouse movement across the entire page
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX: mouseX, clientY: mouseY } = e;
      const offsetX = mouseX - window.innerWidth / 2;
      const offsetY = mouseY - window.innerHeight / 2;

      const shadowX = offsetX / 50; // Adjust sensitivity to make the shadow more subtle
      const shadowY = offsetY / 50; // Adjust sensitivity to make the shadow more subtle

      setShadow(`${shadowX}px ${shadowY}px 40px rgba(31, 38, 135, 0.2)`); // More subtle shadow
    };

    // Add the mousemove event listener
    document.addEventListener("mousemove", handleMouseMove);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="page-background d-flex justify-content-center align-items-center vh-100">
      <SpeedInsights />
      <div
        className="content-box p-4"
        style={{ boxShadow: shadow, position: "relative" }}
      >
        <Button
          className="position-absolute top-0 end-0 m-3 btn-light rounded-circle d-flex align-items-center justify-content-center shadow"
          style={{ width: "32px", height: "32px", padding: 0 }}
          onClick={() => setShowDisclaimer(true)}
          aria-label="Show disclaimer"
        >
          <FontAwesomeIcon icon={faInfoCircle} />
        </Button>
        <Modal
          show={showDisclaimer}
          onHide={() => setShowDisclaimer(false)}
          // centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Disclaimer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              This application runs entirely client-side. This means no data is
              uploaded back to where the application is hosted.
            </p>
            <p>
              Having said that, the site owner does not take responsibility for
              anything illegal or stupid that you do with this application.
            </p>
          </Modal.Body>
        </Modal>
        {action !== "Neither" && (
          <Button
            className="back-button position-absolute top-0 start-0 p-2"
            onClick={() => setAction("Neither")}
          >
            <FontAwesomeIcon icon={faArrowLeft} size="lg" />
          </Button>
        )}

        <h4 className="mb-3 text-center">AirGap Express</h4>

        {action === "Neither" && (
          <div className="d-flex justify-content-center gap-3 mt-4">
            <Button
              className="glass-button d-flex flex-column align-items-center px-4 py-3 rounded-3"
              onClick={() => setAction("Send")}
            >
              <FontAwesomeIcon icon={faUpload} className="icon mb-2" />
              <span>Send Data</span>
            </Button>

            <Button
              className="glass-button d-flex flex-column align-items-center px-4 py-3 rounded-3"
              onClick={() => setAction("Receive")}
            >
              <FontAwesomeIcon icon={faDownload} className="icon mb-2" />
              <span>Receive Data</span>
            </Button>
          </div>
        )}
        {action === "Send" && <QREncoder />}
        {action === "Receive" && <QRReader />}
      </div>
    </div>
  );
}

export default App;
