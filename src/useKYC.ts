import { useState } from 'react';
import { Alert } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { EKYCConfig } from './types'


// javascript

// const DEFAULT_OPTIONS = {
//     deptCode: '',
//     integrationKey: '',
//     integrationPassword: '',
//     appGuid: '',
//     applicationId: '',
//     userId: '',
//     responseRedirectURL: '',
//     applicationRedirectURL: '',
//     ENCRYPT_RESPONSE_URL:'',
//     REMOTE_URL:'',
//     encDecType:'',

// };

// typeScript
const DEFAULT_OPTIONS: Required<EKYCConfig> = {
    deptCode: '',
    integrationKey: '',
    integrationPassword: '',
    appGuid: '',
    applicationId: '',
    userId: '',
    responseRedirectURL: '',
    applicationRedirectURL: '',
    ENCRYPT_RESPONSE_URL: '',
    REMOTE_URL: '',
    encDecType: '',
};


const useEKYC = (userConfig = {}) => {
    const config = { ...DEFAULT_OPTIONS, ...userConfig };

    // const validation = validateEKYCConfig(config);
    // if (!validation.valid) {
    //     throw new Error(`[useEKYC] ${validation.message}`);
    // }

    const [htmlContent, setHtmlContent] = useState<string>('');
    const [encDecValue, setEncDecValue] = useState<string>('');
    const [loader, setLoader] = useState<boolean>(false);
    const [remoteUrl, setRemoteUrl] = useState<string>('');

    const handleSubmit = async (): Promise<void> => {

        setLoader(true);
        const transactionNumber = uuidv4();
        console.log('Transaction Number:', transactionNumber);

        const currentDateTime = new Date()
            .toISOString()
            .replace(/[-T:Z.]/g, '')
            .slice(0, 14);
        console.log('Current DateTime:', currentDateTime);

        const aadhaarEkyc = {
            INPUT_ENC_DEC_VALUE: JSON.stringify({
                deptCode: config.deptCode,
                integrationKey: config.integrationKey,
                integrationPassword: config.integrationPassword,
                txnNo: transactionNumber,
                txnDateTime: currentDateTime,
                serviceCode: '3',
                responseRedirectURL: config.responseRedirectURL,
                APP_GUID: config.appGuid,
                APPLICATION_ID: config.applicationId,
                UserId: config.userId,
                APPLICATION_REQUEST_ID: transactionNumber,
                APPLICATION_REDIRECT_URL: config.applicationRedirectURL,
            }),
            ENC_DEC_TYPE: config.encDecType,
        };

        try {
            // Step 1: Encrypt the Aadhaar KYC payload
            const encryptionResponse = await fetch(
                config.ENCRYPT_RESPONSE_URL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify(aadhaarEkyc),
                },
            );
            console.log("encryptionResponse", encryptionResponse);

            if (!encryptionResponse.ok) {
                const errorText = await encryptionResponse.text();
                console.error(
                    'Encryption API Error:',
                    encryptionResponse.status,
                    errorText,
                );
                Alert.alert(
                    'Encryption Error',
                    `Failed to encrypt request (${encryptionResponse.status}): ${errorText}`,
                );
                setLoader(false);
                return;
            }

            const encryptionResultText = await encryptionResponse.text();
            setEncDecValue(encryptionResultText);

            let encryptionResult;
            try {
                encryptionResult = JSON.parse(encryptionResultText);
            } catch (err) {
                console.error('Invalid JSON in encryption response:', err);
                Alert.alert(
                    'Server Error',
                    'Unexpected response format from encryption API.',
                );
                setLoader(false);
                return;
            }

            const encDecValue = encryptionResult?.ENC_DEC_VALUE;
            if (!encDecValue) {
                Alert.alert(
                    'Encryption Error',
                    'encDecValue not returned from encryption API',
                );
                setLoader(false);
                return;
            }

            const remoteUrl = config.REMOTE_URL;;
            const html = `
            <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
            <script>
             function relayFromIframe() {
                 const iframe = document.getElementById("responseFrame");
             try {
             const content = iframe.contentWindow.document.body.outerHTML;
             window.ReactNativeWebView.postMessage(content);

              } catch (e) {
              window.ReactNativeWebView.postMessage("ERROR: Unable to read iframe content");
             }
             }

            </script>
            <body onload="document.forms[0].submit()">
              <form method="POST" action="${remoteUrl}">
                <input type="hidden" name="RP_CEG_AAHDAAR_REQUEST" value='${encDecValue}' />
              </form>
                    <iframe id="responseFrame" name="responseFrame" style="display:none;"></iframe>

            </body></html>
          `;
            setRemoteUrl(remoteUrl);
            setHtmlContent(html);
        } catch (err) {
            // console.error('Fetch error:', err);
            // Alert.alert('API Error', err.message || 'An unexpected error occurred.');
            Alert.alert('API Error', err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setLoader(false);
        }
    };

    return {
        htmlContent,
        handleSubmit,
        remoteUrl,
        encDecValue,
        loader, // <-- let your component use this
    };
};

export default useEKYC;
