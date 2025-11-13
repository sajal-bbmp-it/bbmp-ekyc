"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_webview_1 = require("react-native-webview");
const native_1 = require("@react-navigation/native");
const EKYCForm = ({ route }) => {
    const webViewRef = (0, react_1.useRef)(null);
    const navigation = (0, native_1.useNavigation)();
    const { htmlContent, loader, remoteUrl, encDecValue } = route.params || {};
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [modalVisible, setModalVisible] = (0, react_1.useState)(false);
    const [result, setResult] = (0, react_1.useState)(null);
    const injectedJavaScript = `
  (function() {
    function sendMessage(type, content) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, content }));
    }

    sendMessage('debug', 'React Native injectedJavaScript started.');

    function attemptGetDataFromHiddenFields() {
      try {
        var RS_AadhaarDetails = document.getElementById("HiddenField1")?.value || null;
        var RS_StatusDetails = document.getElementById("HiddenField2")?.value || null;

        if (RS_AadhaarDetails && RS_StatusDetails) {
          var combinedData = RS_AadhaarDetails + "|" + RS_StatusDetails;
          sendMessage('debug', 'Hidden fields found, sending combined data: ' + combinedData);
          sendMessage('aadhaar_data_ready', combinedData);
          return true;
        } else {
          sendMessage('debug', 'Hidden fields not found yet.');
          return false;
        }
      } catch (e) {
        sendMessage('error', 'Error in scraping hidden fields: ' + e.message);
        return false;
      }
    }

    let dataFound = false;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      if (!dataFound) {
        dataFound = attemptGetDataFromHiddenFields();
        if (dataFound) {
          observerInstance.disconnect();
          sendMessage('debug', 'Observer disconnected after data found.');
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    if (!attemptGetDataFromHiddenFields()) {
      setTimeout(() => {
        if (!dataFound) {
          sendMessage('debug', 'Timeout reached, data not found, observer disconnecting.');
          observer.disconnect();
        }
      }, 10000);
    }
  })();
  true;
`;
    //new
    const onMessage = (event) => {
        var _a, _b, _c, _d;
        const rawData = event.nativeEvent.data;
        console.log("Message from WebView (Raw):", rawData);
        try {
            const parsedData = JSON.parse(rawData);
            if (parsedData.type === 'debug') {
                console.log("DEBUG MESSAGE from WebView:", parsedData.content);
            }
            else if (parsedData.type === 'error') {
                console.error("WEBVIEW ERROR:", parsedData.message);
                react_native_1.Alert.alert("WebView Error", parsedData.message);
            }
            else if (parsedData.type === 'aadhaar_data_ready' && parsedData.content) {
                const dataString = parsedData.content;
                const responseParts = dataString.split('|');
                if (responseParts.length === 2) {
                    const ekycJsonStr = responseParts[0];
                    const statusJsonStr = responseParts[1];
                    try {
                        const ekycData = JSON.parse(ekycJsonStr);
                        const statusData = JSON.parse(statusJsonStr);
                        const newResult = {
                            verify: statusData.status === "Success",
                            name: ((_a = ekycData.eKYCData) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                            localName: ((_b = ekycData.localKYCData) === null || _b === void 0 ? void 0 : _b.name) || 'N/A',
                            aadhaarNo: ekycData.maskedAadhaar || 'N/A',
                            txnNo: ekycData.txnNo || 'N/A',
                            vaultRefNo: statusData.vaultrefno || 'N/A',
                        };
                        setResult(newResult);
                        setModalVisible(true);
                        setLoading(false);
                        console.log("✅ Successfully parsed Aadhaar data:", newResult);
                        // navigation.emit({
                        //   type: 'onEKYCComplete',
                        //   data: newResult,
                        //   index: route.params?.ekycIndex, // sent from project-level
                        // });
                        (_c = navigation.getParent()) === null || _c === void 0 ? void 0 : _c.emit({
                            type: 'ekycComplete',
                            data: {
                                result: newResult,
                                index: (_d = route.params) === null || _d === void 0 ? void 0 : _d.ekycIndex,
                            },
                        });
                    }
                    catch (jsonParseError) {
                        console.error("❌ Error parsing eKYC JSON:", jsonParseError);
                        react_native_1.Alert.alert("Data Error", "Failed to parse Aadhaar EKYC JSON.");
                    }
                }
                else {
                    console.warn("Unexpected Aadhaar response format:", dataString);
                    react_native_1.Alert.alert("Data Format Warning", "Unexpected data format from Aadhaar page.");
                }
            }
        }
        catch (e) {
            console.error("❌ WebView message parsing failed:", e, "Raw data:", rawData);
        }
    };
    const closeModal = () => {
        setModalVisible(false);
        navigation.goBack();
    };
    return (<react_native_1.View style={{ flex: 1 }}>
      {(loading || loader) && (<react_native_1.View style={styles.loaderContainer}>
          <react_native_1.ActivityIndicator size="large" color="#0000ff"/>
        </react_native_1.View>)}

      {htmlContent && (<react_native_webview_1.WebView ref={webViewRef} originWhitelist={['*']} source={{ html: htmlContent }} onLoadEnd={() => setLoading(false)} onMessage={onMessage} injectedJavaScript={injectedJavaScript} javaScriptEnabled={true} domStorageEnabled mixedContentMode="always"/>)}

      <react_native_1.Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <react_native_1.View style={styles.modalBackground}>
          <react_native_1.View style={styles.modalContainer}>
            <react_native_1.ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
              <react_native_1.Text style={[
            styles.statusText,
            (result === null || result === void 0 ? void 0 : result.verify) ? styles.successText : styles.failureText,
        ]}>
                {(result === null || result === void 0 ? void 0 : result.verify) ? '✅ Aadhaar Verified' : '❌ Verification Failed'}
              </react_native_1.Text>

              {(result === null || result === void 0 ? void 0 : result.verify) ? (<>
                  {/* <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{result.name || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Local Name:</Text>
              <Text style={styles.value}>{result.localName || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Masked Aadhaar:</Text>
              <Text style={styles.value}>{result.aadhaarNo || 'N/A'}</Text>
            </View> */}
                </>) : (<react_native_1.Text style={styles.failureMessage}>
                  Sorry, the Aadhaar verification failed. Please try again.
                </react_native_1.Text>)}

              <react_native_1.TouchableOpacity style={styles.button} onPress={closeModal}>
                <react_native_1.Text style={styles.buttonText}>Done</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.ScrollView>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.View>);
};
const styles = react_native_1.StyleSheet.create({
    loaderContainer: Object.assign(Object.assign({}, react_native_1.StyleSheet.absoluteFillObject), { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', zIndex: 10 }),
    modalBackground: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        maxHeight: '80%',
        elevation: 5,
    },
    statusText: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
    },
    successText: {
        color: 'green',
    },
    failureText: {
        color: 'red',
    },
    row: {
        flexDirection: 'row',
        marginVertical: 8,
    },
    label: {
        flex: 1,
        fontWeight: '600',
        fontSize: 16,
    },
    value: {
        flex: 2,
        fontSize: 16,
    },
    failureMessage: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginVertical: 15,
    },
    button: {
        marginTop: 25,
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        alignSelf: 'center',
        width: '50%',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
});
exports.default = EKYCForm;
// const onMessage = (event: WebViewMessageEvent)  => {
//   const rawData = event.nativeEvent.data;
//   console.log("Message from WebView (Raw):", rawData);
//   try {
//       const parsedData = JSON.parse(rawData);
//       if (parsedData.type === 'debug') {
//           console.log("DEBUG MESSAGE from WebView:", parsedData.content);
//       } else if (parsedData.type === 'error') {
//           console.error("WEBVIEW ERROR:", parsedData.message);
//           Alert.alert("WebView Error", parsedData.message);
//       } else if (parsedData.type === 'aadhaar_data_ready' && parsedData.content) { // Look for 'aadhaar_data_ready'
//           const dataString = parsedData.content; // This is the "ekycJsonStr|StatusData" string
//           const responseParts = dataString.split('|');
//           if (responseParts.length === 2) {
//               const ekycJsonStr = responseParts[0];
//               const statusJsonStr = responseParts[1];
//               try {
//                   const ekycData = JSON.parse(ekycJsonStr);
//                   const statusData = JSON.parse(statusJsonStr);
//                   const newResult = {
//                       verify: statusData.status === "Success",
//                       name: ekycData.eKYCData?.name || 'N/A',
//                       localName: ekycData.localKYCData?.name || 'N/A',
//                       aadhaarNo: ekycData.maskedAadhaar || 'N/A',
//                       txnNo: ekycData.txnNo || 'N/A',
//                       vaultRefNo: statusData.vaultrefno || 'N/A',
//                   };
//                   setResult(newResult);
//                   setModalVisible(true);
//                   setLoading(false);
//                   console.log("Successfully parsed and set Aadhaar data:", newResult);
//               } catch (jsonParseError) {
//                   console.error("RN WebView Error parsing eKYC or Status JSON:", jsonParseError);
//                   Alert.alert("Data Error", "Failed to parse Aadhaar EKYC or Status JSON from WebView.");
//               }
//           } else {
//               console.warn("RN WebView Unexpected Aadhaar response format:", dataString);
//               Alert.alert("Data Format Warning", "Received unexpected data format from Aadhaar page.");
//           }
//       }
//       // ... handle other message types if any
//   } catch (e) {
//       console.error("RN WebView Error parsing raw WebView message (not JSON?):", e, "Raw data:", rawData);
//   }
// };
