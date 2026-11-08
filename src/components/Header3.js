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
  
  const Header3 = ({navigation, text, color, fontFamily, backgroundColor, fontSize }) => {
    return (
      <View
        style={[{
          width: '100%',
          height: 70,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor:'rgba(39, 55, 77, 0.8)'
        },{backgroundColor:backgroundColor}]}>
          {/* {console.log(text)} */}
          <TouchableOpacity onPress={() => { navigation.goBack(); }}>
        <BackIcon style=
          {{width: 40, height: 50}} />
          </TouchableOpacity>
        <Animatable.Text
          animation="pulse"
          easing="ease-out"
          iterationCount="infinite"
          duration={3000}
          style={[{color: 'black', fontSize: 20, fontFamily: bungee},{color:color, fontFamily:fontFamily, fontSize:fontSize}]}>
          {text}
        </Animatable.Text>
        {/* <Text style={{color:'green', fontSize:40, fontFamily:bungee}}>Drag Letters</Text> */}
        <Animatable.Image
          animation="pulse"
          easing="ease-out"
          iterationCount="infinite"
          resizeMode='contain' source={require('../assets/caractor.png')} 
          style={{width: 40, height: 50}}/>
      </View>
    );
  };
  
  export default Header3;
  
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
  