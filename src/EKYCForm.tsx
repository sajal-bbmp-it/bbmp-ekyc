import React, { useState, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { WebView,WebViewMessageEvent } from 'react-native-webview';
import { useNavigation,NavigationProp } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';

type AadhaarResult = {
  verify: boolean;
  name: string;
  localName: string;
  aadhaarNo: string;
  txnNo: string;
  vaultRefNo: string;
};
type EKYCParams = {
  htmlContent: string;
  loader: boolean;
  remoteUrl: string;
  encDecValue: string;
};
type EKYCFormProps = {
  route: RouteProp<{ params: EKYCParams }, 'params'>;
};

const EKYCForm : React.FC<EKYCFormProps> = ({ route }) => {

  const webViewRef = useRef<WebView>(null);
  const navigation = useNavigation<NavigationProp<any>>();
  const { htmlContent, loader, remoteUrl, encDecValue } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [result, setResult] = useState<AadhaarResult | null>(null);
 


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



const onMessage = (event: WebViewMessageEvent)  => {
  const rawData = event.nativeEvent.data;
  console.log("Message from WebView (Raw):", rawData);

  try {
      const parsedData = JSON.parse(rawData);

      if (parsedData.type === 'debug') {
          console.log("DEBUG MESSAGE from WebView:", parsedData.content);
      } else if (parsedData.type === 'error') {
          console.error("WEBVIEW ERROR:", parsedData.message);
          Alert.alert("WebView Error", parsedData.message);
      } else if (parsedData.type === 'aadhaar_data_ready' && parsedData.content) { // Look for 'aadhaar_data_ready'
          const dataString = parsedData.content; // This is the "ekycJsonStr|StatusData" string

          const responseParts = dataString.split('|');
          if (responseParts.length === 2) {
              const ekycJsonStr = responseParts[0];
              const statusJsonStr = responseParts[1];

              try {
                  const ekycData = JSON.parse(ekycJsonStr);
                  const statusData = JSON.parse(statusJsonStr);

                  const newResult = {
                      verify: statusData.status === "Success",
                      name: ekycData.eKYCData?.name || 'N/A',
                      localName: ekycData.localKYCData?.name || 'N/A',
                      aadhaarNo: ekycData.maskedAadhaar || 'N/A',
                      txnNo: ekycData.txnNo || 'N/A',
                      vaultRefNo: statusData.vaultrefno || 'N/A',
                  };

                  setResult(newResult);
                  setModalVisible(true);
                  setLoading(false);
                  console.log("Successfully parsed and set Aadhaar data:", newResult);

              } catch (jsonParseError) {
                  console.error("RN WebView Error parsing eKYC or Status JSON:", jsonParseError);
                  Alert.alert("Data Error", "Failed to parse Aadhaar EKYC or Status JSON from WebView.");
              }
          } else {
              console.warn("RN WebView Unexpected Aadhaar response format:", dataString);
              Alert.alert("Data Format Warning", "Received unexpected data format from Aadhaar page.");
          }
      }
      // ... handle other message types if any
  } catch (e) {
      console.error("RN WebView Error parsing raw WebView message (not JSON?):", e, "Raw data:", rawData);
  }
};
  

  const closeModal = () => {
    setModalVisible(false);
   navigation.goBack();
    
  };

  return (
    <View style={{ flex: 1 }}>
      {(loading || loader) && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {htmlContent && (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          onLoadEnd={() => setLoading(false)}
          onMessage={onMessage}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled = {true}
          domStorageEnabled
          mixedContentMode="always"
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
              <Text
                style={[
                  styles.statusText,
                  result?.verify ? styles.successText : styles.failureText,
                ]}
              >
                {result?.verify ? '✅ Aadhaar Verified' : '❌ Verification Failed'}
              </Text>

              {result?.verify ? (
                <>
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
                </>
              ) : (
                <Text style={styles.failureMessage}>
                  Sorry, the Aadhaar verification failed. Please try again.
                </Text>
              )}

              <TouchableOpacity style={styles.button} onPress={closeModal}>
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
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

export default EKYCForm;
