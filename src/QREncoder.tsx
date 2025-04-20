import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import QRCode from "react-qr-code";

const LMAX = 2953;
const MMAX = 2331;
const QMAX = 1663;
const HMAX = 1273;
const CAMMAX = 1000;

const SIZE_LIMITS = {
    L: LMAX,
    M: MMAX,
    Q: QMAX,
    H: HMAX,
};

const ERROR_CORRECTION_LEVEL = "L";
const BLOCK_SIZE = Math.min(SIZE_LIMITS[ERROR_CORRECTION_LEVEL], CAMMAX);

const QREncoder = () => {
    const [encodedRep, setEncodedRep] = useState<string>("");

    const [currentBlock, setCurrentBlock] = useState<string>("");
    const [blockIndex, setBlockIndex] = useState<number>(0);

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(",")[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    useEffect(() => {
        setTimeout(() => {
            if (!encodedRep || encodedRep === "") {
                return;
            } else if (blockIndex > encodedRep.length / BLOCK_SIZE) {
                setBlockIndex(0);
            } else {
                setCurrentBlock(
                    ` =!= ${blockIndex + 1} =!= ${Math.ceil(
                        encodedRep.length / BLOCK_SIZE
                    )} =!= ${encodedRep.slice(
                        blockIndex * BLOCK_SIZE,
                        blockIndex * BLOCK_SIZE + BLOCK_SIZE
                    )}`
                );
                setBlockIndex(blockIndex + 1);
            }
        }, 130);
    }, [blockIndex, currentBlock, encodedRep]);

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const encoded = await convertFileToBase64(file);
            setEncodedRep(`${file.name}////${encoded}`);
        } catch (error) {
            console.error("Error converting file to base64.", error);
        }
    };

    return (
        <Form.Group controlId="formFileLg" className="mb-3">
            <Form.Control
                className="mb-3"
                type="file"
                size="lg"
                onChange={handleFileChange}
            />
            {encodedRep && (
                <div>
                    <div style={{ width: "100%" }}>
                        <QRCode
                            className="mb-2"
                            level={ERROR_CORRECTION_LEVEL}
                            style={{ width: "100%", height: "auto" }}
                            // size={512}
                            value={currentBlock}
                        />
                    </div>
                    <p
                        style={{
                            textAlign: "center",
                            color: "grey",
                        }}
                    >
                        {blockIndex} out of {Math.floor(encodedRep.length / BLOCK_SIZE) + 1}
                    </p>
                </div>
            )}
        </Form.Group>
    );
};

export default QREncoder;
