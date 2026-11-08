import ScreenContainer from '../components/ScreenContainer';
import { StyleSheet, Text, StatusBar } from 'react-native';
import React from 'react';
import AnimatedLottieView from 'lottie-react-native';
const Splash = () => {
  return <ScreenContainer style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fae951'
  }}>
      <StatusBar hidden />
      <AnimatedLottieView resizeMode="contain" style={{
      height: 200,
      width: 200
    }} autoPlay source={require('../assets/126684-drawing-and-coloring-icon.json')}></AnimatedLottieView>
      <Text style={{
      color: 'brown',
      fontSize: 21,
      fontFamily: 'Poppins-Bold'
    }}>
        ABC2 Kids
      </Text>
    </ScreenContainer>;
};
export default Splash;
const styles = StyleSheet.create({});
