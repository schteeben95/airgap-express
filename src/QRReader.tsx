import { useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";

import QrCodeScanner from "./QrCodeScanner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

const DELIMITER = " =!= ";
const SESSION_STORAGE_KEY = "qr-scan-data";

const QRReader = () => {
  const [currentScan, setCurrentScan] = useState<string>("");

  const [finishedScanning, setFinishedScanning] = useState<Boolean>(false);

  const [readCurrentIndex, setReadCurrentIndex] = useState<number>(0);
  const [readTotalBlocks, setReadTotalBlocks] = useState<number>(0);

  const assembleAndDownloadData = () => {
    let base64Data = "";
    for (let i = 1; i <= readTotalBlocks; i++) {
      base64Data += sessionStorage.getItem(`${SESSION_STORAGE_KEY}-${i}`);
    }
    const byteChars = atob(base64Data.split("////")[1]);
    const byteArray = new Uint8Array(
      Array.from(byteChars, (char) => char.charCodeAt(0))
    );

    const blob = new Blob([byteArray]);
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = base64Data.split("////")[0];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  useEffect(() => {
    setCurrentScan("");
    setFinishedScanning(false);
    setReadCurrentIndex(0);
    setReadTotalBlocks(0);
    sessionStorage.clear();
  }, []);

  useEffect(() => {
    const currentIndex = currentScan.split(DELIMITER)[1];
    const totalBlock = currentScan.split(DELIMITER)[2];
    const scanData = currentScan.split(DELIMITER)[3];

    if (readTotalBlocks > 0) {
      if (readTotalBlocks !== Number(totalBlock)) {
        console.error("Total block changed. Resetting...");
        setReadTotalBlocks(0);
        sessionStorage.clear();
        setFinishedScanning(false);
      }
    } else {
      setReadTotalBlocks(Number(totalBlock));
    }

    currentIndex &&
      sessionStorage.setItem(
        `${SESSION_STORAGE_KEY}-${currentIndex}`,
        scanData
      );

    currentIndex && setReadCurrentIndex(Number(currentIndex));

    if (sessionStorage.length >= readTotalBlocks && sessionStorage.length > 0) {
      let allBlocksPresent = true;

      for (let i = 1; i <= readTotalBlocks; i++) {
        if (!sessionStorage[`${SESSION_STORAGE_KEY}-${i}`]) {
          allBlocksPresent = false;
          break;
        }
      }

      setFinishedScanning(allBlocksPresent);
    } else {
      setFinishedScanning(false);
    }

    // console.log(`${currentIndex} out of ${totalBlock}`)
  }, [currentScan]);

  return (
    <>
      <QrCodeScanner
        onScanSuccess={(result: string) => setCurrentScan(result)}
      />
      {!finishedScanning && (
        <Container
          className="d-flex justify-content-center align-items-start"
          style={{
            maxHeight: "40vh",
            overflowY: "auto",
            padding: "1rem",
            marginTop: "1rem",
            // backgroundColor: "rgba(255, 255, 255, 0.6)", // Optional, for clarity
            borderRadius: "1rem",
          }}
        >
          <div className="w-100 d-flex flex-wrap justify-content-center">
            {Array.from({ length: readTotalBlocks }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "inline-block",
                  padding: "1px", // Border thickness
                  borderRadius: "4px", // Optional: rounded corners
                  background:
                    i + 1 === readCurrentIndex
                      ? "linear-gradient(45deg, #007bff, #6a11cb)"
                      : "none",
                  margin: "1px",
                }}
              >
                <div
                  style={{
                    width: "15px",
                    height: "15px",
                    backgroundColor:
                      `${SESSION_STORAGE_KEY}-${i + 1}` in sessionStorage
                        ? "#007bff"
                        : "#007b00",
                    borderRadius: "2px", // Optional: match outer radius
                  }}
                />
              </div>
            ))}
          </div>
        </Container>
      )}
      {finishedScanning && (
        <div className="d-flex justify-content-center mt-4">
          <Button
            className="d-flex align-items-center gap-2 px-4 py-3 fs-5 fw-bold shadow"
            onClick={assembleAndDownloadData}
          >
            <FontAwesomeIcon icon={faDownload} />
            Download
          </Button>
        </div>
      )}
    </>
  );
};

export default QRReader;
