
bbmp-ekyc 

A lightweight Node.js package for eKYC processing for BBMP Projects


## Installation

Install Package  

```bash
  npm install github:BBMP-IT/bbmp-ekyc
```
## Installation others dependencies
```bash
  npm install react-native-webview
  npm install axios 
  npm install uuid  
  npm i react-native-get-random-values        
  npm i @react-native/new-app-screen
```
## Dependencies

npm install
    react@^17.0.0 \
    react-native@^0.64.0 \
    react-native-get-random-values@^1.11.0 \
    react-native-webview@^12.0.0\
    uuid: "^9.0.0"\
    axios": "^1.10.0"

## Usage
```bash
##Parent screen 
import React,{useState,useEffect} from 'react';
import { View, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useEKYC } from 'bbmp-ekyc';  // import after install this package
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [shouldNavigate, setShouldNavigate] = useState(false);

  useEffect(() => {
    if (shouldNavigate && htmlContent && remoteUrl && encDecValue && !loader) {
      navigation.navigate('EKYCForm', {
        htmlContent,
        loader,
        remoteUrl,
        encDecValue,
      });
      setShouldNavigate(false); 
    }
  }, [shouldNavigate, htmlContent, remoteUrl, encDecValue, loader]);


  const {
    htmlContent,
    handleSubmit,
    remoteUrl,
    encDecValue,
    loader,
  } = useEKYC({
    deptCode: 'XXXXXXX', // pass actual code
    integrationKey: 'XXXXXXXXX',// pass actual key
    integrationPassword: 'XXXXXXXXX', //pass actual password
    appGuid: '',////Pass actual 
    applicationId: 'XXXXX',////Pass actual 
    userId: 'XXXX',
    responseRedirectURL:'https://Somethimg.com',// pass actual URL
    applicationRedirectURL:'https://Somethimg.com',// Pass actual URL
    ENCRYPT_RESPONSE_URL: '',//Pass actual 
    REMOTE_URL:'',//Pass actual 
    encDecType: 'ABCD>>>',//Pass actual 

  });

 

  const handleGoToEKYC = async () => {
    try {
      await handleSubmit();
      setShouldNavigate(true);
    } catch (error) {
      Alert.alert('eKYC Error', error.message || 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      {loader ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Go to eKYC Form" onPress={handleGoToEKYC} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});

export default HomeScreen;

##
# AppNavigator
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../Screen/Home';
import { EKYCForm } from 'bbmp-ekyc'; // import after install package 

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="EKYCForm" component={EKYCForm} />// **dont forget to add this screen ****//
      //** Dont modify component name(EKYCForm)//
     
    </Stack.Navigator>
  );
};

export default AppNavigator;

## App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
const App = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;




```

    



