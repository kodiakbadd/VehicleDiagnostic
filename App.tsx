/**
 * VW Tiguan Bluetooth Connectivity App
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import BluetoothSerial from 'react-native-bluetooth-serial';

interface Device {
  id: string;
  name: string;
}

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkBluetoothEnabled();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        ]);
        console.log('Permissions granted:', granted);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const checkBluetoothEnabled = async () => {
    try {
      const enabled = await BluetoothSerial.isEnabled();
      setIsEnabled(enabled);
    } catch (error) {
      console.log(error);
    }
  };

  const enableBluetooth = async () => {
    try {
      await BluetoothSerial.enable();
      setIsEnabled(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to enable Bluetooth');
    }
  };

  const scanDevices = async () => {
    try {
      const unpaired = await BluetoothSerial.listUnpairedDevices();
      setDevices(unpaired);
    } catch (error) {
      Alert.alert('Error', 'Failed to scan devices');
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
      await BluetoothSerial.connect(device.id);
      setConnectedDevice(device);
      Alert.alert('Connected', `Connected to ${device.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to connect');
    }
  };

  const sendCommand = async () => {
    if (!connectedDevice) return;
    try {
      // Example OBD command: Get supported PIDs
      await BluetoothSerial.write('0100\r');
      const data = await BluetoothSerial.readFromDevice();
      Alert.alert('Response', data);
    } catch (error) {
      Alert.alert('Error', 'Failed to send command');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VW Tiguan Bluetooth Connector</Text>
      {!isEnabled && (
        <TouchableOpacity style={styles.button} onPress={enableBluetooth}>
          <Text style={styles.buttonText}>Enable Bluetooth</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.button} onPress={scanDevices}>
        <Text style={styles.buttonText}>Scan Devices</Text>
      </TouchableOpacity>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.device}
            onPress={() => connectToDevice(item)}
          >
            <Text>{item.name || 'Unknown Device'}</Text>
          </TouchableOpacity>
        )}
      />
      {connectedDevice && (
        <View>
          <Text>Connected to: {connectedDevice.name}</Text>
          <TouchableOpacity style={styles.button} onPress={sendCommand}>
            <Text style={styles.buttonText}>Send OBD Command</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  device: {
    backgroundColor: 'white',
    padding: 10,
    marginVertical: 2,
    borderRadius: 5,
  },
});

export default App;
