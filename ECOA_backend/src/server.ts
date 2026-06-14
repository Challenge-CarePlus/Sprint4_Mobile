import express from "express";
import cors from "cors";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";

import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as jpeg from "jpeg-js";

import authRouter from "./routes/authRouter";

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.use("/auth", authRouter);

app.get("/", (_req, res) => {
    res.json({
        message: "ECOA Backend rodando",
    });
});

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        websocket: "/exercise",
    });
});

type Landmark = {
    x: number;
    y: number;
    z?: number;
};

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

function removeBase64Prefix(base64: string) {
    if (base64.includes(",")) {
        return base64.split(",")[1];
    }

    return base64;
}

function decodeJpegToTensor(imageBase64: string) {
    const cleanBase64 = removeBase64Prefix(imageBase64);
    const imageBuffer = Buffer.from(cleanBase64, "base64");

    const decodedImage = jpeg.decode(imageBuffer, {
        useTArray: true,
    });

    const { width, height, data } = decodedImage;

    const rgb = new Uint8Array(width * height * 3);

    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
        rgb[j] = data[i];
        rgb[j + 1] = data[i + 1];
        rgb[j + 2] = data[i + 2];
    }

    const tensor = tf.tensor3d(rgb, [height, width, 3], "int32");

    return {
        tensor,
        width,
        height,
    };
}

function distance(a: Landmark, b: Landmark) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function calculateMouthOpen(landmarks: Landmark[]) {
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    const leftMouth = landmarks[78];
    const rightMouth = landmarks[308];

    if (!upperLip || !lowerLip || !leftMouth || !rightMouth) {
        return 0;
    }

    const vertical = distance(upperLip, lowerLip);
    const horizontal = distance(leftMouth, rightMouth);

    if (horizontal === 0) {
        return 0;
    }

    return vertical / horizontal;
}

function getFeedback(mouthOpen: number) {
    if (mouthOpen < 0.18) {
        return "Abra mais a boca";
    }

    if (mouthOpen > 0.45) {
        return "Feche mais a boca";
    }

    return "Muito bom, mantenha assim";
}

async function processFrame(imageBase64: string) {
    if (!detector) {
        throw new Error("Detector ainda não carregado");
    }

    const { tensor, width, height } = decodeJpegToTensor(imageBase64);

    try {
        const faces = await detector.estimateFaces(tensor);

        if (!faces.length) {
            return {
                type: "exercise_feedback",
                feedback: "Nenhum rosto detectado",
                mouthOpen: 0,
                landmarks: [],
            };
        }

        const face = faces[0];

        const landmarks: Landmark[] = face.keypoints.map((point) => ({
            x: point.x / width,
            y: point.y / height,
            z: point.z,
        }));

        const mouthOpen = calculateMouthOpen(landmarks);

        return {
            type: "exercise_feedback",
            feedback: getFeedback(mouthOpen),
            mouthOpen,
            landmarks,
            imageWidth: width,
            imageHeight: height,
        };
    } finally {
        tensor.dispose();
    }
}

async function startServer() {
    await tf.setBackend("cpu");
    await tf.ready();

    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;

    detector = await faceLandmarksDetection.createDetector(model, {
        runtime: "tfjs",
        refineLandmarks: true,
        maxFaces: 1,
    });

    console.log("Modelo de landmarks faciais carregado");

    const server = http.createServer(app);

    const wss = new WebSocketServer({
        server,
        path: "/exercise",
    });

    wss.on("connection", (ws) => {
        console.log("Cliente conectado ao WebSocket");

        let processing = false;

        ws.send(
            JSON.stringify({
                type: "connected",
                message: "WebSocket conectado com sucesso",
            })
        );

        ws.on("message", async (message) => {
            try {
                const data = JSON.parse(message.toString());

                if (data.type !== "frame") {
                    return;
                }

                if (!data.image) {
                    return;
                }

                if (processing) {
                    return;
                }

                processing = true;

                const response = await processFrame(data.image);

                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(response));
                }
            } catch (error) {
                console.log("Erro ao processar frame:", error);

                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(
                        JSON.stringify({
                            type: "exercise_feedback",
                            feedback: "Erro ao processar imagem",
                            mouthOpen: 0,
                            landmarks: [],
                        })
                    );
                }
            } finally {
                processing = false;
            }
        });

        ws.on("close", () => {
            console.log("Cliente desconectado do WebSocket");
        });

        ws.on("error", (error) => {
            console.log("Erro no WebSocket:", error);
        });
    });

    const PORT = 3000;

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`API rodando em http://localhost:${PORT}`);
        console.log(`WebSocket rodando em ws://localhost:${PORT}/exercise`);
    });
}

startServer();