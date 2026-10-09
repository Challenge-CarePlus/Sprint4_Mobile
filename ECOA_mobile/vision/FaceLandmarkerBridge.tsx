import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";

import { getMediaPipeHtmlUri } from "./mediapipeAssets";

export type Blendshape = {
    name: string;
    score: number;
};

export type FaceLandmarkerResultMessage = {
    type: "result";
    requestId: string;
    sentAt: number;
    receivedAt: number;
    completedAt: number;
    faceDetected: boolean;
    blendshapes: Blendshape[];
};

type ReadyMessage = { type: "ready" };

type ErrorMessage = {
    type: "error";
    requestId?: string;
    stage?: string;
    message: string;
};

type BridgeMessage = ReadyMessage | FaceLandmarkerResultMessage | ErrorMessage;

export type FaceLandmarkerBridgeHandle = {
    detectFrame: (base64Jpeg: string) => string;
};

type Props = {
    onReady?: () => void;
    onResult?: (result: FaceLandmarkerResultMessage) => void;
    onError?: (message: string) => void;
};

let requestCounter = 0;

const FaceLandmarkerBridge = forwardRef<FaceLandmarkerBridgeHandle, Props>(
    ({ onReady, onResult, onError }, ref) => {
        const webViewRef = useRef<WebView>(null);
        const [htmlUri, setHtmlUri] = useState<string | null>(null);

        useEffect(() => {
            let isActive = true;

            getMediaPipeHtmlUri()
                .then((uri) => {
                    if (isActive) {
                        setHtmlUri(uri);
                    }
                })
                .catch((error) => {
                    if (isActive) {
                        onError?.(String(error));
                    }
                });

            return () => {
                isActive = false;
            };
        }, [onError]);

        useImperativeHandle(ref, () => ({
            detectFrame: (base64Jpeg: string) => {
                const requestId = `f${++requestCounter}`;

                webViewRef.current?.postMessage(
                    JSON.stringify({
                        type: "frame",
                        requestId,
                        image: base64Jpeg,
                        sentAt: Date.now(),
                    })
                );

                return requestId;
            },
        }));

        function handleMessage(event: WebViewMessageEvent) {
            let data: BridgeMessage;

            try {
                data = JSON.parse(event.nativeEvent.data);
            } catch (error) {
                onError?.(`Mensagem inválida da WebView: ${String(error)}`);
                return;
            }

            if (data.type === "ready") {
                onReady?.();
            } else if (data.type === "result") {
                onResult?.(data);
            } else if (data.type === "error") {
                onError?.(data.message);
            }
        }

        if (!htmlUri) {
            return null;
        }

        return (
            <WebView
                ref={webViewRef}
                source={{ uri: htmlUri }}
                originWhitelist={["*"]}
                onMessage={handleMessage}
                onError={(event) => onError?.(event.nativeEvent.description)}
                javaScriptEnabled
                domStorageEnabled
                allowFileAccess
                allowFileAccessFromFileURLs
                allowUniversalAccessFromFileURLs
                mixedContentMode="always"
                style={styles.hidden}
            />
        );
    }
);

FaceLandmarkerBridge.displayName = "FaceLandmarkerBridge";

const styles = StyleSheet.create({
    hidden: {
        position: "absolute",
        top: -1000,
        width: 1,
        height: 1,
        opacity: 0,
    },
});

export default FaceLandmarkerBridge;
