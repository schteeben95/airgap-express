import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code'
import { Button, Container, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Html5QrcodeScanner, Html5QrcodeResult, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
import { faArrowLeft, faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';


const LMAX = 2953
const MMAX = 2331
const QMAX = 1663
const HMAX = 1273
const CAMMAX = 1000

const SIZE_LIMITS = {
  "L": LMAX,
  "M": MMAX,
  "Q": QMAX,
  "H": HMAX
}

const ERROR_CORRECTION_LEVEL = "L"
const BLOCK_SIZE = Math.min(SIZE_LIMITS[ERROR_CORRECTION_LEVEL], CAMMAX)
const DELIMITER = " =!= "
const SESSION_STORAGE_KEY = "qr-scan-data"

interface QrcodeScannerProps {
  onScanSuccess: (decodedText: string) => void
}

const QrCodeScanner = ({ onScanSuccess }: QrcodeScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Configuration for the scanner
    const config = {
      fps: 30,
      // qrbox: { width: 500, height: 500 },
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] as Html5QrcodeSupportedFormats[],
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    };

    // Initialize the scanner
    const scanner = new Html5QrcodeScanner('qr-reader', config, false);
    scannerRef.current = scanner;

    const handleScanSuccess = (decodedText: string, result: Html5QrcodeResult) => {
      onScanSuccess(decodedText)
      // console.log(`${decodedText.split(" =!= ")[1]} out of ${decodedText.split(" =!= ")[2]}`)
    };

    const onScanFailure = (error: string) => {

    };

    scanner.render(handleScanSuccess, onScanFailure);

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner.", error);
        });
      }
    };
  }, []);

  return (
    <div style={{ width: '500px', margin: '0 auto' }}>
      <div id="qr-reader" style={{ width: '100%' }}></div>
    </div>
  );
};

const QREncoder = () => {

  const [encodedRep, setEncodedRep] = useState<string>("")

  const [currentBlock, setCurrentBlock] = useState<string>("");
  const [blockIndex, setBlockIndex] = useState<number>(0);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  useEffect(() => {
    setTimeout(() => {
      if (!encodedRep || encodedRep === "") {
        return
      } else if (blockIndex > encodedRep.length / BLOCK_SIZE) {
        setBlockIndex(0)
      } else {
        setCurrentBlock(` =!= ${blockIndex + 1} =!= ${Math.ceil(encodedRep.length / BLOCK_SIZE)} =!= ${encodedRep.slice(blockIndex * BLOCK_SIZE, blockIndex * BLOCK_SIZE + BLOCK_SIZE)}`)
        setBlockIndex(blockIndex + 1)
      }
    }, 130)
  }, [blockIndex, currentBlock, encodedRep])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return;

    try {
      const encoded = await convertFileToBase64(file);
      setEncodedRep(`${file.name}////${encoded}`)
    } catch (error) {
      console.error("Error converting file to base64.", error)
    }
  }

  return (
    <Form.Group controlId="formFileLg" className="mb-3">
      <Form.Control type="file" size="lg" onChange={handleFileChange} />
      {encodedRep && (
        <div>
          <QRCode level={ERROR_CORRECTION_LEVEL} style={{ width: "100%" }} size={512} value={currentBlock} />
          <p>{blockIndex} out of {Math.floor(encodedRep.length / BLOCK_SIZE) + 1}</p>
        </div>
      )}
    </Form.Group>
  )
}

const QRReader = () => {
  const [currentScan, setCurrentScan] = useState<string>("");

  const [finishedScanning, setFinishedScanning] = useState<Boolean>(false);

  const [readTotalBlocks, setReadTotalBlocks] = useState<number>(0);

  const assembleAndDownloadData = () => {
    let base64Data = ""
    for (let i = 1; i <= readTotalBlocks; i++) {
      base64Data += sessionStorage.getItem(`${SESSION_STORAGE_KEY}-${i}`)
    }
    const byteChars = atob(base64Data.split("////")[1])
    const byteArray = new Uint8Array(Array.from(byteChars, char => char.charCodeAt(0)))

    const blob = new Blob([byteArray])
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = blobUrl
    link.download = base64Data.split("////")[0]
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  }

  useEffect(() => {
    const currentIndex = currentScan.split(DELIMITER)[1]
    const totalBlock = currentScan.split(DELIMITER)[2]
    const scanData = currentScan.split(DELIMITER)[3]

    if (readTotalBlocks > 0) {
      if (readTotalBlocks !== Number(totalBlock)) {
        console.error("Total block changed. Resetting...")
        setReadTotalBlocks(0)
        sessionStorage.clear()
        setFinishedScanning(false)
      }
    } else {
      setReadTotalBlocks(Number(totalBlock))
    }

    sessionStorage.setItem(`${SESSION_STORAGE_KEY}-${currentIndex}`, scanData)

    if (sessionStorage.length >= readTotalBlocks) {
      let allBlocksPresent = true;

      for (let i = 1; i <= readTotalBlocks; i++) {
        if (!sessionStorage[`${SESSION_STORAGE_KEY}-${i}`]) {
          allBlocksPresent = false;
          break;
        }
      }

      setFinishedScanning(allBlocksPresent);
    } else {
      setFinishedScanning(false)
    }

    // console.log(`${currentIndex} out of ${totalBlock}`)
  }, [currentScan])

  return (
    <>
      <QrCodeScanner onScanSuccess={(result: string) => setCurrentScan(result)} />
      <Container
        fluid
        className="d-flex justify-content-center align-items-center"
      >
        <div
          className='d-flex justify-content-center'
          style={{
            flexWrap: "wrap",
          }}
        >
          {Array.from({ length: readTotalBlocks }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "15px",
                height: "15px",
                backgroundColor: `${SESSION_STORAGE_KEY}-${i + 1}` in sessionStorage ? "#007bff" : "#007b00",
                margin: "1px",
              }}
            />
          ))}
        </div>
      </Container>
      {finishedScanning && <Button onClick={assembleAndDownloadData}>Download</Button>}
    </>
  )
}

function App() {
  const [shadow, setShadow] = useState('0px 8px 32px 0 rgba(31, 38, 135, 0.37)');

  const [action, setAction] = useState<"Neither" | "Send" | "Receive">("Neither");

  useEffect(() => {
    // Track mouse movement across the entire page
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX: mouseX, clientY: mouseY } = e;
      const offsetX = mouseX - window.innerWidth / 2;
      const offsetY = mouseY - window.innerHeight / 2;

      const shadowX = offsetX / 50;  // Adjust sensitivity to make the shadow more subtle
      const shadowY = offsetY / 50;  // Adjust sensitivity to make the shadow more subtle

      setShadow(`${shadowX}px ${shadowY}px 40px rgba(31, 38, 135, 0.2)`);  // More subtle shadow
    };

    // Add the mousemove event listener
    document.addEventListener('mousemove', handleMouseMove);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    // <div className="App">
    //   Hello
    //   {/* <QREncoder />
    //   <QRReader /> */}
    // {/* </div> */}
    <div className="page-background d-flex justify-content-center align-items-center vh-100">
      <div className="content-box p-4" style={{ boxShadow: shadow, position: 'relative' }}>
        {/* Back Button */}
        {action !== "Neither" &&
          <Button
            className="back-button position-absolute top-0 start-0 p-2"
            onClick={() => setAction("Neither")}
          >
            <FontAwesomeIcon icon={faArrowLeft} size="lg" />
          </Button>}

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
