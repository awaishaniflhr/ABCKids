import BackIcon from './BackIcon';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import React from 'react';
import {Becak, Oi, broth, bungee, rampart, strezy} from '../utills/fonts';
import * as Animatable from 'react-native-animatable';

const Header2 = ({navigation, text, color, fontFamily, backgroundColor, fontSize }) => {
  return (
    <View
      style={{
        width: '100%',
        height: 70,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
      }}>
      {/* {console.log(text.text)} */}

      <TouchableOpacity onPress={() => { navigation.goBack(); }}>
      <BackIcon style={{width: 50, height: 50}} />
      </TouchableOpacity>
      <Animatable.Text
        animation="pulse"
        easing="ease-out"
        iterationCount="infinite"
        style={{color: 'green', fontSize: 40, fontFamily: bungee}}>
        {text.text}
      </Animatable.Text>
      {/* <Text style={{color:'green', fontSize:40, fontFamily:bungee}}>Drag Letters</Text> */}
      <Animatable.Image
        animation="pulse"
        easing="ease-out"
        iterationCount="infinite"
        resizeMode="contain"
        source={require('../assets/caractor.png')}
        style={{width: 50, height: 70}}
      />
    </View>
  );
};

export default Header2;

const styles = StyleSheet.create({
  MenuButton: {
    backgroundColor: '#c98dff',
    width: 50,
    height: 40,
    borderRadius: 30,
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'black',

    padding: 5,
  },
});
