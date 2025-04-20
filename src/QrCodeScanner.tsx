import {
    Html5QrcodeResult,
    Html5QrcodeScanner,
    Html5QrcodeScanType,
    Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { useEffect, useRef } from "react";

interface QrcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
}

const QrCodeScanner = ({ onScanSuccess }: QrcodeScannerProps) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Configuration for the scanner
        const config = {
            fps: 30,
            // qrbox: { width: 500, height: 500 },
            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
            ] as Html5QrcodeSupportedFormats[],
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        };

        // Initialize the scanner
        const scanner = new Html5QrcodeScanner("qr-reader", config, false);
        scannerRef.current = scanner;

        const handleScanSuccess = (
            decodedText: string,
            result: Html5QrcodeResult
        ) => {
            onScanSuccess(decodedText);
            // console.log(`${decodedText.split(" =!= ")[1]} out of ${decodedText.split(" =!= ")[2]}`)
        };

        const onScanFailure = (error: string) => { };

        scanner.render(handleScanSuccess, onScanFailure);

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error) => {
                    console.error("Failed to clear html5QrcodeScanner.", error);
                });
            }
        };
    }, []);

    return (
        <div>
            <div id="qr-reader"></div>
        </div>
    );
};

export default QrCodeScanner;
