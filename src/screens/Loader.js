import ScreenContainer from '../components/ScreenContainer';
import { StyleSheet, Text, } from 'react-native'
import React,{useEffect} from 'react'
import AnimatedLottieView from 'lottie-react-native'
import SoundPlayer from '../utills/SoundPlayer'

const Loader = () => {
 
  return (
    <ScreenContainer style={{flex:1,justifyContent:'center',alignItems:"center",backgroundColor:'white',}}>
      <AnimatedLottieView style={{width:'100%'}} autoPlay loop  speed={5} source={require('../assets/1710-balloons-with-string.json')}></AnimatedLottieView>
    </ScreenContainer>
  )
}

export default Loader

const styles = StyleSheet.create({})